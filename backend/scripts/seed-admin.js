// scripts/seed-admin.js

// One-time helper script: creates an admin account, or promotes an existing account to admin if the email is already registered.

// Run it with: npm run seed

// It reads everything from .env, nothing is hardcoded here.

// Add these to your .env before running:
//   ADMIN_NAME=Admin User
//   ADMIN_EMAIL=admin@example.com
//   ADMIN_PASSWORD=SomeStrongPassword123

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/User");

async function run() {
    const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!MONGO_URI) {
        console.error("MONGO_URI is missing from .env — nothing to connect to.");
        process.exit(1);
    }
    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.error(
            "Missing ADMIN_NAME, ADMIN_EMAIL, or ADMIN_PASSWORD in .env. Add all three and try again."
        );
        process.exit(1);
    }
    if (ADMIN_PASSWORD.length < 8) {
        console.error("ADMIN_PASSWORD must be at least 8 characters.");
        process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    const email = ADMIN_EMAIL.trim().toLowerCase();
    const existing = await User.findOne({ email });

    if (existing) {
        if (existing.role === "admin") {
            console.log(`"${email}" is already an admin. Nothing to do.`);
        } else {
            existing.role = "admin";
            await existing.save();
            console.log(`"${email}" already existed — promoted to admin.`);
        }
    } else {
        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
        await User.create({
            name: ADMIN_NAME,
            email,
            passwordHash, // hashed automatically by the User model
            role: "admin",
        });
        console.log(`Created a new admin account for "${email}".`);
    }

    await mongoose.disconnect();
    console.log("Done.");
}

run().catch((err) => {
    console.error("Seed script failed:", err.message);
    process.exit(1);
});
