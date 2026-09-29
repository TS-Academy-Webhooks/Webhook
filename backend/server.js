require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");
const {
  assignLegacyUsersCustomerRole,
  bootstrapAdminAccount,
} = require("./src/services/authService");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.toLowerCase().includes("replace")) {
      throw new Error("JWT_SECRET must contain at least 32 characters. Set a strong random value in backend/.env.");
    }
    if (process.env.NODE_ENV === "production" &&
        (!process.env.CORS_ORIGIN || /localhost|127\.0\.0\.1|\*/i.test(process.env.CORS_ORIGIN))) {
      throw new Error("Set CORS_ORIGIN to the production frontend origin before starting in production.");
    }
    await connectDB();
    await assignLegacyUsersCustomerRole();
    await bootstrapAdminAccount();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

startServer();