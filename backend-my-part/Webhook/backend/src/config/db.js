const mongoose = require("mongoose");

async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("MONGO_URI is missing. Add it to backend/.env");
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      dbName: "logistics",
    });

    console.log("MongoDB connected ✅");
    return true;
  } catch (error) {
    console.error("MongoDB connection failed ❌");
    console.error("Check these four things:");
    console.error("1. Atlas cluster IP is whitelisted.");
    console.error("2. Cluster is active and not paused.");
    console.error("3. DB username/password are correct.");
    console.error("4. Your machine/network is not blocking outbound MongoDB traffic.");
    console.error(error.message);
    return false;
  }
}

module.exports = connectDB;