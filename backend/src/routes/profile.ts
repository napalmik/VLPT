import { Router } from "express";
import { pool } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const [rowsRaw] = await pool.query(
      `SELECT t.id,
              t.email,
              t.name,
              t.subject_id,
              t.workload_hours,
              t.access_level,
              s.name AS subject_name
       FROM teachers t
       LEFT JOIN subjects s ON s.id = t.subject_id
       WHERE t.id = ?`,
      [userId]
    );

    const rows = rowsRaw as any[];
    if (rows.length === 0) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const t = rows[0];
    res.json({
      id: t.id,
      email: t.email,
      name: t.name,
      subjectId: t.subject_id,
      subjectName: t.subject_name,
      workloadHours: Number(t.workload_hours ?? 0),
      accessLevel: t.access_level
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка получения профиля" });
  }
});

router.put("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, subjectId, accessLevel, workloadHours } = req.body;

    await pool.query(
      `UPDATE teachers
       SET name = COALESCE(?, name),
           subject_id = ?,
           access_level = COALESCE(?, access_level),
           workload_hours = COALESCE(?, workload_hours)
       WHERE id = ?`,
      [name ?? null, subjectId ?? null, accessLevel ?? null, workloadHours ?? null, userId]
    );

    res.json({ message: "Профиль обновлён" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка обновления профиля" });
  }
});

router.get("/subjects", authMiddleware, async (_req, res) => {
  try {
    const [rowsRaw] = await pool.query("SELECT id, name FROM subjects ORDER BY name");
    const rows = rowsRaw as { id: number; name: string }[];
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка получения списка предметов" });
  }
});

export default router;




