require("dotenv").config();
const express = require("express");
const teamRoutes = require("./routes/teamRoutes");
const { initializeDatabase, pool } = require("./config/db");

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.status(200).json({ status: "ok", service: "team-service" });
  } catch (_error) {
    return res.status(503).json({ status: "unhealthy", service: "team-service" });
  }
});

app.use("/teams", teamRoutes);

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error." });
});

const start = async () => {
  await initializeDatabase();
  app.listen(port, () => {
    console.log(`Team service listening on port ${port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start team-service:", error);
  process.exit(1);
});
