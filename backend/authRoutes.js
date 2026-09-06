const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("./database");

const router = express.Router();


// ==========================================
// REGISTER
// ==========================================

router.post("/register", async (req, res) => {
  try {
    const { name, username, password } = req.body;

    // Validation
    if (!name || !username || !password) {
      return res.status(400).json({
        message: "Name, username and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters",
      });
    }

    // Check username already exists
    const existingUser = db
      .prepare("SELECT id FROM users WHERE username = ?")
      .get(username.trim());

    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = db
      .prepare(`
        INSERT INTO users
        (name, username, password_hash)
        VALUES (?, ?, ?)
      `)
      .run(
        name.trim(),
        username.trim(),
        passwordHash
      );

    res.status(201).json({
      message: "Registration successful",
      userId: result.lastInsertRowid,
    });

  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      message: "Registration failed",
    });
  }
});


// ==========================================
// LOGIN
// ==========================================

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    // Find user
    const user = db
      .prepare(`
        SELECT *
        FROM users
        WHERE username = ?
      `)
      .get(username.trim());

    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      message: "Login successful",

      token,

      user: {
        id: user.id,
        name: user.name,
        username: user.username,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed",
    });
  }
});


// ==========================================
// GET CURRENT USER
// ==========================================

router.get("/me", require("./authMiddleware"), (req, res) => {
  try {
    const user = db
      .prepare(`
        SELECT id, name, username, created_at
        FROM users
        WHERE id = ?
      `)
      .get(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      user,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get user",
    });
  }
});


module.exports = router;