const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Database
require("./database");

const orderRoutes = require("./orderRoutes");
const authRoutes = require("./authRoutes");
const liningRoutes = require("./liningRoutes");

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://subasree-boutique.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

// ==========================================
// TEST ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "Tailoring Backend API is running",
  });
});

// ==========================================
// AUTH ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

// ==========================================
// LINING ROUTES
// ==========================================

app.use("/api", liningRoutes);

// ==========================================
// ORDER ROUTES
// ==========================================

app.use("/api/orders", orderRoutes);

// ==========================================
// SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("=================================");
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log("=================================");
});