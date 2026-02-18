CREATE DATABASE IF NOT EXISTS vpi
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vpi;

CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  subject_id INT NULL,
  workload_hours DECIMAL(6,2) DEFAULT 0,
  access_level ENUM('teacher','admin') DEFAULT 'teacher',
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE TABLE IF NOT EXISTS `groups` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  group_id INT NOT NULL,
  subject_id INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration_hours DECIMAL(4,2) NOT NULL,
  room VARCHAR(50),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (group_id) REFERENCES `groups`(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  data JSON NOT NULL,
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Тестовые данные по ТЗ
INSERT INTO subjects (name) VALUES ('Тестовый предмет')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO `groups` (name) VALUES ('OSP(9)')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Преподаватель: teacher@example.com / password123
INSERT INTO teachers (email, password_hash, name, subject_id, workload_hours, access_level)
VALUES (
  'teacher@example.com',
  '$2b$10$abcdefghijklmnopqrstuv1234567890abcdefghi', -- заглушка, обновится приложением
  'Test Teacher',
  (SELECT id FROM subjects WHERE name = 'Тестовый предмет' LIMIT 1),
  0,
  'teacher'
)
ON DUPLICATE KEY UPDATE email = email;






