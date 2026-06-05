const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  requestId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "Request",
    required: true,
    index:    true,
  },
  action: {
    type:     String,
    enum:     ["created","approved","rejected","escalated","delegated","info_requested"],
    required: true,
  },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  comment:     { type: String, default: "" },
  step:        { type: Number },
  timestamp:   { type: Date, default: Date.now },
  metadata:    { type: mongoose.Schema.Types.Mixed },
});

module.exports = mongoose.model("AuditLog", auditLogSchema);