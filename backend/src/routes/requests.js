const express = require("express");
const router  = express.Router();
const { createRequest, getRequests, getRequestById, getAuditLog, actionOnRequest } =
  require("../controllers/requestController");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);   // protect all request routes

router.get("/",           getRequests);
router.post("/",          createRequest);
router.get("/:id",        getRequestById);
router.get("/:id/audit",  getAuditLog);
router.put("/:id/action", actionOnRequest);

module.exports = router;