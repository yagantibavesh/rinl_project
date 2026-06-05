const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema({
  employeeId:   { type: String, required: true, unique: true, index: true },
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  role: {
    type:    String,
    enum:    ["employee", "manager", "hod", "admin"],
    default: "employee",
  },
  department:  { type: String, required: true },
  designation: { type: String, default: "" },
  managerId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  isOOO:       { type: Boolean, default: false },
}, { timestamps: true });

// Mongoose 8+ — async pre hooks do NOT use next()
// Just return a promise (async/await handles it)
userSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model("User", userSchema);