const Request = require("../models/Request");

const DEPT_CODE = {
  "Blast Furnace":               "BF",
  "Steel Melt Shop":             "SMS",
  "Roll Mill":                   "RM",
  "Raw Material Handling Plant": "RMHP",
  "HR":                          "HR",
  "Finance":                     "FIN",
  "Purchase":                    "PUR",
  "Safety":                      "SAF",
  "Coke Oven":                   "CO",
  "Sinter Plant":                "SP",
  "Central Maintenance Shop":    "CMS",
};

async function generateRequestId(department) {
  const code   = DEPT_CODE[department] || "GEN";
  const year   = new Date().getFullYear();
  const count  = await Request.countDocuments();
  const serial = String(count + 1).padStart(5, "0");
  return `RINL-${code}-${year}-${serial}`;
}

module.exports = { generateRequestId };