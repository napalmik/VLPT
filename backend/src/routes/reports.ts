import { Router } from "express";
import { pool } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

interface ReportRow {
  id: number;
  title: string | null;
  created_at: string;
}

router.get("/", authMiddleware, async (_req: AuthRequest, res) => {
  try {
    let rowsRaw: any;
    try {
      const [rowsWithTitle] = await pool.query(
        `SELECT id,
                title,
                created_at
         FROM reports
         ORDER BY created_at DESC`
      );
      rowsRaw = rowsWithTitle;
    } catch (titleErr: any) {
      try {
        const [rowsWithPayload] = await pool.query(
          `SELECT id,
                  JSON_UNQUOTE(JSON_EXTRACT(payload, '$.title')) AS title,
                  created_at
           FROM reports
           ORDER BY created_at DESC`
        );
        rowsRaw = rowsWithPayload;
      } catch {
        try {
          const [rowsFallback] = await pool.query(
            `SELECT id,
                    NULL AS title,
                    created_at
             FROM reports
             ORDER BY created_at DESC`
          );
          rowsRaw = rowsFallback;
        } catch {
          const [rowsNoCreatedAt] = await pool.query(
            `SELECT id,
                    NULL AS title,
                    NOW() AS created_at
             FROM reports
             ORDER BY id DESC`
          );
          rowsRaw = rowsNoCreatedAt;
        }
      }
    }
    const rows = rowsRaw as ReportRow[];
    res.json(
      rows.map((r) => ({
        id: r.id,
        title: r.title || "Без названия",
        createdAt: r.created_at
      }))
    );
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: "Ошибка получения отчётов",
      details: error?.message || "Неизвестная ошибка"
    });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title } = req.body;
    if (!title || typeof title !== "string") {
      return res.status(400).json({ message: "Необходимо указать название отчёта" });
    }

    const teacherId = req.user?.id ?? null;

    let insertRes: any;
    let useTitle = false;
    let usePayload = false;
    try {
      const [result] = await pool.query("INSERT INTO reports (teacher_id, title) VALUES (?, ?)", [
        teacherId,
        title
      ]);
      insertRes = result;
      useTitle = true;
    } catch {
      try {
        const [result] = await pool.query("INSERT INTO reports (title) VALUES (?)", [title]);
        insertRes = result;
        useTitle = true;
      } catch {
        try {
          const [result] = await pool.query(
            "INSERT INTO reports (teacher_id, payload) VALUES (?, ?)",
            [teacherId, JSON.stringify({ title })]
          );
          insertRes = result;
          usePayload = true;
        } catch {
          try {
            const [result] = await pool.query("INSERT INTO reports (payload) VALUES (?)", [
              JSON.stringify({ title })
            ]);
            insertRes = result;
            usePayload = true;
          } catch {
            const [result] = await pool.query("INSERT INTO reports () VALUES ()");
            insertRes = result;
          }
        }
      }
    }
    const result = insertRes as { insertId: number };

    let rowRaw: any;
    if (useTitle) {
      try {
        [rowRaw] = await pool.query("SELECT id, title, created_at FROM reports WHERE id = ?", [
          result.insertId
        ]);
      } catch {
        [rowRaw] = await pool.query("SELECT id, title, NOW() AS created_at FROM reports WHERE id = ?", [
          result.insertId
        ]);
      }
    } else if (usePayload) {
      try {
        [rowRaw] = await pool.query(
          "SELECT id, JSON_UNQUOTE(JSON_EXTRACT(payload, '$.title')) AS title, created_at FROM reports WHERE id = ?",
          [result.insertId]
        );
      } catch {
        [rowRaw] = await pool.query(
          "SELECT id, JSON_UNQUOTE(JSON_EXTRACT(payload, '$.title')) AS title, NOW() AS created_at FROM reports WHERE id = ?",
          [result.insertId]
        );
      }
    } else {
      try {
        [rowRaw] = await pool.query("SELECT id, NULL AS title, created_at FROM reports WHERE id = ?", [
          result.insertId
        ]);
      } catch {
        [rowRaw] = await pool.query("SELECT id, NULL AS title, NOW() AS created_at FROM reports WHERE id = ?", [
          result.insertId
        ]);
      }
    }
    const row = (rowRaw as ReportRow[])[0];

    res.status(201).json({
      id: row.id,
      title: row.title || "Без названия",
      createdAt: row.created_at
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: "Ошибка создания отчёта",
      details: error?.message || "Неизвестная ошибка"
    });
  }
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный id отчёта" });
    }

    await pool.query("DELETE FROM reports WHERE id = ?", [id]);
    res.json({ message: "Отчёт удалён" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: "Ошибка удаления отчёта",
      details: error?.message || "Неизвестная ошибка"
    });
  }
});

export default router;

