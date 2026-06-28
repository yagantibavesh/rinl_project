const User = require("../models/User");

/**
 * RINL REAL CORPORATE HIERARCHY — APPROVAL WORKFLOW ENGINE
 *
 * Role levels (higher number = more senior):
 *   1 = employee / trainee / jr.engineer
 *   2 = section incharge / asst.manager
 *   3 = manager / sr.manager / agm
 *   4 = hod / dgm / gm
 *   5 = admin / cmd / director
 *
 * Rules:
 * ─────────────────────────────────────────────────────────────────
 * LEAVE:
 *   employee      → manager only
 *   manager       → hod → (team notified on approval)
 *   hod           → admin → (dept notified on approval)
 *   admin         → self-approved with audit record
 *
 * REPAIR:
 *   planned       → emp → mgr → hod
 *   emergency     → emp → mgr → hod → CMS HOD
 *   major overhaul→ emp → mgr → hod → CMS HOD → admin
 *
 * PURCHASE:
 *   < ₹10,000     → emp → mgr
 *   ₹10k–₹1L      → emp → mgr → hod
 *   ₹1L–₹10L      → emp → mgr → hod → finance HOD
 *   > ₹10L        → emp → mgr → hod → finance HOD → admin
 *
 * SAFETY:
 *   hot work / confined space → emp → mgr → hod → safety HOD
 *   shutdown permit           → emp → mgr → hod → safety HOD → admin
 *
 * BUDGET:
 *   operational   → emp → mgr → hod → finance HOD
 *   capital       → emp → mgr → hod → finance HOD → admin
 * ─────────────────────────────────────────────────────────────────
 */

// Helper — push user to chain if exists and not duplicate
function push(chain, user) {
  if (!user) return;
  const id = user._id.toString();
  if (!chain.some(c => c.toString() === id)) {
    chain.push(user._id);
  }
}

async function buildApprovalChain(requestedById, department, requestType, amount, subType) {
  const chain = [];

  const requester = await User.findById(requestedById);
  if (!requester) throw new Error("Requester not found");

  const role = requester.role; // employee | manager | hod | admin

  // Get requester's direct manager (managerId)
  const manager = requester.managerId
    ? await User.findById(requester.managerId)
    : null;

  // HOD of requester's own department
  const deptHOD = await User.findOne({ role: "hod", department: requester.department });

  // Special department HODs
  const financeHOD = await User.findOne({ role: "hod", department: "Finance" });
  const safetyHOD  = await User.findOne({ role: "hod", department: "Safety"  });
  const cmsHOD     = await User.findOne({ role: "hod", department: "Central Maintenance Shop" });
  const admin      = await User.findOne({ role: "admin" });

  const amt = Number(amount) || 0;

  // ─────────────────────────────────────────────────────────────────
  // LEAVE
  // ─────────────────────────────────────────────────────────────────
  if (requestType === "leave") {
    if (role === "employee") {
      // employee → manager only
      push(chain, manager);
      if (chain.length === 0) push(chain, deptHOD); // fallback if no manager set
    } else if (role === "manager") {
      // manager → HOD
      push(chain, deptHOD);
    } else if (role === "hod") {
      // HOD → Admin (admin approves, dept gets notified)
      push(chain, admin);
    } else if (role === "admin") {
      // Admin leave — self-approved (empty chain = auto-approved)
      // Just record it with audit log, no approver needed
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // REPAIR / MAINTENANCE
  // ─────────────────────────────────────────────────────────────────
  else if (requestType === "repair") {
    if (subType === "planned") {
      // planned maintenance → mgr → hod
      push(chain, manager);
      push(chain, deptHOD);
    } else if (subType === "emergency") {
      // emergency → mgr → hod → CMS HOD
      push(chain, manager);
      push(chain, deptHOD);
      push(chain, cmsHOD);
    } else if (subType === "overhaul") {
      // major overhaul → mgr → hod → CMS HOD → admin
      push(chain, manager);
      push(chain, deptHOD);
      push(chain, cmsHOD);
      push(chain, admin);
    } else {
      // default repair → mgr → hod
      push(chain, manager);
      push(chain, deptHOD);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // PURCHASE
  // ─────────────────────────────────────────────────────────────────
  else if (requestType === "purchase") {
    if (amt < 10000) {
      push(chain, manager);
    } else if (amt <= 100000) {
      push(chain, manager);
      push(chain, deptHOD);
    } else if (amt <= 1000000) {
      push(chain, manager);
      push(chain, deptHOD);
      push(chain, financeHOD);
    } else {
      // > ₹10L
      push(chain, manager);
      push(chain, deptHOD);
      push(chain, financeHOD);
      push(chain, admin);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // SAFETY
  // ─────────────────────────────────────────────────────────────────
  else if (requestType === "safety") {
    if (subType === "shutdown") {
      // shutdown permit → mgr → hod → safety HOD → admin
      push(chain, manager);
      push(chain, deptHOD);
      push(chain, safetyHOD);
      push(chain, admin);
    } else {
      // hot work / confined space / general → mgr → hod → safety HOD
      push(chain, manager);
      push(chain, deptHOD);
      push(chain, safetyHOD);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // BUDGET
  // ─────────────────────────────────────────────────────────────────
  else if (requestType === "budget") {
    if (subType === "capital") {
      // capital expenditure → mgr → hod → finance HOD → admin
      push(chain, manager);
      push(chain, deptHOD);
      push(chain, financeHOD);
      push(chain, admin);
    } else {
      // operational budget → mgr → hod → finance HOD
      push(chain, manager);
      push(chain, deptHOD);
      push(chain, financeHOD);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // FALLBACK
  // ─────────────────────────────────────────────────────────────────
  if (chain.length === 0 && role !== "admin") {
    push(chain, admin);
  }

  console.log(`📋 Chain [${requestType}/${subType || "default"}] role:[${role}] dept:[${requester.department}] amt:[${amt}] → ${chain.length} approver(s)`);

  return chain;
}

// Get all team members under a manager/HOD for notification
async function getTeamMembers(userId) {
  const user = await User.findById(userId);
  if (!user) return [];

  // Find all users whose managerId = this user
  const directReports = await User.find({ managerId: userId });
  return directReports;
}

module.exports = { buildApprovalChain, getTeamMembers };