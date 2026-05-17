const express = require("express");
const { pool } = require("../config/db");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticate, async (req, res) => {
  const { title, description, status, assigned_to, team_id } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Title is required." });
  }

  const validStatuses = ["todo", "in_progress", "done"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status. Must be todo, in_progress or done." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description, status, assigned_to, team_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description || null, status || "todo", assigned_to || null, team_id || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tasks ORDER BY created_at DESC");
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get tasks error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Get task error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.put("/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { title, description, status, assigned_to, team_id } = req.body;

  const validStatuses = ["todo", "in_progress", "done"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status. Must be todo, in_progress or done." });
  }

  try {
    const existing = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    const current = existing.rows[0];

    const result = await pool.query(
      `UPDATE tasks
       SET title = $1, description = $2, status = $3, assigned_to = $4, team_id = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        title || current.title,
        description !== undefined ? description : current.description,
        status || current.status,
        assigned_to !== undefined ? assigned_to : current.assigned_to,
        team_id !== undefined ? team_id : current.team_id,
        id
      ]
    );

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Update task error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING id", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    return res.status(200).json({ message: "Task deleted successfully." });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
