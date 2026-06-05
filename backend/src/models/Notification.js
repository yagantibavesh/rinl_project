
const mongoose = require("mongoose");
 
const notificationSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "User",
    required: true,
    index:    true,
  },
  requestId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "Request",
    required: true,
  },
  message:  { type: String, required: true },
  isRead:   { type: Boolean, default: false },
  type: {
    type:    String,
    enum:    ["approval","rejection","escalation","info","general"],
    default: "general",
  },
}, { timestamps: true });
 
module.exports = mongoose.model("Notification", notificationSchema);
 