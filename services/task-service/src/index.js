require("dotenv").config();
const express = require("express");
const taskRoutes = require("./routes/taskRoutes");
const { initializeDatabase, pool } = require("./config/db");

const app = express();
const port = process.env.PORT || 3003;

app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.status(200).json({ status: "ok", service: "task-service" });
  } catch (_error) {
    return res.status(503).json({ status: "unhealthy", service: "task-service" });
  }
});

app.use("/tasks", taskRoutes);

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error." });
});

const start = async () => {
  await initializeDatabase();
  app.listen(port, () => {
    console.log(`Task service listening on port ${port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start task-service:", error);
  process.exit(1);
});
