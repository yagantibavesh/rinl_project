const express  = require("express");
const router   = express.Router();
const Request  = require("../models/Request");
const { verifyToken } = require("../middleware/auth");
const { rbac }        = require("../middleware/rbac");

router.use(verifyToken);
router.use(rbac("manager", "hod", "admin"));

// GET /api/analytics/dashboard
router.get("/dashboard", async (req, res, next) => {
  try {
    const days  = parseInt(req.query.days) || 14;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const deptFilter = req.user.role === "admin" ? {} : { department: req.user.department };

    const totalRequests = await Request.countDocuments(deptFilter);

    const statusAgg = await Request.aggregate([
      { $match: deptFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const byStatus = {};
    statusAgg.forEach(s => { byStatus[s._id] = s.count; });

    const byDepartment = await Request.aggregate([
      { $match: deptFilter },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const byType = await Request.aggregate([
      { $match: deptFilter },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    const resAgg = await Request.aggregate([
      { $match: { ...deptFilter, status: "approved" } },
      { $project: { resMs: { $subtract: ["$updatedAt", "$createdAt"] } } },
      { $group: { _id: null, avgMs: { $avg: "$resMs" } } },
    ]);
    const avgResolutionHrs = resAgg[0] ? Math.round(resAgg[0].avgMs / 3600000) : 0;

    const slaBreaches = await Request.countDocuments({
      ...deptFilter,
      status:      { $in: ["pending", "inprogress"] },
      slaDeadline: { $lt: new Date() },
    });

    const myQueueCount = await Request.countDocuments({
      currentApprover: req.user._id,
      status: { $in: ["inprogress", "escalated"] },
    });

    const dailyTrend = await Request.aggregate([
      { $match: { ...deptFilter, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%m/%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", count: 1, _id: 0 } },
    ]);

    res.json({ totalRequests, byStatus, byDepartment, byType, avgResolutionHrs, slaBreaches, myQueueCount, dailyTrend });
  } catch (err) { next(err); }
});

module.exports = router;