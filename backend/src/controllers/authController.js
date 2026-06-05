const jwt  = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
  return jwt.sign(
    {
      _id:        user._id,
      employeeId: user.employeeId,
      name:       user.name,
      role:       user.role,
      department: user.department,
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { employeeId, name, email, password, role, department, designation, managerId } = req.body;

    if (!employeeId || !name || !email || !password || !department) {
      return res.status(400).json({ message: "employeeId, name, email, password, department are required" });
    }

    const existing = await User.findOne({ $or: [{ employeeId }, { email }] });
    if (existing) return res.status(400).json({ message: "Employee ID or email already exists" });

    const user = await User.create({
      employeeId,
      name,
      email,
      passwordHash: password,   // pre-save hook hashes it
      role:         role || "employee",
      department,
      designation:  designation || "",
      managerId:    managerId   || null,
    });

    const token = signToken(user);
    const userData = user.toObject();
    delete userData.passwordHash;

    res.status(201).json({ token, user: userData });
  } catch (err) { next(err); }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({ message: "Employee ID and password are required" });
    }

    const user = await User.findOne({ employeeId }).select("+passwordHash");
    if (!user) return res.status(401).json({ message: "Invalid employee ID or password" });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: "Invalid employee ID or password" });

    const token = signToken(user);
    const userData = user.toObject();
    delete userData.passwordHash;

    res.json({ token, user: userData });
  } catch (err) { next(err); }
}

// GET /api/auth/me
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) { next(err); }
}

module.exports = { register, login, getMe };