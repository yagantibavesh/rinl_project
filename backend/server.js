const path  = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });

// ── Debug: confirm env is loading ──
console.log("📁 ENV loaded from:", path.join(__dirname, ".env"));
console.log("🔑 MONGO_URI starts with:", process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 40) : "❌ UNDEFINED");
console.log("🔑 JWT_SECRET:", process.env.JWT_SECRET ? "✅ set" : "❌ UNDEFINED");

const express       = require("express");
const cors          = require("cors");
const { connectDB } = require("./src/config/db");

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth",          require("./src/routes/auth"));
app.use("/api/requests",      require("./src/routes/requests"));
app.use("/api/notifications", require("./src/routes/notifications"));
app.use("/api/analytics",     require("./src/routes/analytics"));

app.get("/api/health", (_, res) => res.json({ status: "ok", time: new Date() }));
app.use(require("./src/middleware/errorHandler"));

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅  RINL ERP backend → http://localhost:${PORT}`);
    require("./src/jobs/escalationCron");
  });
});