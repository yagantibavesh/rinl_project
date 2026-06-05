const cron         = require("node-cron");
const Request      = require("../models/Request");
const AuditLog     = require("../models/AuditLog");
const Notification = require("../models/Notification");
const { SLA_HOURS } = require("../utils/priorityCalc");

// Runs every 15 minutes — checks for SLA-breached requests and escalates them
cron.schedule("*/15 * * * *", async () => {
  console.log("⏱  SLA escalation cron running...");
  try {
    const now     = new Date();
    const breached = await Request.find({
      status:      { $in: ["pending", "inprogress"] },
      slaDeadline: { $lt: now },
    });

    for (const req of breached) {
      const nextStep = req.currentStep + 1;
      if (nextStep < req.approvalChain.length) {
        req.currentApprover = req.approvalChain[nextStep];
        req.currentStep     = nextStep;
      }
      req.status       = "escalated";
      req.lastActionAt = now;
      await req.save();

      await AuditLog.create({
        requestId: req._id,
        action:    "escalated",
        comment:   `Auto-escalated: SLA breached (${SLA_HOURS[req.priority]}h limit for ${req.priority})`,
        timestamp: now,
        metadata:  { autoEscalated: true },
      });

      if (req.currentApprover) {
        await Notification.create({
          userId:    req.currentApprover,
          requestId: req._id,
          message:   `⚠️ ESCALATED: "${req.title}" has breached SLA and needs urgent action`,
          type:      "escalation",
        });
      }
      await Notification.create({
        userId:    req.requestedBy,
        requestId: req._id,
        message:   `Your request "${req.title}" was escalated due to SLA breach`,
        type:      "escalation",
      });

      console.log(`  ↑ Escalated: ${req.requestId}`);
    }

    if (breached.length === 0) console.log("  ✅  No SLA breaches");
  } catch (err) {
    console.error("❌  Escalation cron error:", err.message);
  }
});

console.log("✅  SLA escalation cron scheduled (every 15 min)");