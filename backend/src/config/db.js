const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;
  console.log("🔗 Connecting with URI:", uri ? uri.substring(0, 50) + "..." : "UNDEFINED");

  // Try 1: normal connection
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log("✅  MongoDB connected:", mongoose.connection.host);
    return;
  } catch (err1) {
    console.log("⚠️  SRV connect failed:", err1.message);
    console.log("🔄  Trying direct connection string...");
  }

  // Try 2: swap mongodb+srv:// → mongodb:// with explicit port
  // This bypasses SRV DNS lookup which college networks block
  try {
    const directUri = uri
      .replace("mongodb+srv://", "mongodb://")
      .replace(
        "@rinl-saws-cluster.8uci4rd.mongodb.net/",
        "@rinl-saws-cluster-shard-00-00.8uci4rd.mongodb.net:27017,rinl-saws-cluster-shard-00-01.8uci4rd.mongodb.net:27017,rinl-saws-cluster-shard-00-02.8uci4rd.mongodb.net:27017/"
      );

    const directUriWithOptions = directUri.includes("?")
      ? directUri + "&ssl=true&authSource=admin&replicaSet=atlas-rinl-saws-shard-0"
      : directUri + "?ssl=true&authSource=admin&replicaSet=atlas-rinl-saws-shard-0";

    await mongoose.connect(directUriWithOptions, {
      serverSelectionTimeoutMS: 8000,
      family: 4,
    });
    console.log("✅  MongoDB connected (direct):", mongoose.connection.host);
    return;
  } catch (err2) {
    console.log("⚠️  Direct connect failed:", err2.message);
  }

  // Both failed
  console.error("❌  MongoDB connection failed completely.");
  console.error("👉  Go to Atlas → Connect → Get connection string → paste output here");
  process.exit(1);
}

module.exports = { connectDB };