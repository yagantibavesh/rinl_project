const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  requestId:    { type: String, unique: true, index: true },
  type: {
    type:     String,
    enum:     ["purchase", "leave", "repair", "budget", "safety"],
    required: true,
  },
  title:        { type: String, required: true, trim: true },
  description:  { type: String, required: true },
  priority: {
    type:    String,
    enum:    ["low", "medium", "high", "critical"],
    default: "medium",
  },
  priorityScore:   { type: Number, default: 3 },
  status: {
    type:    String,
    enum:    ["pending", "inprogress", "approved", "rejected", "escalated"],
    default: "pending",
    index:   true,
  },
  requestedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  department:      { type: String, required: true, index: true },
  approvalChain:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  currentStep:     { type: Number, default: 0 },
  currentApprover: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  slaDeadline:     { type: Date, index: true },
  amount:          { type: Number, default: 0 },
  lastActionAt:    { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Request", requestSchema);