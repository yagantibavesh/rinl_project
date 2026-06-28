const express = require("express");
const router  = express.Router();
const {
  createRequest, getRequests, getRequestById,
  getAuditLog, actionOnRequest, cancelRequest,
} = require("../controllers/requestController");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

router.get("/",             getRequests);
router.post("/",            createRequest);
router.get("/:id",          getRequestById);
router.get("/:id/audit",    getAuditLog);
router.put("/:id/action",   actionOnRequest);
router.delete("/:id/cancel",cancelRequest);   // ← new cancel route

module.exports = router;