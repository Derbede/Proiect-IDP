require("dotenv").config();
const express = require("express");

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get("/health", (_req, res) => {
  return res.status(200).json({
    status: "ok",
    service: "auth-service"
  });
});

app.get("/", (_req, res) => {
  return res.status(200).json({
    message: "Auth service is running."
  });
});

app.listen(port, () => {
  console.log(`Auth service listening on port ${port}`);
});
