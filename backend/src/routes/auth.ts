import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { pool } from "../db";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES_IN = "8h";

const RESET_TOKEN_EXPIRES_IN = "1h";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: false,
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    : undefined
});

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, subjectId } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: "Необходимы email, пароль и имя" });
    }

    const [existing] = await pool.query("SELECT id FROM teachers WHERE email = ?", [email]);
    const rows = existing as { id: number }[];
    if (rows.length > 0) {
      return res.status(409).json({ message: "Пользователь с таким email уже существует" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO teachers (email, password_hash, name, subject_id, access_level) VALUES (?, ?, ?, ?, 'teacher')",
      [email, passwordHash, name, subjectId ?? null]
    );

    const insertResult = result as { insertId: number };
    const teacherId = insertResult.insertId;

    const token = jwt.sign({ id: teacherId, email, accessLevel: "teacher" }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    res.status(201).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка регистрации" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Необходимы email и пароль" });
    }

    const [rowsRaw] = await pool.query(
      "SELECT id, email, password_hash, name, access_level, workload_hours FROM teachers WHERE email = ?",
      [email]
    );
    const rows = rowsRaw as {
      id: number;
      email: string;
      password_hash: string;
      name: string;
      access_level: string;
      workload_hours: number;
    }[];

    if (rows.length === 0) {
      return res.status(401).json({ message: "Пользователь с таким email не найден" });
    }

    const teacher = rows[0];
    const isValid = await bcrypt.compare(password, teacher.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Неверный пароль" });
    }

    const token = jwt.sign(
      { id: teacher.id, email: teacher.email, accessLevel: teacher.access_level },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const workloadNumber = Number((teacher as any).workload_hours ?? 0);

    res.json({
      token,
      teacher: {
        id: teacher.id,
        email: teacher.email,
        name: teacher.name,
        accessLevel: teacher.access_level,
        workloadHours: workloadNumber
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка входа" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Необходим email" });
    }

    const [rowsRaw] = await pool.query("SELECT id, email FROM teachers WHERE email = ?", [email]);
    const rows = rowsRaw as { id: number; email: string }[];

    // Отвечаем одинаково, чтобы не раскрывать, есть ли такой пользователь
    if (rows.length === 0) {
      return res.json({ message: "Если такой email зарегистрирован, будет отправлено письмо" });
    }

    const teacher = rows[0];

    const token = jwt.sign(
      { id: teacher.id, email: teacher.email, type: "reset" },
      JWT_SECRET,
      { expiresIn: RESET_TOKEN_EXPIRES_IN }
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetLink = `${frontendUrl.replace(/\/$/, "")}/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@example.com",
      to: teacher.email,
      subject: "Сброс пароля",
      text: `Для сброса пароля перейдите по ссылке: ${resetLink}`,
      html: `<p>Для сброса пароля перейдите по ссылке:</p><p><a href="${resetLink}">${resetLink}</a></p>`
    };

    try {
      if (process.env.SMTP_HOST) {
        await transporter.sendMail(mailOptions);
      } else {
        // Для локальной разработки просто логируем ссылку
        console.log("Reset password link:", resetLink);
      }
    } catch (mailError) {
      console.error("Mail send error", mailError);
    }

    res.json({ message: "Если такой email зарегистрирован, будет отправлено письмо" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка запроса на сброс пароля" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Необходимы токен и новый пароль" });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(400).json({ message: "Неверный или истёкший токен" });
    }

    if (payload.type !== "reset") {
      return res.status(400).json({ message: "Неверный тип токена" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE teachers SET password_hash = ? WHERE id = ?", [
      passwordHash,
      payload.id
    ]);

    res.json({ message: "Пароль обновлён" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сброса пароля" });
  }
});

export default router;






