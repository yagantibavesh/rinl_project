const mongoose             = require("mongoose");
const Request              = require("../models/Request");
const AuditLog             = require("../models/AuditLog");
const Notification         = require("../models/Notification");
const { buildApprovalChain, getTeamMembers } = require("../services/workflowEngine");
const { calcPriorityScore, calcSlaDeadline } = require("../utils/priorityCalc");
const { generateRequestId }   = require("../utils/requestIdGen");

// ── Helper: notify multiple users ────────────────────────────────────
async function notifyUsers(userIds, requestId, message, type) {
  const notifications = userIds
    .filter(id => id)
    .map(userId => ({ userId, requestId, message, type }));
  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }
}

// POST /api/requests ─────────────────────────────────────────────────
async function createRequest(req, res, next) {
  try {
    const { type, subType, title, description, priority, amount } = req.body;

    if (!type || !title || !description) {
      return res.status(400).json({ message: "type, title, description are required" });
    }

    const requestId     = await generateRequestId(req.user.department);
    const priorityScore = calcPriorityScore(priority);
    const createdAt     = new Date();
    const slaDeadline   = calcSlaDeadline(priority, createdAt);

    const approvalChain = await buildApprovalChain(
      req.user._id,
      req.user.department,
      type,
      Number(amount) || 0,
      subType || null
    );

    const isAutoApproved = req.user.role === "admin" && type === "leave";

    const request = await Request.create({
      requestId,
      type,
      subType:         subType || "",
      title,
      description,
      priority:        priority || "medium",
      priorityScore,
      status:          isAutoApproved ? "approved" : approvalChain.length > 0 ? "inprogress" : "approved",
      requestedBy:     req.user._id,
      department:      req.user.department,
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
      await notifyUsers(
        [approvalChain[0]], request._id,
        `New ${type} request requires your approval: "${title}"`, "approval"
      );
    }

    res.status(201).json({ request });
  } catch (err) { next(err); }
}

// GET /api/requests ──────────────────────────────────────────────────
async function getRequests(req, res, next) {
  try {
    const { status, priority, limit = 200, queue } = req.query;
    const filter = {};
    const userId = new mongoose.Types.ObjectId(req.user._id);

    if (req.user.role === "employee") {
      filter.requestedBy = userId;
    } else if (req.user.role === "manager" || req.user.role === "hod") {
      if (queue === "mine") {
        filter.currentApprover = userId;
        filter.status = { $in: ["inprogress", "escalated"] };
      } else {
        filter.department = req.user.department;
      }
    }

    if (status && status !== "all") filter.status = status;
    if (priority && priority !== "all") filter.priority = priority;

    const requests = await Request.find(filter)
      .populate("requestedBy",    "name employeeId designation role")
      .populate("currentApprover","name designation role")
      .sort({ priorityScore: 1, createdAt: -1 })
      .limit(Number(limit));

    res.json({ requests, total: requests.length });
  } catch (err) { next(err); }
}

// GET /api/requests/:id ──────────────────────────────────────────────
async function getRequestById(req, res, next) {
  try {
    const request = await Request.findById(req.params.id)
      .populate("requestedBy",    "name employeeId department designation role")
      .populate("currentApprover","name designation role")
      .populate("approvalChain",  "name designation role department");

    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json({ request });
  } catch (err) { next(err); }
}

// GET /api/requests/:id/audit ────────────────────────────────────────
async function getAuditLog(req, res, next) {
  try {
    const auditLogs = await AuditLog.find({ requestId: req.params.id })
      .populate("performedBy", "name designation role")
      .sort({ timestamp: 1 });
    res.json({ auditLogs });
  } catch (err) { next(err); }
}

// PUT /api/requests/:id/action ───────────────────────────────────────
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

      await notifyUsers(
        [request.requestedBy], request._id,
        `Your ${request.type} request "${request.title}" was rejected. Reason: ${comment}`,
        "rejection"
      );

    } else if (action === "approve") {
      const nextStep = request.currentStep + 1;

      if (nextStep >= request.approvalChain.length) {
        request.status          = "approved";
        request.currentApprover = null;
        request.lastActionAt    = now;

        await notifyUsers(
          [request.requestedBy], request._id,
          `✅ Your ${request.type} request "${request.title}" has been fully approved!`,
          "approval"
        );

        // Notify team if manager/HOD leave approved
        const User = require("../models/User");
        const requester = await User.findById(request.requestedBy);
        if (request.type === "leave" && requester &&
            ["manager", "hod", "admin"].includes(requester.role)) {
          const teamMembers = await getTeamMembers(request.requestedBy);
          const teamIds = teamMembers.map(m => m._id);
          if (teamIds.length > 0) {
            await notifyUsers(
              teamIds, request._id,
              `📢 ${requester.name} (${requester.designation}) leave approved: "${request.title}". Plan accordingly.`,
              "info"
            );
          }
        }

      } else {
        request.currentStep     = nextStep;
        request.currentApprover = request.approvalChain[nextStep];
        request.status          = "inprogress";
        request.lastActionAt    = now;

        await notifyUsers(
          [request.approvalChain[nextStep]], request._id,
          `${request.type} request "${request.title}" requires your approval (step ${nextStep + 1})`,
          "approval"
        );

        await notifyUsers(
          [request.requestedBy], request._id,
          `Your request "${request.title}" passed step ${nextStep}. Moving to next approver.`,
          "info"
        );
      }
    }

    await request.save();
    res.json({ message: `Request ${action}d successfully`, request });
  } catch (err) { next(err); }
}

// DELETE /api/requests/:id/cancel ────────────────────────────────────
// Rules:
//   Employee  → can cancel ONLY their own + ONLY if still at step 0 (no one acted yet)
//   Manager / HOD / Admin → can cancel any non-closed request
async function cancelRequest(req, res, next) {
  try {
    const { reason } = req.body;
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const isOwner  = request.requestedBy.toString() === req.user._id.toString();
    const isAdmin  = ["admin", "hod", "manager"].includes(req.user.role);
    const isClosed = ["approved", "rejected"].includes(request.status);

    // Cannot cancel already closed
    if (isClosed) {
      return res.status(400).json({
        message: `Cannot cancel — request is already ${request.status}.`,
      });
    }

    // Employee: must be owner AND no approver has acted yet
    if (!isAdmin) {
      if (!isOwner) {
        return res.status(403).json({ message: "You can only cancel your own requests." });
      }
      if (request.currentStep > 0) {
        return res.status(400).json({
          message: "Cannot cancel — an approver has already acted on this request. Contact your manager to reject it instead.",
        });
      }
    }

    // Write audit log before deleting
    await AuditLog.create({
      requestId:   request._id,
      action:      "rejected",
      performedBy: req.user._id,
      comment:     `Cancelled by ${req.user.name} (${req.user.role}): ${reason || "No reason provided"}`,
      step:        request.currentStep,
      timestamp:   new Date(),
    });

    // Notify requester if cancelled by someone else
    if (!isOwner) {
      await notifyUsers(
        [request.requestedBy], request._id,
        `Your ${request.type} request "${request.title}" was cancelled by ${req.user.name}.`,
        "rejection"
      );
    }

    // Also notify current approver that request is gone
    if (request.currentApprover) {
      await notifyUsers(
        [request.currentApprover], request._id,
        `Request "${request.title}" has been cancelled — no action needed.`,
        "info"
      );
    }

    await Request.findByIdAndDelete(req.params.id);
    res.json({ message: "Request cancelled and deleted successfully." });
  } catch (err) { next(err); }
}

module.exports = {
  createRequest, getRequests, getRequestById,
  getAuditLog, actionOnRequest, cancelRequest,
};