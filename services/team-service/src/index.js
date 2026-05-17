require("dotenv").config();
const express = require("express");
const teamRoutes = require("./routes/teamRoutes");
const { initializeDatabase, pool } = require("./config/db");

const app = express();
const port = process.env.PORT || 3003;

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

const start = async (retries = 10, delay = 3000) => {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set.");
    process.exit(1);
  }

  for (let i = 1; i <= retries; i++) {
    try {
      await initializeDatabase();
      app.listen(port, () => {
        console.log(`Team service listening on port ${port}`);
      });
      return;
    } catch (error) {
      console.error(`Attempt ${i}/${retries} failed:`, error.message);
      if (i === retries) {
        console.error("Failed to start team-service after all retries.");
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

start();
