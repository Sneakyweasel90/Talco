import express from "express";
import db from "../db/postgres.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Middleware: admin only
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  next();
}

// Helper: get the owner (lowest ID user) and target user info
async function getTargetAndOwner(targetId) {
  const { rows: ownerRows } = await db.query(
    `SELECT id FROM users ORDER BY id ASC LIMIT 1`
  );
  const { rows: targetRows } = await db.query(
    `SELECT id, username, role FROM users WHERE id = $1`, [targetId]
  );
  return {
    ownerId: ownerRows[0]?.id ?? null,
    target: targetRows[0] ?? null,
  };
}

// GET /api/admin/users — list all users with role info
// Also returns the owner id so the UI can lock them down
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, username, nickname, avatar, role, custom_role_name, banned_at, created_at
     FROM users ORDER BY created_at ASC`
  );
  const { rows: ownerRows } = await db.query(
    `SELECT id FROM users ORDER BY id ASC LIMIT 1`
  );
  res.json({ users: rows, ownerId: ownerRows[0]?.id ?? null });
});

// PATCH /api/admin/users/:id/role
router.patch("/users/:id/role", requireAuth, requireAdmin, async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (isNaN(targetId)) return res.status(400).json({ error: "Invalid user id" });
  if (targetId === req.user.id) return res.status(400).json({ error: "Cannot change your own role" });

  const { ownerId, target } = await getTargetAndOwner(targetId);
  if (!target) return res.status(404).json({ error: "User not found" });

  // Nobody can change the owner's role
  if (targetId === ownerId) return res.status(403).json({ error: "Cannot change the server owner's role" });

  // Only the owner can promote/demote other admins
  if (target.role === "admin" && req.user.id !== ownerId)
    return res.status(403).json({ error: "Only the server owner can change another admin's role" });

  const { role, customRoleName } = req.body;
  const validRoles = ["admin", "user", "custom"];
  if (!validRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });

  const cleanCustomName = role === "custom"
    ? (customRoleName || "").trim().slice(0, 50) || "Member"
    : null;

  const { rows } = await db.query(
    `UPDATE users SET role = $1, custom_role_name = $2 WHERE id = $3
     RETURNING id, username, role, custom_role_name`,
    [role, cleanCustomName, targetId]
  );

  res.json(rows[0]);
});

// POST /api/admin/users/:id/kick — invalidate all sessions (force logout)
router.post("/users/:id/kick", requireAuth, requireAdmin, async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (isNaN(targetId)) return res.status(400).json({ error: "Invalid user id" });
  if (targetId === req.user.id) return res.status(400).json({ error: "Cannot kick yourself" });

  const { ownerId, target } = await getTargetAndOwner(targetId);
  if (!target) return res.status(404).json({ error: "User not found" });

  // Nobody can kick the owner
  if (targetId === ownerId) return res.status(403).json({ error: "Cannot kick the server owner" });

  // Admins cannot kick other admins (only owner could, but owner can't be kicked either)
  if (target.role === "admin") return res.status(403).json({ error: "Cannot kick another admin" });

  await db.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [targetId]);
  res.json({ ok: true });
});

// POST /api/admin/users/:id/ban
router.post("/users/:id/ban", requireAuth, requireAdmin, async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (isNaN(targetId)) return res.status(400).json({ error: "Invalid user id" });
  if (targetId === req.user.id) return res.status(400).json({ error: "Cannot ban yourself" });

  const { ownerId, target } = await getTargetAndOwner(targetId);
  if (!target) return res.status(404).json({ error: "User not found" });

  // Nobody can ban the owner
  if (targetId === ownerId) return res.status(403).json({ error: "Cannot ban the server owner" });

  // Admins cannot ban other admins
  if (target.role === "admin") return res.status(403).json({ error: "Cannot ban another admin" });

  await db.query(`UPDATE users SET banned_at = NOW() WHERE id = $1`, [targetId]);
  await db.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [targetId]);
  res.json({ ok: true });
});

// POST /api/admin/users/:id/unban
router.post("/users/:id/unban", requireAuth, requireAdmin, async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (isNaN(targetId)) return res.status(400).json({ error: "Invalid user id" });

  await db.query(`UPDATE users SET banned_at = NULL WHERE id = $1`, [targetId]);
  res.json({ ok: true });
});

export default router;