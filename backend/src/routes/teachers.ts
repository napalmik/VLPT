import { Router } from "express";
import { pool } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", authMiddleware, async (_req: AuthRequest, res) => {
  try {
    const [rowsRaw] = await pool.query(
      `SELECT t.id,
              t.email,
              t.name,
              COALESCE(
                (
                  SELECT SUM(sch.duration_hours)
                  FROM schedule sch
                  LEFT JOIN teachers acc2 ON acc2.id = sch.teacher_id
                  WHERE (t.email IS NOT NULL AND acc2.email = t.email)
                     OR (t.email IS NULL AND sch.teacher_id = t.id)
                ),
                0
              ) AS workload_hours,
              t.subject_id,
              t.room_number,
              s.name AS subject_name
       FROM directory_teachers t
       LEFT JOIN subjects s ON s.id = t.subject_id
       INNER JOIN (
         SELECT MIN(id) AS id
         FROM directory_teachers
         GROUP BY COALESCE(email, ''), name
       ) dedup ON dedup.id = t.id
       ORDER BY t.name`
    );
    const rows = rowsRaw as any[];

    const teachers = rows.map((t) => ({
      id: t.id,
      email: t.email,
      name: t.name,
      accessLevel: "teacher",
      workloadHours: Number(t.workload_hours ?? 0),
      subjectId: t.subject_id,
      roomNumber: t.room_number,
      subjectName: t.subject_name
    }));

    res.json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка получения списка преподавателей" });
  }
});

router.get("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный id преподавателя" });
    }

    const [teacherRowsRaw] = await pool.query(
      `SELECT t.id,
              t.email,
              t.name,
              COALESCE(
                (
                  SELECT SUM(sch.duration_hours)
                  FROM schedule sch
                  LEFT JOIN teachers acc2 ON acc2.id = sch.teacher_id
                  WHERE (t.email IS NOT NULL AND acc2.email = t.email)
                     OR (t.email IS NULL AND sch.teacher_id = t.id)
                ),
                0
              ) AS workload_hours,
              t.subject_id,
              t.room_number,
              s.name AS subject_name
       FROM directory_teachers t
       LEFT JOIN subjects s ON s.id = t.subject_id
       WHERE t.id = ?`,
      [id]
    );
    const teacherRows = teacherRowsRaw as any[];
    if (teacherRows.length === 0) {
      return res.status(404).json({ message: "Преподаватель не найден" });
    }

    const teacher = teacherRows[0];

    const [subjectsRowsRaw] = await pool.query(
      `SELECT DISTINCT subj.id, subj.name
       FROM schedule sch
       LEFT JOIN teachers acc ON acc.id = sch.teacher_id
       JOIN subjects subj ON subj.id = sch.subject_id
       WHERE ( ? IS NOT NULL AND acc.email = ? )
          OR ( ? IS NULL AND sch.teacher_id = ? )`,
      [teacher.email, teacher.email ?? "", teacher.email, id]
    );
    const subjectsRows = subjectsRowsRaw as { id: number; name: string }[];

    res.json({
      id: teacher.id,
      email: teacher.email,
      name: teacher.name,
      accessLevel: "teacher",
      workloadHours: Number(teacher.workload_hours ?? 0),
      subjectId: teacher.subject_id,
      roomNumber: teacher.room_number,
      subjectName: teacher.subject_name,
      subjects: subjectsRows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка получения преподавателя" });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { email, name, subjectId, roomNumber } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Необходимо указать имя преподавателя" });
    }
    const normalizedEmail =
      email && typeof email === "string" && email.trim() !== ""
        ? email.trim()
        : `teacher_${Date.now()}_${Math.floor(Math.random() * 10000)}@local`;

    const [existingRaw] = await pool.query(
      "SELECT id FROM directory_teachers WHERE name = ? AND COALESCE(email, '') = COALESCE(?, '')",
      [name.trim(), normalizedEmail]
    );
    const existing = existingRaw as { id: number }[];
    if (existing.length > 0) {
      return res.status(409).json({ message: "Такой преподаватель уже существует" });
    }

    const [insertRes] = await pool.query(
      "INSERT INTO directory_teachers (email, name, subject_id, room_number) VALUES (?, ?, ?, ?)",
      [normalizedEmail, name.trim(), subjectId ?? null, roomNumber?.toString().trim() || null]
    );
    const result = insertRes as { insertId: number };

    res.status(201).json({
      id: result.insertId,
      email: normalizedEmail,
      name,
      accessLevel: "teacher",
      workloadHours: 0,
      subjectId,
      roomNumber: roomNumber?.toString().trim() || null,
      subjectName: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка создания преподавателя" });
  }
});

router.put("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { name, subjectId, roomNumber } = req.body as {
      name?: string;
      subjectId?: number | null;
      roomNumber?: string | null;
    };
    if (!id) {
      return res.status(400).json({ message: "Некорректный id преподавателя" });
    }

    const [existingRaw] = await pool.query("SELECT email FROM directory_teachers WHERE id = ?", [id]);
    const existingRows = existingRaw as { email: string | null }[];
    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Преподаватель не найден" });
    }

    const updates: string[] = [];
    const params: any[] = [];
    if (typeof name === "string" && name.trim() !== "") {
      updates.push("name = ?");
      params.push(name.trim());
    }
    if (subjectId !== undefined) {
      updates.push("subject_id = ?");
      params.push(subjectId === null ? null : Number(subjectId));
    }
    if (roomNumber !== undefined) {
      updates.push("room_number = ?");
      const normalizedRoom = roomNumber?.toString().trim();
      params.push(normalizedRoom ? normalizedRoom : null);
    }
    if (updates.length === 0) {
      return res.status(400).json({ message: "Нет данных для обновления" });
    }

    params.push(id);
    await pool.query(
      `UPDATE directory_teachers
       SET ${updates.join(", ")}
       WHERE id = ?`,
      params
    );

    const email = existingRows[0].email;
    if (email) {
      const accUpdates: string[] = [];
      const accParams: any[] = [];
      if (typeof name === "string" && name.trim() !== "") {
        accUpdates.push("name = ?");
        accParams.push(name.trim());
      }
      if (subjectId !== undefined) {
        accUpdates.push("subject_id = ?");
        accParams.push(subjectId === null ? null : Number(subjectId));
      }
      if (roomNumber !== undefined) {
        accUpdates.push("room_number = ?");
        const normalizedRoom = roomNumber?.toString().trim();
        accParams.push(normalizedRoom ? normalizedRoom : null);
      }
      if (accUpdates.length > 0) {
        accParams.push(email);
        await pool.query(
          `UPDATE teachers
           SET ${accUpdates.join(", ")}
           WHERE email = ?`,
          accParams
        );
      }
    }

    res.json({ message: "Преподаватель обновлён" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: "Ошибка обновления преподавателя",
      details: error?.message || "Неизвестная ошибка"
    });
  }
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    if (!id) {
      conn.release();
      return res.status(400).json({ message: "Некорректный id преподавателя" });
    }

    await conn.beginTransaction();
    const [teacherRowsRaw] = await conn.query(
      "SELECT name, email FROM directory_teachers WHERE id = ?",
      [id]
    );
    const teacherRows = teacherRowsRaw as { name: string; email: string | null }[];
    if (teacherRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Преподаватель не найден" });
    }
    const teacherRow = teacherRows[0];
    const [idsRaw] = await conn.query(
      "SELECT id FROM directory_teachers WHERE name = ? AND COALESCE(email, '') = COALESCE(?, '')",
      [teacherRow.name, teacherRow.email]
    );
    const ids = (idsRaw as { id: number }[]).map((r) => r.id);
    const targetIds = ids.length > 0 ? ids : [id];
    const [accountIdsRaw] = await conn.query(
      `SELECT acc.id
       FROM teachers acc
       JOIN directory_teachers dt ON dt.email = acc.email
       WHERE dt.id IN (?)`,
      [targetIds]
    );
    const accountIds = (accountIdsRaw as { id: number }[]).map((r) => r.id);
    const scheduleTeacherIds = [...new Set([...targetIds, ...accountIds])];

    // Сначала удаляем связанные занятия
    if (scheduleTeacherIds.length > 0) {
      await conn.query("DELETE FROM schedule WHERE teacher_id IN (?)", [scheduleTeacherIds]);
    }
    try {
      await conn.query("UPDATE reports SET teacher_id = NULL WHERE teacher_id IN (?)", [targetIds]);
    } catch (e: any) {
      if (e?.code !== "ER_BAD_FIELD_ERROR" && e?.code !== "ER_NO_SUCH_TABLE") {
        throw e;
      }
    }
    try {
      await conn.query("UPDATE certificates SET teacher_id = NULL WHERE teacher_id IN (?)", [targetIds]);
    } catch (e: any) {
      if (e?.code !== "ER_BAD_FIELD_ERROR" && e?.code !== "ER_NO_SUCH_TABLE") {
        throw e;
      }
    }
    await conn.query("DELETE FROM directory_teachers WHERE id IN (?)", [targetIds]);
    await conn.commit();

    res.json({ message: "Преподаватель удалён" });
  } catch (error: any) {
    try {
      await conn.rollback();
    } catch {
      // ignore rollback errors
    }
    console.error(error);
    res.status(500).json({
      message: "Ошибка удаления преподавателя",
      details: error?.message || "Неизвестная ошибка"
    });
  } finally {
    conn.release();
  }
});

export default router;

