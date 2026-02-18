import mysql from "mysql2/promise";

const {
  DB_HOST = "localhost",
  DB_PORT = "3306",
  DB_USER = "vpi_user",
  DB_PASSWORD = "vpi_password",
  DB_NAME = "vpi"
} = process.env;

export const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function initDb() {
  const conn = await pool.getConnection();
  try {
    // Таблица предметов
    await conn.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Таблица групп
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`groups\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Таблица преподавателей
    await conn.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        subject_id INT NULL,
        room_number VARCHAR(50) NULL,
        access_level VARCHAR(50) NOT NULL DEFAULT 'teacher',
        workload_hours DECIMAL(6,2) NULL,
        INDEX idx_teachers_subject_id (subject_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Справочник преподавателей для расписания (отдельно от аккаунтов)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS directory_teachers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NULL,
        name VARCHAR(255) NOT NULL,
        subject_id INT NULL,
        room_number VARCHAR(50) NULL,
        workload_hours DECIMAL(6,2) NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Мягкая миграция для существующих БД
    try {
      await conn.query("ALTER TABLE teachers ADD COLUMN room_number VARCHAR(50) NULL AFTER subject_id");
    } catch {
      // Колонка уже существует
    }
    try {
      await conn.query(
        "ALTER TABLE directory_teachers ADD COLUMN room_number VARCHAR(50) NULL AFTER subject_id"
      );
    } catch {
      // Колонка уже существует
    }

    // Таблица расписания
    await conn.query(`
      CREATE TABLE IF NOT EXISTS schedule (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        group_id INT NOT NULL,
        subject_id INT NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        duration_hours DECIMAL(4,2) NOT NULL,
        room VARCHAR(50) NULL,
        INDEX idx_schedule_teacher (teacher_id),
        INDEX idx_schedule_group (group_id),
        INDEX idx_schedule_subject (subject_id),
        INDEX idx_schedule_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Таблица отчётов
    await conn.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NULL,
        group_id INT NULL,
        period_from DATE NULL,
        period_to DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payload JSON NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Гарантируем наличие текстового поля title для простого доступа к названию
    try {
      await conn.query(
        "ALTER TABLE reports ADD COLUMN title VARCHAR(255) NULL AFTER period_to"
      );
    } catch {
      // Если колонка уже существует — просто игнорируем ошибку
    }

    // Таблица справок
    await conn.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NULL,
        group_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payload JSON NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Автосоздание предметов/групп/преподавателей отключено:
    // справочники заполняются только через UI/API.
  } finally {
    conn.release();
  }
}








