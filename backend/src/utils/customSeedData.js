/**
 * Custom Seed Data Script
 * Run: npm run seed:custom
 * Clears all data and creates custom users and requests
 */
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

const mongoose     = require("mongoose");
const { connectDB } = require("../config/db");
const User         = require("../models/User");
const Request      = require("../models/Request");
const AuditLog     = require("../models/AuditLog");
const Notification = require("../models/Notification");
const { calcPriorityScore, calcSlaDeadline } = require("./priorityCalc");
const { generateRequestId }   = require("./requestIdGen");

// ===== CUSTOMIZE YOUR DATA HERE =====

const CUSTOM_USERS = [
  // ADMIN
  { employeeId: "RINL-ADMIN-001", name: "Admin User",        email: "admin@rinl.in",       role: "admin",    department: "HR",              designation: "System Administrator"     },
  
  // HODs (Department Heads)
  { employeeId: "RINL-HOD-BF-01",  name: "BF HOD - John",     email: "hod.bf@rinl.in",      role: "hod",      department: "Blast Furnace",   designation: "Head of Department - BF"  },
  { employeeId: "RINL-HOD-HR-01",  name: "HR HOD - Sarah",    email: "hod.hr@rinl.in",      role: "hod",      department: "HR",              designation: "Head of Department - HR"  },
  { employeeId: "RINL-HOD-FIN-01", name: "Finance HOD - Mark", email: "hod.fin@rinl.in",    role: "hod",      department: "Finance",         designation: "Head of Department - Fin" },
  
  // MANAGERS (with managerId pointing to HOD)
  { employeeId: "RINL-MGR-BF-01",  name: "Manager - Alex",    email: "mgr.bf@rinl.in",      role: "manager",  department: "Blast Furnace",   designation: "Deputy Manager"           },
  { employeeId: "RINL-MGR-HR-01",  name: "Manager - Emma",    email: "mgr.hr@rinl.in",      role: "manager",  department: "HR",              designation: "HR Manager"               },
  { employeeId: "RINL-MGR-FIN-01", name: "Manager - David",   email: "mgr.fin@rinl.in",     role: "manager",  department: "Finance",         designation: "Finance Manager"          },
  
  // EMPLOYEES (with managerId pointing to manager)
  { employeeId: "RINL-EMP-001",    name: "Employee - Ram",    email: "emp1@rinl.in",        role: "employee", department: "Blast Furnace",   designation: "Junior Engineer"          },
  { employeeId: "RINL-EMP-002",    name: "Employee - Priya",  email: "emp2@rinl.in",        role: "employee", department: "HR",              designation: "HR Executive"             },
  { employeeId: "RINL-EMP-003",    name: "Employee - Arun",   email: "emp3@rinl.in",        role: "employee", department: "Finance",         designation: "Accounts Officer"         },
];

const CUSTOM_REQUESTS = [
  { 
    employeeId: "RINL-EMP-001", 
    type: "purchase", 
    title: "Emergency Steel Plates for BF-1", 
    description: "Urgent purchase of high-grade steel plates needed for blast furnace repairs",
    priority: "critical", 
    department: "Blast Furnace",
    amount: 250000 
  },
  { 
    employeeId: "RINL-EMP-002", 
    type: "leave", 
    title: "Annual Leave - Summer Break", 
    description: "Requesting 10 days annual leave for summer vacation",
    priority: "low", 
    department: "HR",
    amount: 0 
  },
  { 
    employeeId: "RINL-EMP-003", 
    type: "budget", 
    title: "Q2 Budget Allocation for Finance Team", 
    description: "Requesting budget for team training and development programs",
    priority: "medium", 
    department: "Finance",
    amount: 150000 
  },
];

// ===== END CUSTOMIZATION =====

async function seed() {
  await connectDB();

  console.log("\n🗑   Clearing all existing data...");
  await User.deleteMany({});
  await Request.deleteMany({});
  await AuditLog.deleteMany({});
  await Notification.deleteMany({});
  console.log("✅  Data cleared");

  console.log("\n👥  Creating users...");
  const savedUsers = {};
  for (const u of CUSTOM_USERS) {
    const user = new User({ ...u, passwordHash: "Test@1234" });
    await user.save();
    savedUsers[u.employeeId] = user;
    console.log(`   ✓ ${u.role.padEnd(10)} - ${u.name.padEnd(20)} (${u.employeeId})`);
  }

  console.log("\n🔗  Linking manager relationships...");
  
  // Link managers to HODs
  const bfHod = savedUsers["RINL-HOD-BF-01"];
  const hrHod = savedUsers["RINL-HOD-HR-01"];
  const finHod = savedUsers["RINL-HOD-FIN-01"];

  const bfMgr = savedUsers["RINL-MGR-BF-01"];
  const hrMgr = savedUsers["RINL-MGR-HR-01"];
  const finMgr = savedUsers["RINL-MGR-FIN-01"];

  if (bfMgr && bfHod) { bfMgr.managerId = bfHod._id; await bfMgr.save(); console.log("   ✓ BF Manager → BF HOD"); }
  if (hrMgr && hrHod) { hrMgr.managerId = hrHod._id; await hrMgr.save(); console.log("   ✓ HR Manager → HR HOD"); }
  if (finMgr && finHod) { finMgr.managerId = finHod._id; await finMgr.save(); console.log("   ✓ Finance Manager → Finance HOD"); }

  // Link employees to managers
  const emp1 = savedUsers["RINL-EMP-001"];
  const emp2 = savedUsers["RINL-EMP-002"];
  const emp3 = savedUsers["RINL-EMP-003"];

  if (emp1 && bfMgr) { emp1.managerId = bfMgr._id; await emp1.save(); console.log("   ✓ Employee Ram → BF Manager"); }
  if (emp2 && hrMgr) { emp2.managerId = hrMgr._id; await emp2.save(); console.log("   ✓ Employee Priya → HR Manager"); }
  if (emp3 && finMgr) { emp3.managerId = finMgr._id; await emp3.save(); console.log("   ✓ Employee Arun → Finance Manager"); }

  console.log("\n📋  Creating requests (will route to managers)...");
  for (const reqTmpl of CUSTOM_REQUESTS) {
    const emp = savedUsers[reqTmpl.employeeId];
    if (!emp) {
      console.log(`   ✗ Employee ${reqTmpl.employeeId} not found`);
      continue;
    }

    const requestId = await generateRequestId(reqTmpl.department);
    const priorityScore = calcPriorityScore(reqTmpl.priority);
    const createdAt = new Date();
    const slaDeadline = calcSlaDeadline(reqTmpl.priority, createdAt);

    // Build approval chain (will automatically go to emp's manager → manager's manager)
    const chain = [];
    if (emp.managerId) {
      chain.push(emp.managerId);
      const mgr = await User.findById(emp.managerId);
      if (mgr && mgr.managerId) {
        chain.push(mgr.managerId);
      }
    }

    const request = await Request.create({
      requestId,
      type: reqTmpl.type,
      title: reqTmpl.title,
      description: reqTmpl.description,
      priority: reqTmpl.priority,
      priorityScore,
      status: chain.length > 0 ? "inprogress" : "approved",
      requestedBy: emp._id,
      department: reqTmpl.department,
      approvalChain: chain,
      currentStep: 0,
      currentApprover: chain[0] || null,
      slaDeadline,
      amount: reqTmpl.amount,
      lastActionAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    });

    // Create audit log
    await AuditLog.create({
      requestId: request._id,
      action: "created",
      performedBy: emp._id,
      step: 0,
      timestamp: createdAt,
    });

    // Create notification for first approver
    if (chain[0]) {
      await Notification.create({
        userId: chain[0],
        requestId: request._id,
        message: `New ${reqTmpl.type} request awaiting your approval: "${reqTmpl.title}"`,
        type: "approval",
      });
    }

    console.log(`   ✓ ${reqTmpl.type.padEnd(10)} - "${reqTmpl.title}" (→ ${emp.name})`);
  }

  // Print summary
  console.log("\n" + "━".repeat(80));
  console.log("✅  CUSTOM SEED COMPLETE");
  console.log("━".repeat(80));
  console.log("\n🔑  Test Credentials (all use password: Test@1234):\n");
  console.log("Admin:");
  console.log("   RINL-ADMIN-001 / Test@1234\n");
  console.log("HODs:");
  console.log("   RINL-HOD-BF-01  / Test@1234  (Blast Furnace)");
  console.log("   RINL-HOD-HR-01  / Test@1234  (HR)");
  console.log("   RINL-HOD-FIN-01 / Test@1234  (Finance)\n");
  console.log("Managers:");
  console.log("   RINL-MGR-BF-01  / Test@1234  (BF Manager - receives requests from BF employees)");
  console.log("   RINL-MGR-HR-01  / Test@1234  (HR Manager - receives requests from HR employees)");
  console.log("   RINL-MGR-FIN-01 / Test@1234  (Finance Manager - receives requests from Finance employees)\n");
  console.log("Employees:");
  console.log("   RINL-EMP-001 / Test@1234  (Ram - Blast Furnace - requests route to BF Manager)");
  console.log("   RINL-EMP-002 / Test@1234  (Priya - HR - requests route to HR Manager)");
  console.log("   RINL-EMP-003 / Test@1234  (Arun - Finance - requests route to Finance Manager)\n");
  console.log("━".repeat(80));
  console.log("\n💡  How to customize:");
  console.log("   Edit CUSTOM_USERS and CUSTOM_REQUESTS in customSeedData.js, then run:");
  console.log("   npm run seed:custom\n");

  process.exit(0);
}

seed().catch(err => { console.error("❌ Error:", err.message); process.exit(1); });
