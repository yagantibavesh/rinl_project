const express      = require("express");
const router       = express.Router();
const Notification = require("../models/Notification");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

// GET /api/notifications
router.get("/", async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("requestId", "requestId title type");
    res.json({ notifications });
  } catch (err) { next(err); }
});

// PUT /api/notifications/:id/read
router.put("/:id/read", async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: "Marked as read" });
  } catch (err) { next(err); }
});

// PUT /api/notifications/read-all
router.put("/read-all", async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: "All marked as read" });
  } catch (err) { next(err); }
});

module.exports = router;