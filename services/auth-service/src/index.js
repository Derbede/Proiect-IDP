require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const { initializeDatabase, pool } = require("./config/db");

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.status(200).json({ status: "ok", service: "auth-service" });
  } catch (_error) {
    return res.status(503).json({ status: "unhealthy", service: "auth-service" });
  }
});

app.use("/auth", authRoutes);

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error." });
});

const start = async () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set.");
  }

  await initializeDatabase();

  app.listen(port, () => {
    console.log(`Auth service listening on port ${port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start auth-service:", error);
  process.exit(1);
});
