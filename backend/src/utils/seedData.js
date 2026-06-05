/**
 * RINL ERP — Seed Data Script
 * Run: npm run seed
 * Creates: 1 admin, 4 HODs, 5 managers, 10 employees, 20 requests
 * All passwords: Test@1234
 */
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

const mongoose     = require("mongoose");
const { connectDB } = require("../config/db");
const User         = require("../models/User");
const Request      = require("../models/Request");
const AuditLog     = require("../models/AuditLog");
const Notification = require("../models/Notification");
const { calcPriorityScore, calcSlaDeadline } = require("./priorityCalc");

const USERS = [
  // Admin
  { employeeId:"RINL-ADMIN-001", name:"Suresh Kumar Rao",    email:"admin@rinl.in",      role:"admin",    department:"HR",              designation:"Chief ERP Administrator"    },
  // HODs
  { employeeId:"RINL-HOD-BF-01", name:"Vijay Lakshmi",       email:"hod.bf@rinl.in",     role:"hod",      department:"Blast Furnace",   designation:"Head of Department - BF"    },
  { employeeId:"RINL-HOD-HR-01", name:"Anand Krishnamurthy", email:"hod.hr@rinl.in",     role:"hod",      department:"HR",              designation:"Head of Department - HR"    },
  { employeeId:"RINL-HOD-FIN-01",name:"Priya Venkatesh",     email:"hod.fin@rinl.in",    role:"hod",      department:"Finance",         designation:"Head of Department - Finance"},
  { employeeId:"RINL-HOD-SAF-01",name:"Ravi Shankar",        email:"hod.safety@rinl.in", role:"hod",      department:"Safety",          designation:"Head of Department - Safety" },
  // Managers
  { employeeId:"RINL-MGR-BF-01", name:"Mahesh Babu",         email:"mgr.bf@rinl.in",     role:"manager",  department:"Blast Furnace",   designation:"Deputy General Manager"     },
  { employeeId:"RINL-MGR-HR-01", name:"Sunita Reddy",        email:"mgr.hr@rinl.in",     role:"manager",  department:"HR",              designation:"Assistant Manager - HR"     },
  { employeeId:"RINL-MGR-SMS-01",name:"Kiran Kumar",         email:"mgr.sms@rinl.in",    role:"manager",  department:"Steel Melt Shop", designation:"Section Incharge"           },
  { employeeId:"RINL-MGR-FIN-01",name:"Deepak Narayan",      email:"mgr.fin@rinl.in",    role:"manager",  department:"Finance",         designation:"Senior Manager"             },
  { employeeId:"RINL-MGR-PUR-01",name:"Lakshmi Prasad",      email:"mgr.pur@rinl.in",    role:"manager",  department:"Purchase",        designation:"Purchase Manager"           },
  // Employees
  { employeeId:"RINL-EMP-001",   name:"Arjun Patel",         email:"emp1@rinl.in",       role:"employee", department:"Blast Furnace",   designation:"Junior Engineer"            },
  { employeeId:"RINL-EMP-002",   name:"Sneha Iyer",          email:"emp2@rinl.in",       role:"employee", department:"HR",              designation:"HR Executive"               },
  { employeeId:"RINL-EMP-003",   name:"Rajesh Gupta",        email:"emp3@rinl.in",       role:"employee", department:"Steel Melt Shop", designation:"Operator Grade-II"          },
  { employeeId:"RINL-EMP-004",   name:"Kavitha Nair",        email:"emp4@rinl.in",       role:"employee", department:"Finance",         designation:"Accounts Executive"         },
  { employeeId:"RINL-EMP-005",   name:"Srinivas Rao",        email:"emp5@rinl.in",       role:"employee", department:"Safety",          designation:"Safety Inspector"           },
  { employeeId:"RINL-EMP-006",   name:"Preethi Sharma",      email:"emp6@rinl.in",       role:"employee", department:"Purchase",        designation:"Purchase Executive"         },
  { employeeId:"RINL-EMP-007",   name:"Mohan Teja",          email:"emp7@rinl.in",       role:"employee", department:"Roll Mill",       designation:"Shift Engineer"             },
  { employeeId:"RINL-EMP-008",   name:"Divya Menon",         email:"emp8@rinl.in",       role:"employee", department:"Coke Oven",       designation:"Process Engineer"           },
  { employeeId:"RINL-EMP-009",   name:"Harish Babu",         email:"emp9@rinl.in",       role:"employee", department:"Blast Furnace",   designation:"Trainee Engineer"           },
  { employeeId:"RINL-EMP-010",   name:"Nandini Reddy",       email:"emp10@rinl.in",      role:"employee", department:"HR",              designation:"HR Trainee"                 },
];

const REQUESTS = [
  { type:"purchase", title:"Emergency Refractory Bricks for BF-3 Tap Hole",    priority:"critical", dept:"Blast Furnace",   amount:285000, status:"inprogress" },
  { type:"leave",    title:"Annual Leave — Diwali Vacation",                     priority:"low",      dept:"HR",              amount:0,      status:"approved"   },
  { type:"repair",   title:"Hydraulic Press Breakdown — SMS Bay-2",              priority:"high",     dept:"Steel Melt Shop", amount:0,      status:"inprogress" },
  { type:"budget",   title:"Q4 Training Budget Sanction — Safety Team",          priority:"medium",   dept:"Safety",          amount:150000, status:"pending"    },
  { type:"purchase", title:"Industrial Lubricants — Roll Mill Monthly Stock",    priority:"medium",   dept:"Roll Mill",       amount:85000,  status:"approved"   },
  { type:"safety",   title:"Hot Work Permit — BF-2 Maintenance Shutdown",        priority:"high",     dept:"Blast Furnace",   amount:0,      status:"approved"   },
  { type:"leave",    title:"Medical Leave — 3 Days",                             priority:"low",      dept:"Finance",         amount:0,      status:"approved"   },
  { type:"repair",   title:"Conveyor Belt Replacement — RMHP Section-4",         priority:"critical", dept:"Blast Furnace",   amount:0,      status:"escalated"  },
  { type:"budget",   title:"Canteen Equipment Upgrade — Township",               priority:"low",      dept:"HR",              amount:320000, status:"pending"    },
  { type:"purchase", title:"Oxygen Cylinders — Emergency Procurement",           priority:"critical", dept:"Safety",          amount:42000,  status:"approved"   },
  { type:"repair",   title:"Coke Oven Battery-4 Door Seal Replacement",          priority:"high",     dept:"Coke Oven",       amount:0,      status:"inprogress" },
  { type:"leave",    title:"Compensatory Leave — Weekend Shift",                  priority:"low",      dept:"Steel Melt Shop", amount:0,      status:"rejected"   },
  { type:"purchase", title:"PPE Kit Bulk Order — Q3 Safety Stock",               priority:"medium",   dept:"Safety",          amount:178000, status:"approved"   },
  { type:"budget",   title:"IT Infrastructure Upgrade — ERP Servers",            priority:"high",     dept:"Finance",         amount:1200000,status:"inprogress" },
  { type:"repair",   title:"Ladle Refining Furnace — Electrode Replacement",     priority:"critical", dept:"Steel Melt Shop", amount:0,      status:"inprogress" },
  { type:"safety",   title:"Confined Space Entry Permit — Sinter Plant",         priority:"high",     dept:"Safety",          amount:0,      status:"approved"   },
  { type:"purchase", title:"Cooling Water Treatment Chemicals — Monthly",        priority:"medium",   dept:"Roll Mill",       amount:56000,  status:"pending"    },
  { type:"leave",    title:"Paternity Leave — 15 Days",                          priority:"low",      dept:"HR",              amount:0,      status:"approved"   },
  { type:"budget",   title:"Skill Development Program — Operator Training",      priority:"medium",   dept:"HR",              amount:250000, status:"pending"    },
  { type:"repair",   title:"Blast Furnace Gas Cleaning System — Pump Overhaul", priority:"high",     dept:"Blast Furnace",   amount:0,      status:"inprogress" },
];

async function seed() {
  await connectDB();

  console.log("🗑   Clearing existing data...");
  await User.deleteMany({});
  await Request.deleteMany({});
  await AuditLog.deleteMany({});
  await Notification.deleteMany({});

  console.log("👥  Creating users...");
  const savedUsers = {};
  for (const u of USERS) {
    const user = new User({ ...u, passwordHash: "Test@1234" });
    await user.save();
    savedUsers[u.employeeId] = user;
  }

  // Wire up manager relationships
  const allUsers   = Object.values(savedUsers);
  const managers   = allUsers.filter(u => u.role === "manager");
  const hods       = allUsers.filter(u => u.role === "hod");
  const employees  = allUsers.filter(u => u.role === "employee");

  for (const mgr of managers) {
    const hod = hods.find(h => h.department === mgr.department);
    if (hod) { mgr.managerId = hod._id; await mgr.save(); }
  }
  for (const emp of employees) {
    const mgr = managers.find(m => m.department === emp.department);
    if (mgr) { emp.managerId = mgr._id; await emp.save(); }
  }

  console.log("📋  Creating requests...");
  for (let i = 0; i < REQUESTS.length; i++) {
    const tmpl      = REQUESTS[i];
    const emp       = employees[i % employees.length];
    const manager   = managers.find(m => m.department === tmpl.dept) || managers[0];
    const hod       = hods.find(h => h.department === tmpl.dept)     || hods[0];
    const chain     = [manager._id, hod._id];
    const createdAt = new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000);
    const deptCode  = tmpl.dept.split(" ").map(w => w[0]).join("");

    const currentStep = tmpl.status === "approved" ? chain.length :
                        tmpl.status === "rejected"  ? 0 : 0;

    const req = await Request.create({
      requestId:       `RINL-${deptCode}-2024-${String(i + 1).padStart(5, "0")}`,
      type:            tmpl.type,
      title:           tmpl.title,
      description:     `Detailed description for: ${tmpl.title}. Submitted by ${tmpl.dept} department per RINL standard operating procedures.`,
      priority:        tmpl.priority,
      priorityScore:   calcPriorityScore(tmpl.priority),
      status:          tmpl.status,
      requestedBy:     emp._id,
      department:      tmpl.dept,
      approvalChain:   chain,
      currentStep,
      currentApprover: ["inprogress","escalated","pending"].includes(tmpl.status) ? chain[0] : null,
      slaDeadline:     calcSlaDeadline(tmpl.priority, createdAt),
      amount:          tmpl.amount,
      lastActionAt:    createdAt,
      createdAt,
      updatedAt:       createdAt,
    });

    await AuditLog.create({ requestId: req._id, action: "created", performedBy: emp._id, step: 0, timestamp: createdAt });

    if (tmpl.status === "approved") {
      await AuditLog.create({ requestId: req._id, action: "approved", performedBy: manager._id, comment: "Approved. Proceed.", step: 0, timestamp: new Date(createdAt.getTime() + 2 * 3600000) });
      await AuditLog.create({ requestId: req._id, action: "approved", performedBy: hod._id,     comment: "Final approval granted.", step: 1, timestamp: new Date(createdAt.getTime() + 5 * 3600000) });
    }
    if (tmpl.status === "rejected") {
      await AuditLog.create({ requestId: req._id, action: "rejected", performedBy: manager._id, comment: "Does not meet current policy requirements.", step: 0, timestamp: new Date(createdAt.getTime() + 3 * 3600000) });
    }
    if (tmpl.status === "escalated") {
      await AuditLog.create({ requestId: req._id, action: "escalated", comment: "Auto-escalated: SLA breached", timestamp: new Date() });
    }
    if (["inprogress","escalated"].includes(tmpl.status)) {
      await Notification.create({ userId: manager._id, requestId: req._id, message: `New request awaiting your approval: "${tmpl.title}"`, type: "approval" });
    }
  }

  // Print summary
  console.log("\n" + "━".repeat(72));
  console.log("✅  SEED COMPLETE — All credentials use password: Test@1234");
  console.log("━".repeat(72));
  console.log(`${"Role".padEnd(10)} ${"Employee ID".padEnd(22)} ${"Name".padEnd(25)} Dept`);
  console.log("─".repeat(72));
  USERS.forEach(u => {
    console.log(`${u.role.padEnd(10)} ${u.employeeId.padEnd(22)} ${u.name.padEnd(25)} ${u.department}`);
  });
  console.log("━".repeat(72));
  console.log("\n🔑  Quick logins:");
  console.log("    Admin    → RINL-ADMIN-001 / Test@1234");
  console.log("    HOD      → RINL-HOD-BF-01 / Test@1234");
  console.log("    Manager  → RINL-MGR-BF-01 / Test@1234");
  console.log("    Employee → RINL-EMP-001   / Test@1234\n");

  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });