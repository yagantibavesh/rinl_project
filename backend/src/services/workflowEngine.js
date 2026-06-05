const User = require("../models/User");

async function buildApprovalChain(requestedById, department, requestType, amount) {
  const chain = [];

  const requester = await User.findById(requestedById);
  if (!requester) throw new Error("Requester not found");

  // Level 1 — direct manager
  if (requester.managerId) {
    chain.push(requester.managerId);

    // Level 2 — manager's manager (HOD)
    const manager = await User.findById(requester.managerId);
    if (manager && manager.managerId) {
      chain.push(manager.managerId);
    }
  }

  // Fallback — no manager set, route to admin
  if (chain.length === 0) {
    const admin = await User.findOne({ role: "admin" });
    if (admin) chain.push(admin._id);
  }

  // High-value purchase — add Finance HOD
  if (["purchase", "budget"].includes(requestType) && Number(amount) > 500000) {
    const finHOD = await User.findOne({ role: "hod", department: "Finance" });
    if (finHOD && !chain.some(id => id.toString() === finHOD._id.toString())) {
      chain.push(finHOD._id);
    }
  }

  // Safety clearance — Safety HOD goes first
  if (requestType === "safety") {
    const safHOD = await User.findOne({ role: "hod", department: "Safety" });
    if (safHOD && !chain.some(id => id.toString() === safHOD._id.toString())) {
      chain.unshift(safHOD._id);
    }
  }

  return chain;
}

module.exports = { buildApprovalChain };