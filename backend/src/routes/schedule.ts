import { Router } from "express";
import { pool } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import bcrypt from "bcrypt";

const router = Router();

async function recalcTeacherWorkload(teacherId: number) {
  const [rowsRaw] = await pool.query(
    "SELECT COALESCE(SUM(duration_hours), 0) AS total FROM schedule WHERE teacher_id = ?",
    [teacherId]
  );
  const rows = rowsRaw as { total: number }[];
  const total = rows[0]?.total ?? 0;
  try {
    await pool.query("UPDATE directory_teachers SET workload_hours = ? WHERE id = ?", [total, teacherId]);
  } catch (e: any) {
    if (e?.code !== "ER_BAD_FIELD_ERROR" && e?.code !== "ER_NO_SUCH_TABLE") {
      throw e;
    }
  }
  try {
    await pool.query("UPDATE teachers SET workload_hours = ? WHERE id = ?", [total, teacherId]);
  } catch (e: any) {
    if (e?.code !== "ER_BAD_FIELD_ERROR" && e?.code !== "ER_NO_SUCH_TABLE") {
      throw e;
    }
  }
  try {
    const [teacherRowsRaw] = await pool.query("SELECT email FROM teachers WHERE id = ?", [teacherId]);
    const teacherRows = teacherRowsRaw as { email: string | null }[];
    const teacherEmail = teacherRows[0]?.email ?? null;
    if (teacherEmail) {
      await pool.query("UPDATE directory_teachers SET workload_hours = ? WHERE email = ?", [
        total,
        teacherEmail
      ]);
    }
  } catch (e: any) {
    if (e?.code !== "ER_BAD_FIELD_ERROR" && e?.code !== "ER_NO_SUCH_TABLE") {
      throw e;
    }
  }
}

async function resolveTeacherIdForSchedule(requestedTeacherId: number) {
  const [teachersByIdRaw] = await pool.query("SELECT id FROM teachers WHERE id = ?", [
    requestedTeacherId
  ]);
  const teachersById = teachersByIdRaw as { id: number }[];
  if (teachersById.length > 0) {
    return requestedTeacherId;
  }

  const [directoryByIdRaw] = await pool.query(
    "SELECT id, name, email, subject_id FROM directory_teachers WHERE id = ?",
    [
      requestedTeacherId
    ]
  );
  const directoryById = directoryByIdRaw as {
    id: number;
    name: string;
    email: string | null;
    subject_id: number | null;
  }[];
  if (directoryById.length === 0) {
    return requestedTeacherId;
  }

  const directoryTeacher = directoryById[0];
  const fallbackEmail =
    directoryTeacher.email ||
    `directory_teacher_${directoryTeacher.id}_${Date.now()}@local`;

  if (!directoryTeacher.email) {
    await pool.query("UPDATE directory_teachers SET email = ? WHERE id = ?", [
      fallbackEmail,
      directoryTeacher.id
    ]);
  }

  const [teacherByEmailRaw] = await pool.query("SELECT id FROM teachers WHERE email = ?", [
    fallbackEmail
  ]);
  const teacherByEmail = teacherByEmailRaw as { id: number }[];
  if (teacherByEmail.length > 0) {
    return teacherByEmail[0].id;
  }

  const passwordHash = await bcrypt.hash("password123", 10);
  try {
    const [insertRes] = await pool.query(
      "INSERT INTO teachers (email, password_hash, name, subject_id, access_level, workload_hours) VALUES (?, ?, ?, ?, 'teacher', 0)",
      [fallbackEmail, passwordHash, directoryTeacher.name, directoryTeacher.subject_id ?? null]
    );
    const insertResult = insertRes as { insertId: number };
    return insertResult.insertId;
  } catch (e: any) {
    if (e?.code === "ER_DUP_ENTRY") {
      const [dupRowsRaw] = await pool.query("SELECT id FROM teachers WHERE email = ?", [fallbackEmail]);
      const dupRows = dupRowsRaw as { id: number }[];
      if (dupRows.length > 0) {
        return dupRows[0].id;
      }
    }
    throw e;
  }
}

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: "Необходимы параметры from и to (YYYY-MM-DD)" });
    }

    const [rowsRaw] = await pool.query(
      `SELECT s.id,
              COALESCE(dt.id, dt_legacy.id, s.teacher_id) AS teacher_id,
              DATE_FORMAT(s.date, '%Y-%m-%d') AS date,
              TIME_FORMAT(s.time, '%H:%i:%s') AS time,
              s.duration_hours,
              s.room,
              g.id   AS group_id,
              g.name AS group_name,
              subj.id   AS subject_id,
              subj.name AS subject_name,
              COALESCE(dt.name, dt_legacy.name, t.name, 'Преподаватель') AS teacher_name
       FROM schedule s
       JOIN \`groups\` g ON g.id = s.group_id
       JOIN subjects subj ON subj.id = s.subject_id
       LEFT JOIN teachers t ON t.id = s.teacher_id
       LEFT JOIN directory_teachers dt ON dt.email = t.email
       LEFT JOIN directory_teachers dt_legacy ON dt_legacy.id = s.teacher_id
       WHERE s.date BETWEEN ? AND ?
       ORDER BY s.date, s.time`,
      [from, to]
    );

    res.json(rowsRaw);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: "Ошибка получения расписания",
      details: error?.message || "Неизвестная ошибка"
    });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { date, time, durationHours, groupId, subjectId, room, teacherId } = req.body;
    const requestedTeacherId = Number(teacherId ?? req.user!.id);
    const effectiveTeacherId = await resolveTeacherIdForSchedule(requestedTeacherId);

    if (!date || !time || !durationHours || !groupId || !subjectId || !effectiveTeacherId) {
      return res
        .status(400)
        .json({ message: "Необходимы date, time, durationHours, groupId, subjectId, teacherId" });
    }

    const [result] = await pool.query(
      `INSERT INTO schedule (teacher_id, group_id, subject_id, date, time, duration_hours, room)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [effectiveTeacherId, groupId, subjectId, date, time, durationHours, room ?? null]
    );

    const insertResult = result as { insertId: number };
    await recalcTeacherWorkload(effectiveTeacherId);

    res.status(201).json({ id: insertResult.insertId });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: "Ошибка создания занятия",
      details: error?.message || "Неизвестная ошибка"
    });
  }
});

router.put("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { date, time, durationHours, groupId, subjectId, room, teacherId } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Некорректный id" });
    }

    const [beforeRowsRaw] = await pool.query("SELECT teacher_id FROM schedule WHERE id = ?", [id]);
    const beforeRows = beforeRowsRaw as { teacher_id: number }[];
    if (beforeRows.length === 0) {
      return res.status(404).json({ message: "Занятие не найдено" });
    }
    const oldTeacherId = beforeRows[0].teacher_id;
    const nextTeacherId = teacherId
      ? await resolveTeacherIdForSchedule(Number(teacherId))
      : oldTeacherId;

    await pool.query(
      `UPDATE schedule
       SET date = COALESCE(?, date),
           time = COALESCE(?, time),
           duration_hours = COALESCE(?, duration_hours),
           group_id = COALESCE(?, group_id),
           subject_id = COALESCE(?, subject_id),
           teacher_id = COALESCE(?, teacher_id),
           room = COALESCE(?, room)
       WHERE id = ?`,
      [
        date ?? null,
        time ?? null,
        durationHours ?? null,
        groupId ?? null,
        subjectId ?? null,
        nextTeacherId ?? null,
        room ?? null,
        id
      ]
    );

    await recalcTeacherWorkload(oldTeacherId);
    if (nextTeacherId !== oldTeacherId) {
      await recalcTeacherWorkload(nextTeacherId);
    }

    res.json({ message: "Занятие обновлено" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: "Ошибка обновления занятия",
      details: error?.message || "Неизвестная ошибка"
    });
  }
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: "Некорректный id" });
    }

    const [rowsRaw] = await pool.query("SELECT teacher_id FROM schedule WHERE id = ?", [id]);
    const rows = rowsRaw as { teacher_id: number }[];
    if (rows.length === 0) {
      return res.status(404).json({ message: "Занятие не найдено" });
    }
    const teacherId = rows[0].teacher_id;

    await pool.query("DELETE FROM schedule WHERE id = ?", [id]);
    await recalcTeacherWorkload(teacherId);

    res.json({ message: "Занятие удалено" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: "Ошибка удаления занятия",
      details: error?.message || "Неизвестная ошибка"
    });
  }
});

export default router;




