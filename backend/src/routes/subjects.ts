import { Router } from "express";
import { pool } from "../db";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/", authMiddleware, async (_req, res) => {
  try {
    const [rowsRaw] = await pool.query("SELECT id, name FROM subjects ORDER BY name");
    const rows = rowsRaw as { id: number; name: string }[];
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка получения списка предметов" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Необходимо указать название предмета" });
    }

    const [existingRaw] = await pool.query("SELECT id FROM subjects WHERE name = ?", [name]);
    const existing = existingRaw as { id: number }[];
    if (existing.length > 0) {
      return res.status(409).json({ message: "Предмет с таким названием уже существует" });
    }

    const [insertRes] = await pool.query("INSERT INTO subjects (name) VALUES (?)", [name]);
    const result = insertRes as { insertId: number };

    res.status(201).json({ id: result.insertId, name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка создания предмета" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;
    if (!id || !name) {
      return res.status(400).json({ message: "Некорректные данные" });
    }

    await pool.query("UPDATE subjects SET name = ? WHERE id = ?", [name, id]);
    res.json({ message: "Предмет обновлён" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка обновления предмета" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    if (!id) {
      conn.release();
      return res.status(400).json({ message: "Некорректный id предмета" });
    }

    await conn.beginTransaction();
    await conn.query("DELETE FROM schedule WHERE subject_id = ?", [id]);
    try {
      await conn.query("UPDATE teachers SET subject_id = NULL WHERE subject_id = ?", [id]);
    } catch (e: any) {
      if (e?.code !== "ER_BAD_FIELD_ERROR" && e?.code !== "ER_NO_SUCH_TABLE") {
        throw e;
      }
    }

    // Таблица directory_teachers может отсутствовать, если сервер не был перезапущен после миграции.
    try {
      await conn.query(
        "UPDATE directory_teachers SET subject_id = NULL WHERE subject_id = ?",
        [id]
      );
    } catch (e: any) {
      if (e?.code !== "ER_BAD_FIELD_ERROR" && e?.code !== "ER_NO_SUCH_TABLE") {
        throw e;
      }
    }

    await conn.query("DELETE FROM subjects WHERE id = ?", [id]);
    await conn.commit();

    res.json({ message: "Предмет удалён" });
  } catch (error: any) {
    try {
      await conn.rollback();
    } catch {
      // ignore rollback errors
    }
    console.error(error);
    res.status(500).json({
      message: "Ошибка удаления предмета",
      details: error?.message || "Неизвестная ошибка"
    });
  } finally {
    conn.release();
  }
});

export default router;

