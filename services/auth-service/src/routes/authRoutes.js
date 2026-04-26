const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

const createToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ message: "Password must have at least 6 characters." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existingUser.rowCount > 0) {
      return res.status(409).json({ message: "User already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
      [normalizedEmail, passwordHash]
    );

    return res.status(201).json({
      message: "User registered successfully.",
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const result = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = createToken(user);
    return res.status(200).json({
      accessToken: token,
      tokenType: "Bearer",
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.get("/validate", authenticate, (req, res) => {
  return res.status(200).json({
    valid: true,
    user: req.user
  });
});

module.exports = router;
