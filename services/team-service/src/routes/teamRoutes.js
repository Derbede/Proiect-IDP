const express = require("express");
const { pool } = require("../config/db");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticate, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Team name is required." });
  }

  try {
    const existing = await pool.query("SELECT id FROM teams WHERE name = $1", [name]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ message: "Team name already exists." });
    }

    const result = await pool.query(
      `INSERT INTO teams (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description || null, req.user.id]
    );

    await pool.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [result.rows[0].id, req.user.id]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create team error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM teams ORDER BY created_at DESC");
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get teams error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM teams WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Team not found." });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Get team error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.put("/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const existing = await pool.query("SELECT * FROM teams WHERE id = $1", [id]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ message: "Team not found." });
    }

    const current = existing.rows[0];

    const result = await pool.query(
      `UPDATE teams SET name = $1, description = $2 WHERE id = $3 RETURNING *`,
      [name || current.name, description !== undefined ? description : current.description, id]
    );

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Update team error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM teams WHERE id = $1 RETURNING id", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Team not found." });
    }

    return res.status(200).json({ message: "Team deleted successfully." });
  } catch (error) {
    console.error("Delete team error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.post("/:id/members", authenticate, async (req, res) => {
  const { id } = req.params;
  const { user_id, role } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: "user_id is required." });
  }

  const validRoles = ["owner", "member"];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role. Must be owner or member." });
  }

  try {
    const team = await pool.query("SELECT id FROM teams WHERE id = $1", [id]);
    if (team.rowCount === 0) {
      return res.status(404).json({ message: "Team not found." });
    }

    const result = await pool.query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, user_id, role || "member"]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "User is already a member of this team." });
    }
    console.error("Add member error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.get("/:id/members", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const team = await pool.query("SELECT id FROM teams WHERE id = $1", [id]);
    if (team.rowCount === 0) {
      return res.status(404).json({ message: "Team not found." });
    }

    const result = await pool.query(
      "SELECT * FROM team_members WHERE team_id = $1 ORDER BY joined_at ASC",
      [id]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get members error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.delete("/:id/members/:userId", authenticate, async (req, res) => {
  const { id, userId } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM team_members WHERE team_id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Member not found in this team." });
    }

    return res.status(200).json({ message: "Member removed successfully." });
  } catch (error) {
    console.error("Remove member error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
