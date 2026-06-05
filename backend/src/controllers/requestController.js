const mongoose             = require("mongoose");
const Request              = require("../models/Request");
const AuditLog             = require("../models/AuditLog");
const Notification         = require("../models/Notification");
const { buildApprovalChain }  = require("../services/workflowEngine");
const { calcPriorityScore, calcSlaDeadline } = require("../utils/priorityCalc");
const { generateRequestId }   = require("../utils/requestIdGen");

// POST /api/requests
async function createRequest(req, res, next) {
  try {
    const { type, title, description, priority, department, amount } = req.body;
    if (!type || !title || !description || !department) {
      return res.status(400).json({ message: "type, title, description, department are required" });
    }

    const requestId      = await generateRequestId(department);
    const priorityScore  = calcPriorityScore(priority);
    const createdAt      = new Date();
    const slaDeadline    = calcSlaDeadline(priority, createdAt);
    const approvalChain  = await buildApprovalChain(
      req.user._id, department, type, Number(amount) || 0
    );

    const request = await Request.create({
      requestId,
      type,
      title,
      description,
      priority:        priority || "medium",
      priorityScore,
      status:          approvalChain.length > 0 ? "inprogress" : "approved",
      requestedBy:     req.user._id,
      department,
      approvalChain,
      currentStep:     0,
      currentApprover: approvalChain[0] || null,
      slaDeadline,
      amount:          Number(amount) || 0,
      lastActionAt:    createdAt,
    });

    await AuditLog.create({
      requestId:   request._id,
      action:      "created",
      performedBy: req.user._id,
      step:        0,
      timestamp:   createdAt,
    });

    if (approvalChain[0]) {
      await Notification.create({
        userId:    approvalChain[0],
        requestId: request._id,
        message:   `New ${type} request requires your approval: "${title}"`,
        type:      "approval",
      });
    }

    res.status(201).json({ request });
  } catch (err) { next(err); }
}

// GET /api/requests
async function getRequests(req, res, next) {
  try {
    const { status, priority, limit = 100, queue } = req.query;
    const filter = {};

    const userId = new mongoose.Types.ObjectId(req.user._id);

    if (req.user.role === "employee") {
      // employee sees only their own requests
      filter.requestedBy = userId;
    } else if (req.user.role === "manager" || req.user.role === "hod") {
      if (queue === "mine") {
        // requests waiting for this manager's action
        filter.currentApprover = userId;
        filter.status = { $in: ["inprogress", "escalated"] };
      } else {
        // all requests in their department
        filter.department = req.user.department;
      }
    }
    // admin — no filter, sees everything

    if (status   && status   !== "all") filter.status   = status;
    if (priority && priority !== "all") filter.priority = priority;

    console.log("📋 getRequests filter:", JSON.stringify(filter));
    console.log("👤 user role:", req.user.role, "| _id:", req.user._id);

    const requests = await Request.find(filter)
      .populate("requestedBy",    "name employeeId designation")
      .populate("currentApprover","name designation")
      .sort({ priorityScore: 1, createdAt: -1 })
      .limit(Number(limit));

    console.log("📊 found:", requests.length, "requests");

    res.json({ requests, total: requests.length });
  } catch (err) { next(err); }
}

// GET /api/requests/:id
async function getRequestById(req, res, next) {
  try {
    const request = await Request.findById(req.params.id)
      .populate("requestedBy",    "name employeeId department designation")
      .populate("currentApprover","name designation role")
      .populate("approvalChain",  "name designation role department");

    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json({ request });
  } catch (err) { next(err); }
}

// GET /api/requests/:id/audit
async function getAuditLog(req, res, next) {
  try {
    const auditLogs = await AuditLog.find({ requestId: req.params.id })
      .populate("performedBy", "name designation role")
      .sort({ timestamp: 1 });
    res.json({ auditLogs });
  } catch (err) { next(err); }
}

// PUT /api/requests/:id/action
async function actionOnRequest(req, res, next) {
  try {
    const { action, comment } = req.body;

    if (!["approve", "reject", "delegate"].includes(action)) {
      return res.status(400).json({ message: "action must be: approve, reject, or delegate" });
    }
    if (action === "reject" && !comment?.trim()) {
      return res.status(400).json({ message: "Rejection reason (comment) is required" });
    }

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (!request.currentApprover ||
        request.currentApprover.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not the current approver for this request" });
    }
    if (!["inprogress", "escalated"].includes(request.status)) {
      return res.status(400).json({ message: "Request is already closed" });
    }

    const now = new Date();

    await AuditLog.create({
      requestId:   request._id,
      action,
      performedBy: req.user._id,
      comment:     comment || "",
      step:        request.currentStep,
      timestamp:   now,
    });

    if (action === "reject") {
      request.status          = "rejected";
      request.currentApprover = null;
      request.lastActionAt    = now;

      await Notification.create({
        userId:    request.requestedBy,
        requestId: request._id,
        message:   `Your ${request.type} request "${request.title}" was rejected. Reason: ${comment}`,
        type:      "rejection",
      });

    } else if (action === "approve") {
      const nextStep = request.currentStep + 1;

      if (nextStep >= request.approvalChain.length) {
        request.status          = "approved";
        request.currentApprover = null;
        request.lastActionAt    = now;

        await Notification.create({
          userId:    request.requestedBy,
          requestId: request._id,
          message:   `Your ${request.type} request "${request.title}" has been fully approved!`,
          type:      "approval",
        });
      } else {
        request.currentStep     = nextStep;
        request.currentApprover = request.approvalChain[nextStep];
        request.status          = "inprogress";
        request.lastActionAt    = now;

        await Notification.create({
          userId:    request.approvalChain[nextStep],
          requestId: request._id,
          message:   `${request.type} request "${request.title}" requires your approval`,
          type:      "approval",
        });
      }
    }

    await request.save();
    res.json({ message: `Request ${action}d successfully`, request });
  } catch (err) { next(err); }
}

module.exports = { createRequest, getRequests, getRequestById, getAuditLog, actionOnRequest };