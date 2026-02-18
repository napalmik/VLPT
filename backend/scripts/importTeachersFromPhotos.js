const mysql = require("mysql2/promise");

const teachersFromPhotos = [
  { name: "Аниньев Сергей Алексеевич", room: "3.9 вц" },
  { name: "Арсентьев Дмитрий Викторович", room: null },
  { name: "Артиошенко Наталья Николаевна", room: "326" },
  { name: "Байбакова Наталья Васильевна", room: "213" },
  { name: "Бельчич Дмитрий Сергеевич", room: "220" },
  { name: "Благинин Сергей Иванович", room: null },
  { name: "Бостанишли Алена Владимировна", room: null },
  { name: "Бредихина Наталья Витальевна", room: "122" },
  { name: "Бубнов М.", room: "кванториум" },
  { name: "Вдовина Ирина Леонидовна", room: "206" },
  { name: "Володина Ирина Викторовна", room: null },
  { name: "Гаврилов Павел Федотович", room: "124" },
  { name: "Година Виктория Витальевна", room: null },
  { name: "Горшкова Раиса Александровна", room: "207" },
  { name: "Гребенникова Анна Борисовна", room: "302" },
  { name: "Гусев Алексей Викторович", room: "117" },
  { name: "Гусева Ольга Александровна", room: "3.5вц" },
  { name: "Докучаева Елена Юрьевна", room: "304" },
  { name: "Долгин Александр Андреевич", room: "4 корпус" },
  { name: "Дудонова Анастасия Долавна", room: null },
  { name: "Дулин Денис Игоревич", room: "220" },
  { name: "Дмитриев Алексей Андреевич", room: "216" },
  { name: "Дмитриева Елена Николаевна", room: "3.7вц" },
  { name: "Евсеев Виталий Николаевич", room: null },
  { name: "Ефимова Юлия Валерьевна", room: "203" },
  { name: "Жданов Владимир Александрович", room: "4 корпус" },
  { name: "Жракова Галина Михайловна", room: null },
  { name: "Захарова Наталия Сергеевна", room: null },
  { name: "Звонарева Евгения Сергеевна", room: "202" },
  { name: "Ильина Лариса Вячеславовна", room: "311" },
  { name: "Кавешникова Ирина Михайловна", room: "115" },
  { name: "Каленова Татьяна Вениаминовна", room: "002" },
  { name: "Каменских Инна Николаевна", room: "317" },
  { name: "Кем Нелли Ивановна", room: "009" },
  { name: "Кобликова Валентина Сергеевна", room: null },
  { name: "Костин Светлана Ивановна", room: "3.2 вц" },
  { name: "Кошелева Елена Анатольевна", room: "310" },
  { name: "Куневич Елена Петровна", room: "203" },
  { name: "Курлович Елена Павловна", room: "104" },
  { name: "Литвиненко Семён Иванович", room: "217" },
  { name: "Луконин Кирилл Дмитриевич", room: "УП мастерские" },
  { name: "Маслова Юлия Борисовна", room: "УП мастерские" },
  { name: "Матвеева Ирина Сергеевна", room: "3.15 вц" },
  { name: "Мирошкина Наталья Валентиновна", room: null },
  { name: "Морозов Валерий Валерьевич", room: "215" },
  { name: "Мурадова Анна Петровна", room: "314" },
  { name: "Мягочкин Константин Юрьевич", room: null },
  { name: "Негребов Андрей Сергеевич", room: null },
  { name: "Нестеренко Олег Афанасьевич", room: null },
  { name: "Носарева Мария Викторовна", room: "328" },
  { name: "Орин Павел Дмитриевич", room: "305" },
  { name: "Орлова Олеся Александровна", room: null },
  { name: "Павлов Анатолий Романович", room: "230" },
  { name: "Павлова Людмила Александровна", room: "201" },
  { name: "Паренкова Светлана Викторовна", room: "308" },
  { name: "Погорелова Наталья Сергеевна", room: "303" },
  { name: "Полякова Лариса Владимировна", room: "3.8вц" },
  { name: "Попова Анастасия Геннадьевна", room: "204" },
  { name: "Репникова Юлия Сергеевна", room: "3.4вц" },
  { name: "Савельев Анатолий Игоревич", room: null },
  { name: "Садкова Ганна Григорьевна", room: "103" },
  { name: "Саликова Елена Валерьевна", room: "108" },
  { name: "Сарбинтович Марина Марьяновна", room: "324" },
  { name: "Сливнова Наталья Владимировна", room: "106" },
  { name: "Степаненко Полина Алексеевна", room: "312" },
  { name: "Суркова Ольга Викторовна", room: "321" },
  { name: "Такташева Светлана Борисовна", room: "306" },
  { name: "Тараканова Светлана Вячеславовна", room: "222" },
  { name: "Тюменцева Ольга Владимировна", room: "309" },
  { name: "Устич Наталья Алексеевна", room: "3.14вц" },
  { name: "Утишева Наталья Вячеславовна", room: null },
  { name: "Фатеева Татьяна Афанасьевна", room: "118" },
  { name: "Федосеев Сергей Александрович", room: "010" },
  { name: "Федотова Мария Александровна", room: "3.21вц" },
  { name: "Фролова Наталья Юрьевна", room: "120" },
  { name: "Харитонова Владислава Валерьевна", room: "015" },
  { name: "Цыганкова Екатерина Борисовна", room: "208" },
  { name: "Шаповалова Эльвира Анатольевна", room: null },
  { name: "Шелекето Ирина Александровна", room: null },
  { name: "Щекотур Галина Александровна", room: null },
  { name: "Экалова Виктория Александровна", room: "226" },
  { name: "Юдалович Д.М.", room: null },
  { name: "Юрова Ольга Николаевна", room: "307" },
  { name: "Якубовская Надежда Николаевна", room: null }
];

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "vpi_user",
    password: process.env.DB_PASSWORD || "vpi_password",
    database: process.env.DB_NAME || "vpi"
  });

  let inserted = 0;
  let updated = 0;

  try {
    for (let i = 0; i < teachersFromPhotos.length; i += 1) {
      const item = teachersFromPhotos[i];
      const room = item.room && item.room.trim() !== "" ? item.room.trim() : null;

      const [existingRows] = await connection.query(
        "SELECT id FROM directory_teachers WHERE name = ? LIMIT 1",
        [item.name]
      );
      const existing = existingRows;
      if (Array.isArray(existing) && existing.length > 0) {
        if (room) {
          await connection.query(
            "UPDATE directory_teachers SET room_number = ? WHERE name = ?",
            [room, item.name]
          );
          updated += 1;
        }
        continue;
      }

      await connection.query(
        "INSERT INTO directory_teachers (email, name, subject_id, room_number) VALUES (?, ?, NULL, ?)",
        [`import_teacher_${String(i + 1).padStart(3, "0")}@local`, item.name, room]
      );
      inserted += 1;
    }

    console.log(`Import done. Inserted: ${inserted}, updated rooms: ${updated}`);
  } finally {
    await connection.end();
  }
}

run().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});

