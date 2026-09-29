const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }

  return jwt.sign({}, process.env.JWT_SECRET, {
    subject: user._id.toString(),
    expiresIn: "1d",
  });
}

exports.register = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new AppError("JWT_SECRET is not configured", 500);
    }
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError("An account with this email already exists", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    const token = createToken(user);

    return sendSuccess(res, "Account registered successfully", {
      user: toPublicUser(user),
      token,
    }, 201);
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new AppError("JWT_SECRET is not configured", 500);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+passwordHash");
    const passwordMatches = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!passwordMatches) {
      throw new AppError("Email or password is incorrect", 401);
    }

    return sendSuccess(res, "Login successful", {
      user: toPublicUser(user),
      token: createToken(user),
    });
  } catch (error) {
    return next(error);
  }
};

exports.me = (req, res) => {
  return sendSuccess(res, "Current user retrieved successfully", {
    user: toPublicUser(req.user),
  });
};