// Usage: rbac("admin")  or  rbac("manager","hod","admin")
// Always place AFTER verifyToken in the route chain
function rbac(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated. Please login first." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required: ${allowedRoles.join(" or ")}. Your role: ${req.user.role}`,
      });
    }
    next();
  };
}

module.exports = { rbac };