import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

type AuthMode = "login" | "register";

interface Teacher {
  id: number;
  email: string;
  name: string;
  accessLevel: string;
  workloadHours: number;
  subjectId?: number | null;
  subjectName?: string | null;
  roomNumber?: string | null;
  subjects?: Subject[];
}

interface Subject {
  id: number;
  name: string;
}

interface Group {
  id: number;
  name: string;
}

interface ScheduleItem {
  id: number;
  teacher_id: number;
  teacher_name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  duration_hours: number;
  room: string | null;
  group_id: number;
  group_name: string;
  subject_id: number;
  subject_name: string;
}

interface ReportItem {
  id: number;
  title: string;
  createdAt: string;
}

interface SpecialtyRow {
  code: string;
  title: string;
  course1: string;
  course2: string;
  course3: string;
  course4: string;
  course5: string;
}

const INITIAL_SPECIALTIES_FROM_TABLE: SpecialtyRow[] = [
  {
    code: "15.02.09",
    title: "Аддитивные технологии",
    course1: "АДТ-5",
    course2: "АДТ-4",
    course3: "АДТ-3",
    course4: "АДТ-2",
    course5: "-"
  },
  {
    code: "11.02.15",
    title: "Инфокоммуникационные сети и системы связи",
    course1: "ИКС-9",
    course2: "ИКС-8",
    course3: "ИКС-7",
    course4: "ИКС-6",
    course5: "ИКС-5"
  },
  {
    code: "11.02.16",
    title: "Монтаж, техническое обслуживание и ремонт электронных приборов и устройств",
    course1: "-",
    course2: "-",
    course3: "-",
    course4: "ЭПУ-5",
    course5: "-"
  },
  {
    code: "13.02.01",
    title: "Тепловые электрические станции",
    course1: "ТЭС-3",
    course2: "ТЭС-2",
    course3: "ТЭС-1",
    course4: "-",
    course5: "-"
  },
  {
    code: "13.02.06",
    title: "Релейная защита и автоматизация электроэнергетических систем",
    course1: "-",
    course2: "-",
    course3: "-",
    course4: "РЗА-1",
    course5: "-"
  },
  {
    code: "13.02.07",
    title: "Электроснабжение (по отраслям)",
    course1: "-",
    course2: "-",
    course3: "-",
    course4: "ЭС-2",
    course5: "-"
  },
  {
    code: "13.02.11",
    title:
      "Техническая эксплуатация и обслуживание электрического и электромеханического оборудования (по отраслям)",
    course1: "-",
    course2: "-",
    course3: "-",
    course4: "-",
    course5: "-"
  },
  {
    code: "13.02.12",
    title: "Электрические станции, сети, их релейная защита и автоматизация",
    course1: "-",
    course2: "ЭСА-2",
    course3: "ЭСА-1",
    course4: "-",
    course5: "-"
  },
  {
    code: "13.02.13",
    title:
      "Эксплуатация и обслуживание электрического и электромеханического оборудования (по отраслям)",
    course1: "ЭМО-6, ЭМО-7",
    course2: "ЭМО-3, ЭМО-4, ЭМО-5",
    course3: "ЭМО-1, ЭМО-2",
    course4: "-",
    course5: "-"
  },
  {
    code: "13.02.13",
    title:
      "Эксплуатация и обслуживание электрического и электромеханического оборудования (по отраслям)",
    course1: "ЭМО-8",
    course2: "-",
    course3: "-",
    course4: "-",
    course5: "-"
  },
  {
    code: "15.02.14",
    title:
      "Оснащение средствами автоматизации технологических процессов и производств (по отраслям)",
    course1: "-",
    course2: "-",
    course3: "ОСП-10",
    course4: "-",
    course5: "-"
  },
  {
    code: "15.02.14",
    title:
      "Оснащение средствами автоматизации технологических процессов и производств (по отраслям)",
    course1: "-",
    course2: "-",
    course3: "ОСП-11, ОСП-13, ОСП-12",
    course4: "ОСП-9",
    course5: "-"
  },
  {
    code: "27.02.04",
    title: "Автоматические системы управления",
    course1: "АСУ-8, АСУ-9",
    course2: "АСУ-5, АСУ-6",
    course3: "АСУ-4",
    course4: "-",
    course5: "-"
  },
  {
    code: "27.02.04",
    title: "Автоматические системы управления",
    course1: "АСУ-10",
    course2: "АСУ-7",
    course3: "-",
    course4: "-",
    course5: "-"
  },
  {
    code: "09.02.01",
    title: "Компьютерные системы и комплексы",
    course1: "ЭВТ-77",
    course2: "ЭВТ-76",
    course3: "ЭВТ-75",
    course4: "ЭВТ-74",
    course5: "-"
  },
  {
    code: "18.02.07",
    title: "Технология производства и переработки пластических масс и эластомеров",
    course1: "ПМП-62",
    course2: "ПМП-61",
    course3: "ПМП-60",
    course4: "ПМП-59",
    course5: "-"
  },
  {
    code: "18.02.06",
    title: "Химическая технология органических веществ",
    course1: "-",
    course2: "-",
    course3: "-",
    course4: "ХТО-2",
    course5: "-"
  },
  {
    code: "18.02.14",
    title: "Химическая технология производства химических соединений",
    course1: "ТПО-3",
    course2: "ТПН-2, ТПО-2",
    course3: "ТПН-1, ТПО-1",
    course4: "-",
    course5: "-"
  },
  {
    code: "20.02.01",
    title: "Экологическая безопасность природных комплексов",
    course1: "ЭКБ-4",
    course2: "-",
    course3: "ЭКБ-3",
    course4: "-",
    course5: "-"
  },
  {
    code: "38.02.01",
    title: "Экономика и бухгалтерский учет (по отраслям)",
    course1: "Б-107",
    course2: "Б-104",
    course3: "Б-101",
    course4: "-",
    course5: "-"
  },
  {
    code: "21.02.17",
    title: "Подземная разработка месторождений полезных ископаемых",
    course1: "РПИ-6, РПИ-7",
    course2: "РПИ-4, РПИ-5",
    course3: "РПИ-3",
    course4: "РПИ-2",
    course5: "-"
  },
  {
    code: "09.02.06",
    title: "Сетевое и системное администрирование",
    course1: "ССА-8",
    course2: "ССА-7",
    course3: "ССА-6",
    course4: "ССА-5",
    course5: "-"
  },
  {
    code: "09.02.07",
    title: "Информационные системы и программирование",
    course1: "ИСП-11, ИСП-12",
    course2: "ИСП-10",
    course3: "-",
    course4: "ИСП-9",
    course5: "-"
  },
  {
    code: "21.02.18",
    title: "Обогащение полезных ископаемых",
    course1: "ОПИ-2",
    course2: "ОПИ-1",
    course3: "-",
    course4: "-",
    course5: "-"
  },
  {
    code: "23.02.07",
    title: "Техническое обслуживание и ремонт двигателей, систем и агрегатов автомобилей",
    course1: "-",
    course2: "-",
    course3: "ТОА-12",
    course4: "ТОА-9",
    course5: "-"
  },
  {
    code: "23.02.07",
    title: "Техническое обслуживание и ремонт автотранспортных средств",
    course1: "РАТ-6",
    course2: "РАТ-3",
    course3: "-",
    course4: "-",
    course5: "-"
  },
  {
    code: "38.02.01",
    title: "Экономика и бухгалтерский учет(по отраслям)",
    course1: "Б-108",
    course2: "Б-105, Б-106",
    course3: "Б-102, Б-103",
    course4: "-",
    course5: "-"
  },
  {
    code: "15.02.12",
    title: "Монтаж, техническое обслуживание и ремонт промышленного оборудования(по отраслям)",
    course1: "-",
    course2: "-",
    course3: "-",
    course4: "МРО-6",
    course5: "-"
  },
  {
    code: "22.02.01",
    title: "Металлургия черных металлов",
    course1: "-",
    course2: "-",
    course3: "-",
    course4: "МЧМ-3",
    course5: "-"
  },
  {
    code: "22.02.05",
    title: "Обработка металлов давлением",
    course1: "-",
    course2: "-",
    course3: "-",
    course4: "ОМД-9",
    course5: "-"
  },
  {
    code: "22.02.08",
    title: "Металлургическое производство (по видам производства)",
    course1: "-",
    course2: "-",
    course3: "-",
    course4: "-",
    course5: "-"
  }
];
const SPECIALTIES_STORAGE_KEY = "vpi_specialties_data_v1";
const SUBJECT_TEACHER_ASSIGNMENTS_KEY = "vpi_subject_teacher_assignments_v1";
const REPLACEMENT_ASSIGNMENTS_KEY = "vpi_replacement_assignments_v1";
const TEACHER_REPLACEMENT_DEFAULTS_KEY = "vpi_teacher_replacement_defaults_v1";
const REPLACEMENT_STATS_SNAPSHOT_KEY = "vpi_replacement_stats_snapshot_v1";

const App: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("teacher@example.com");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);

  const [profileLoading, setProfileLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [profileName, setProfileName] = useState("");
  const [profileSubjectId, setProfileSubjectId] = useState<number | null>(null);
  const [profileAccessLevel, setProfileAccessLevel] = useState("teacher");
  const [profileWorkload, setProfileWorkload] = useState<string>("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const searchParams = new URLSearchParams(window.location.search);
  const resetToken = searchParams.get("token");
  const isResetPasswordPage = window.location.pathname === "/reset-password" && !!resetToken;
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const [weekStart, setWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay() || 7; // 1-7, где 1 - Пн
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day - 1));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [scheduleFormDate, setScheduleFormDate] = useState<string>("");
  const [scheduleFormTime, setScheduleFormTime] = useState<string>("08:00");
  const [scheduleFormDuration, setScheduleFormDuration] = useState<string>("2");
  const [scheduleFormRoom, setScheduleFormRoom] = useState<string>("");
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [scheduleFormGroupId, setScheduleFormGroupId] = useState<number | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [lastSelectedSubjectIndex, setLastSelectedSubjectIndex] = useState<number | null>(null);
  const [sidebarSection, setSidebarSection] = useState<
    "teachers" | "groups" | "subjects" | "reports"
  >("teachers");
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherLastName, setTeacherLastName] = useState("");
  const [teacherFirstName, setTeacherFirstName] = useState("");
  const [teacherMiddleName, setTeacherMiddleName] = useState("");
  const [teacherModalSubjectId, setTeacherModalSubjectId] = useState<number | null>(null);
  const [teacherModalRoomNumber, setTeacherModalRoomNumber] = useState("");
  const [teacherCardSubjectId, setTeacherCardSubjectId] = useState<number | null>(null);
  const [teacherCardRoomNumber, setTeacherCardRoomNumber] = useState("");
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [scheduleSelectedGroupId, setScheduleSelectedGroupId] = useState<number | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [lastSelectedGroupIndex, setLastSelectedGroupIndex] = useState<number | null>(null);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [subjectTeacherAssignments, setSubjectTeacherAssignments] = useState<
    Record<number, { subgroup1TeacherId: number | null; subgroup2TeacherId: number | null }>
  >(() => {
    try {
      const raw = localStorage.getItem(SUBJECT_TEACHER_ASSIGNMENTS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<
        number,
        { subgroup1TeacherId: number | null; subgroup2TeacherId: number | null }
      >;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });
  const [savedSubjectTeacherAssignments, setSavedSubjectTeacherAssignments] = useState<
    Record<number, { subgroup1TeacherId: number | null; subgroup2TeacherId: number | null }>
  >(() => {
    try {
      const raw = localStorage.getItem(SUBJECT_TEACHER_ASSIGNMENTS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<
        number,
        { subgroup1TeacherId: number | null; subgroup2TeacherId: number | null }
      >;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });
  const [subjectAssignmentsDirty, setSubjectAssignmentsDirty] = useState(false);
  const [subjectAssignmentsSaving, setSubjectAssignmentsSaving] = useState(false);
  const [subjectAssignmentsMessage, setSubjectAssignmentsMessage] = useState<string | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupModalName, setGroupModalName] = useState("");
  const [isGroupEditModalOpen, setIsGroupEditModalOpen] = useState(false);
  const [groupEditModalName, setGroupEditModalName] = useState("");
  const getInitialSpecialtiesData = (): SpecialtyRow[] => {
    try {
      const raw = localStorage.getItem(SPECIALTIES_STORAGE_KEY);
      if (!raw) return INITIAL_SPECIALTIES_FROM_TABLE;
      const parsed = JSON.parse(raw) as SpecialtyRow[];
      if (
        !Array.isArray(parsed) ||
        parsed.length === 0 ||
        parsed.length < INITIAL_SPECIALTIES_FROM_TABLE.length
      ) {
        return INITIAL_SPECIALTIES_FROM_TABLE;
      }
      return parsed;
    } catch {
      return INITIAL_SPECIALTIES_FROM_TABLE;
    }
  };
  const [specialtiesData, setSpecialtiesData] = useState<SpecialtyRow[]>(() =>
    getInitialSpecialtiesData()
  );
  const [savedSpecialtiesData, setSavedSpecialtiesData] = useState<SpecialtyRow[]>(() =>
    getInitialSpecialtiesData()
  );
  const [selectedSpecialtyIndex, setSelectedSpecialtyIndex] = useState<number>(0);
  const [specialtiesDirty, setSpecialtiesDirty] = useState(false);
  const [specialtiesSaving, setSpecialtiesSaving] = useState(false);
  const [specialtiesMessage, setSpecialtiesMessage] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [newReportTitle, setNewReportTitle] = useState("шаблон док");
  const [slotDrafts, setSlotDrafts] = useState<
    Record<string, { subjectId: number | null; teacherId: number | null }>
  >({});
  const [replacementTeacherBySlot, setReplacementTeacherBySlot] = useState<
    Record<string, number | null>
  >(() => {
    try {
      const raw = localStorage.getItem(REPLACEMENT_ASSIGNMENTS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, number | null>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });
  const [teacherReplacementDefaults, setTeacherReplacementDefaults] = useState<
    Record<number, number | null>
  >(() => {
    try {
      const raw = localStorage.getItem(TEACHER_REPLACEMENT_DEFAULTS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<number, number | null>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });
  const [isReplacementStatsModalOpen, setIsReplacementStatsModalOpen] = useState(false);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, [token]);

  const inferredSubjectIdByTeacher = useMemo(() => {
    const map = new Map<number, number>();
    for (const subject of subjects) {
      const assignment = subjectTeacherAssignments[subject.id];
      if (!assignment) continue;
      if (assignment.subgroup1TeacherId && !map.has(assignment.subgroup1TeacherId)) {
        map.set(assignment.subgroup1TeacherId, subject.id);
      }
      if (assignment.subgroup2TeacherId && !map.has(assignment.subgroup2TeacherId)) {
        map.set(assignment.subgroup2TeacherId, subject.id);
      }
    }
    return map;
  }, [subjectTeacherAssignments, subjects]);

  const subjectsById = useMemo(() => {
    const map = new Map<number, string>();
    for (const subject of subjects) {
      map.set(subject.id, subject.name);
    }
    return map;
  }, [subjects]);

  const pairTimes = ["08:00:00", "09:50:00", "11:40:00", "13:30:00", "15:20:00", "17:10:00", "19:00:00"];
  const slotKey = (date: string, groupId: number, pairIdx: number) =>
    `${date}|${groupId}|${pairIdx}`;

  useEffect(() => {
    const selectedFromList = teachersList.find((t) => t.id === selectedTeacherId) ?? null;
    const inferredSubjectId =
      selectedTeacherId !== null ? inferredSubjectIdByTeacher.get(selectedTeacherId) ?? null : null;
    setTeacherCardSubjectId(selectedFromList?.subjectId ?? inferredSubjectId ?? null);
    setTeacherCardRoomNumber(selectedFromList?.roomNumber ?? "");
  }, [selectedTeacherId, teachersList, inferredSubjectIdByTeacher]);

  useEffect(() => {
    if (specialtiesData.length === 0) {
      setSelectedSpecialtyIndex(0);
      return;
    }
    if (selectedSpecialtyIndex < 0 || selectedSpecialtyIndex >= specialtiesData.length) {
      setSelectedSpecialtyIndex(0);
    }
  }, [specialtiesData, selectedSpecialtyIndex]);

  useEffect(() => {
    if (groups.length === 0) {
      setScheduleSelectedGroupId(null);
      return;
    }
    if (
      scheduleSelectedGroupId === null ||
      !groups.some((group) => group.id === scheduleSelectedGroupId)
    ) {
      setScheduleSelectedGroupId(groups[0].id);
    }
  }, [groups, scheduleSelectedGroupId]);

  useEffect(() => {
    localStorage.setItem(REPLACEMENT_ASSIGNMENTS_KEY, JSON.stringify(replacementTeacherBySlot));
  }, [replacementTeacherBySlot]);

  useEffect(() => {
    localStorage.setItem(
      TEACHER_REPLACEMENT_DEFAULTS_KEY,
      JSON.stringify(teacherReplacementDefaults)
    );
  }, [teacherReplacementDefaults]);

  useEffect(() => {
    const statsSnapshot: Record<
      number,
      { replacementHours: number; groups: string[]; subjects: string[] }
    > = {};
    for (const item of schedule) {
      const pairIdx = pairTimes.findIndex((time) => time === item.time.slice(0, 8));
      if (pairIdx < 0) continue;
      const currentSlotKey = slotKey(item.date.slice(0, 10), item.group_id, pairIdx);
      const replacementTeacherId = Object.prototype.hasOwnProperty.call(
        replacementTeacherBySlot,
        currentSlotKey
      )
        ? replacementTeacherBySlot[currentSlotKey] ?? null
        : null;
      if (!replacementTeacherId) continue;
      if (!statsSnapshot[replacementTeacherId]) {
        statsSnapshot[replacementTeacherId] = {
          replacementHours: 0,
          groups: [],
          subjects: []
        };
      }
      statsSnapshot[replacementTeacherId].replacementHours += 2;
      if (!statsSnapshot[replacementTeacherId].groups.includes(item.group_name)) {
        statsSnapshot[replacementTeacherId].groups.push(item.group_name);
      }
      if (!statsSnapshot[replacementTeacherId].subjects.includes(item.subject_name)) {
        statsSnapshot[replacementTeacherId].subjects.push(item.subject_name);
      }
    }
    localStorage.setItem(REPLACEMENT_STATS_SNAPSHOT_KEY, JSON.stringify(statsSnapshot));
  }, [schedule, replacementTeacherBySlot]);

  const formatDate = (d: Date) => d.toISOString().slice(0, 10);
  const formatDateRu = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}.${mm}.${yy}`;
  };

  const sortedTeachersList = useMemo(
    () =>
      [...teachersList].sort((a, b) =>
        a.name.localeCompare(b.name, "ru", { sensitivity: "base" })
      ),
    [teachersList]
  );

  const filteredTeachersList = useMemo(() => {
    const query = teacherSearch.trim().toLowerCase();
    if (!query) return sortedTeachersList;
    return sortedTeachersList.filter((t) => t.name.toLowerCase().includes(query));
  }, [sortedTeachersList, teacherSearch]);

  const teachersById = useMemo(() => {
    const map = new Map<number, Teacher>();
    for (const item of sortedTeachersList) {
      map.set(item.id, item);
    }
    return map;
  }, [sortedTeachersList]);

  const scheduleIndex = useMemo(() => {
    const map = new Map<string, ScheduleItem>();
    for (const item of schedule) {
      const key = `${item.group_id}|${item.date.slice(0, 10)}|${item.time.slice(0, 8)}`;
      map.set(key, item);
    }
    return map;
  }, [schedule]);

  const loadTeachers = async (tokenOverride?: string) => {
    if (!token && !tokenOverride) return;
    try {
      setTeachersLoading(true);
      setTeachersError(null);
      const res = await axios.get<Teacher[]>("/api/teachers");
      setTeachersList(res.data);
      if (!selectedTeacherId && res.data.length > 0) {
        setSelectedTeacherId(res.data[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setTeachersError("Не удалось загрузить список преподавателей");
    } finally {
      setTeachersLoading(false);
    }
  };

  const loadSubjects = async (tokenOverride?: string) => {
    if (!token && !tokenOverride) return;
    try {
      setSubjectsLoading(true);
      setSubjectsError(null);
      const res = await axios.get<Subject[]>("/api/subjects");
      setSubjects(res.data);
      if (res.data.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(res.data[0].id);
        setSelectedSubjectIds((prev) => (prev.length > 0 ? prev : [res.data[0].id]));
      }
    } catch (err: any) {
      console.error(err);
      setSubjectsError("Не удалось загрузить список предметов");
    } finally {
      setSubjectsLoading(false);
    }
  };

  const loadSchedule = async (baseDate?: Date, tokenOverride?: string) => {
    if (!token && !tokenOverride) return;
    const start = baseDate ?? weekStart;
    const from = formatDate(start);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const to = formatDate(end);

    try {
      setScheduleLoading(true);
      setScheduleError(null);
      const res = await axios.get<ScheduleItem[]>("/api/schedule", {
        params: { from, to }
      });
      setSchedule(res.data);
    } catch (err: any) {
      console.error(err);
      setScheduleError("Не удалось загрузить расписание");
    } finally {
      setScheduleLoading(false);
    }
  };

  const loadReports = async (tokenOverride?: string) => {
    if (!token && !tokenOverride) return;
    try {
      setReportsLoading(true);
      setReportsError(null);
      const res = await axios.get<ReportItem[]>("/api/reports");
      setReports(res.data);
    } catch (err: any) {
      console.error(err);
      setReportsError("Не удалось загрузить отчёты");
    } finally {
      setReportsLoading(false);
    }
  };

  const loadProfile = async (tokenOverride?: string) => {
    if (!token && !tokenOverride) return;
    try {
      setProfileLoading(true);
      const [profileRes, groupsRes] = await Promise.all([
        axios.get("/api/profile/me"),
        axios.get<Group[]>("/api/groups")
      ]);

      const p = profileRes.data as Teacher;
      setTeacher((prev) => ({ ...(prev ?? p), ...p }));
      setProfileName(p.name);
      setProfileSubjectId(p.subjectId ?? null);
      setProfileAccessLevel(p.accessLevel);
      setProfileWorkload((p.workloadHours ?? 0).toString());
      const normalizeName = (value: string) => value.trim().toLowerCase();
      const allowedGroupNames = new Set(specialtiesData.map((item) => normalizeName(item.title)));
      for (const existingGroup of groupsRes.data) {
        if (!allowedGroupNames.has(normalizeName(existingGroup.name))) {
          await axios.delete(`/api/groups/${existingGroup.id}`);
        }
      }
      const refreshedGroupsRes = await axios.get<Group[]>("/api/groups");
      const existingRefreshedNames = new Set(
        refreshedGroupsRes.data.map((group) => normalizeName(group.name))
      );
      for (const specialty of specialtiesData) {
        if (!existingRefreshedNames.has(normalizeName(specialty.title))) {
          await axios.post("/api/groups", { name: specialty.title });
        }
      }
      const finalGroupsRes = await axios.get<Group[]>("/api/groups");
      setGroups(finalGroupsRes.data);
      if (!selectedGroupId && finalGroupsRes.data.length > 0) {
        setSelectedGroupId(finalGroupsRes.data[0].id);
      }
      await Promise.all([
        loadTeachers(tokenOverride),
        loadSubjects(tokenOverride),
        loadSchedule(undefined, tokenOverride),
        loadReports(tokenOverride)
      ]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        const res = await axios.post("/api/auth/login", { email, password });
        const receivedToken: string = res.data.token;
        axios.defaults.headers.common.Authorization = `Bearer ${receivedToken}`;
        setToken(receivedToken);
        setTeacher(res.data.teacher);
        await loadProfile(receivedToken);
      } else {
        const res = await axios.post("/api/auth/register", { email, password, name });
        const receivedToken: string = res.data.token;
        axios.defaults.headers.common.Authorization = `Bearer ${receivedToken}`;
        setToken(receivedToken);
        await loadProfile(receivedToken);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Ошибка авторизации";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    if (!token) return;
    try {
      setProfileLoading(true);
      setProfileMessage(null);
      const workload = profileWorkload.trim() === "" ? null : Number(profileWorkload.replace(",", "."));
      await axios.put("/api/profile/me", {
        name: profileName,
        subjectId: profileSubjectId,
        accessLevel: profileAccessLevel,
        workloadHours: workload
      });
      setProfileMessage("Профиль сохранён");
      setTeacher((prev) =>
        prev
          ? {
              ...prev,
              name: profileName,
              accessLevel: profileAccessLevel,
              workloadHours: workload ?? prev.workloadHours,
              subjectId: profileSubjectId ?? null
            }
          : prev
      );
      // Перечитаем расписание, чтобы отразить возможные изменения
      await loadSchedule();
    } catch (err: any) {
      console.error(err);
      setProfileMessage("Ошибка сохранения профиля");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage(null);
    try {
      await axios.post("/api/auth/forgot-password", { email });
      setForgotMessage("Если такой email зарегистрирован, на него отправлено письмо со ссылкой для сброса пароля.");
    } catch (err: any) {
      console.error(err);
      setForgotMessage("Ошибка запроса на сброс пароля");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    if (resetPasswordValue !== resetPasswordConfirm) {
      setResetMessage("Пароли не совпадают");
      return;
    }
    try {
      setResetLoading(true);
      await axios.post("/api/auth/reset-password", {
        token: resetToken,
        newPassword: resetPasswordValue
      });
      setResetMessage("Пароль успешно изменён, теперь вы можете войти с новым паролем.");
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Ошибка смены пароля";
      setResetMessage(msg);
    } finally {
      setResetLoading(false);
    }
  };

  const upsertScheduleSlot = async (
    date: string,
    groupId: number,
    pairIdx: number,
    subjectId: number | null,
    teacherId: number | null,
    existingItem?: ScheduleItem
  ) => {
    if (!subjectId || !teacherId) return;

    const payload = {
      date,
      time: pairTimes[pairIdx],
      durationHours: 2,
      groupId,
      subjectId,
      teacherId,
      room: null as string | null
    };

    if (existingItem) {
      await axios.put(`/api/schedule/${existingItem.id}`, payload);
    } else {
      await axios.post("/api/schedule", payload);
    }
    await Promise.all([loadSchedule(), loadTeachers()]);
  };

  const handleCreateGroup = async () => {
    const groupName = groupModalName.trim();
    if (!groupName) {
      alert("Введите название группы");
      return;
    }
    try {
      const res = await axios.post<Group>("/api/groups", {
        name: groupName
      });
      setGroupModalName("");
      setIsGroupModalOpen(false);
      const groupsRes = await axios.get<Group[]>("/api/groups");
      setGroups(groupsRes.data);
      setSelectedGroupId(res.data.id);
    } catch (err: any) {
      console.error(err);
      alert(
        err.response?.data?.details ||
          err.response?.data?.message ||
          "Не удалось создать группу"
      );
    }
  };

  const handleCreateTeacher = async () => {
    const last = teacherLastName.trim();
    const first = teacherFirstName.trim();
    const middle = teacherMiddleName.trim();
    if (!last || !first) {
      alert("Заполните как минимум Фамилию и Имя");
      return;
    }
    const fullName = [last, first, middle].filter(Boolean).join(" ");
    try {
      if (editingTeacherId) {
        await axios.put(`/api/teachers/${editingTeacherId}`, {
          name: fullName,
          subjectId: teacherModalSubjectId,
          roomNumber: teacherModalRoomNumber.trim() || null
        });
      } else {
        await axios.post("/api/teachers", {
          name: fullName,
          subjectId: teacherModalSubjectId,
          roomNumber: teacherModalRoomNumber.trim() || null
        });
      }
      setTeacherLastName("");
      setTeacherFirstName("");
      setTeacherMiddleName("");
      setTeacherModalSubjectId(null);
      setTeacherModalRoomNumber("");
      setEditingTeacherId(null);
      setIsTeacherModalOpen(false);
      await loadTeachers();
    } catch (err: any) {
      console.error(err);
      alert(
        err.response?.data?.details ||
          err.response?.data?.message ||
          (editingTeacherId ? "Не удалось обновить преподавателя" : "Не удалось создать преподавателя")
      );
    }
  };

  const handleTeacherCardUpdate = async (payload: {
    subjectId?: number | null;
    roomNumber?: string | null;
  }) => {
    if (!selectedTeacherId) return;
    try {
      await axios.put(`/api/teachers/${selectedTeacherId}`, payload);
      await loadTeachers();
    } catch (err: any) {
      console.error(err);
      alert(
        err.response?.data?.details ||
          err.response?.data?.message ||
          "Не удалось обновить карточку преподавателя"
      );
    }
  };

  const handleSaveGroupRename = async () => {
    if (selectedGroupIds.length !== 1) return;
    const targetId = selectedGroupIds[0];
    const target = groups.find((g) => g.id === targetId);
    if (!target) return;
    const newName = groupEditModalName.trim();
    if (!newName) {
      alert("Введите название группы");
      return;
    }
    try {
      await axios.put(`/api/groups/${target.id}`, {
        name: newName
      });
      const res = await axios.get<Group[]>("/api/groups");
      setGroups(res.data);
      const updated = res.data.find((g) => g.id === target.id) ?? null;
      if (updated) {
        setSelectedGroupId(updated.id);
      }
      setIsGroupEditModalOpen(false);
      setGroupEditModalName("");
    } catch (err: any) {
      console.error(err);
      alert(
        err.response?.data?.details ||
          err.response?.data?.message ||
          "Не удалось обновить группу"
      );
    }
  };

  const handleGroupCardSelect = (
    e: React.MouseEvent<HTMLDivElement>,
    group: Group,
    groupIndex: number,
    orderedGroups: Group[]
  ) => {
    const withCtrl = e.ctrlKey || e.metaKey;
    const withShift = e.shiftKey;
    setSelectedGroupId(group.id);
    setSelectedGroupIds((prev) => {
      if (withShift && lastSelectedGroupIndex !== null) {
        const start = Math.min(lastSelectedGroupIndex, groupIndex);
        const end = Math.max(lastSelectedGroupIndex, groupIndex);
        const rangeIds = orderedGroups.slice(start, end + 1).map((g) => g.id);
        if (withCtrl) {
          return Array.from(new Set([...prev, ...rangeIds]));
        }
        return rangeIds;
      }
      if (withCtrl) {
        return prev.includes(group.id)
          ? prev.filter((id) => id !== group.id)
          : [...prev, group.id];
      }
      return [group.id];
    });
    setLastSelectedGroupIndex(groupIndex);
  };

  const handleSubjectCardSelect = (
    e: React.MouseEvent<HTMLDivElement>,
    subjectId: number,
    subjectIndex: number
  ) => {
    const withCtrl = e.ctrlKey || e.metaKey;
    const withShift = e.shiftKey;
    setSelectedSubjectId(subjectId);
    setSelectedSubjectIds((prev) => {
      if (withShift && lastSelectedSubjectIndex !== null) {
        const start = Math.min(lastSelectedSubjectIndex, subjectIndex);
        const end = Math.max(lastSelectedSubjectIndex, subjectIndex);
        const rangeIds = subjects.slice(start, end + 1).map((s) => s.id);
        if (withCtrl) {
          return Array.from(new Set([...prev, ...rangeIds]));
        }
        return rangeIds;
      }

      if (withCtrl) {
        return prev.includes(subjectId)
          ? prev.filter((id) => id !== subjectId)
          : [...prev, subjectId];
      }

      return [subjectId];
    });
    setLastSelectedSubjectIndex(subjectIndex);
  };

  if (isResetPasswordPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-4">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">Сброс пароля</h1>
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Новый пароль</label>
              <input
                type="password"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={resetPasswordValue}
                onChange={(e) => setResetPasswordValue(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Подтверждение пароля</label>
              <input
                type="password"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={resetPasswordConfirm}
                onChange={(e) => setResetPasswordConfirm(e.target.value)}
              />
            </div>
            {resetMessage && <div className="text-sm text-slate-600">{resetMessage}</div>}
            <button
              type="submit"
              disabled={resetLoading}
              className="w-full mt-2 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {resetLoading ? "Подождите..." : "Изменить пароль"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (token && teacher) {
    const groupsList = groups;
    const selectedSpecialty = specialtiesData[selectedSpecialtyIndex] ?? specialtiesData[0] ?? null;
    const updateSelectedSpecialtyField = (
      field: keyof Pick<SpecialtyRow, "code" | "title" | "course1" | "course2" | "course3" | "course4" | "course5">,
      value: string
    ) => {
      const normalizedValue = value;
      setSpecialtiesData((prev) =>
        prev.map((item, idx) =>
          idx === selectedSpecialtyIndex ? { ...item, [field]: normalizedValue } : item
        )
      );
      setSpecialtiesDirty(true);
      setSpecialtiesMessage(null);
    };
    const handleSaveSpecialties = async () => {
      try {
        setSpecialtiesSaving(true);
        setSpecialtiesMessage(null);
        localStorage.setItem(SPECIALTIES_STORAGE_KEY, JSON.stringify(specialtiesData));
        await loadProfile();
        setSavedSpecialtiesData(specialtiesData);
        setSpecialtiesDirty(false);
        setSpecialtiesMessage("Изменения сохранены");
      } catch (error) {
        console.error(error);
        setSpecialtiesMessage("Не удалось сохранить изменения");
      } finally {
        setSpecialtiesSaving(false);
      }
    };
    const handleCancelSpecialtiesEdit = () => {
      setSpecialtiesData(savedSpecialtiesData);
      setSpecialtiesDirty(false);
      setSpecialtiesMessage("Изменения отменены");
    };

    const selectedTeacher =
      sortedTeachersList.find((t) => t.id === selectedTeacherId) ?? sortedTeachersList[0] ?? teacher;
    const selectedGroup =
      groupsList.find((g) => g.id === selectedGroupId) ?? groupsList[0] ?? null;
    const selectedScheduleGroup =
      groupsList.find((g) => g.id === scheduleSelectedGroupId) ?? groupsList[0] ?? null;
    const scheduleGroupsToRender = selectedScheduleGroup ? [selectedScheduleGroup] : [];
    const selectedSubjectCard =
      subjects.find((s) => s.id === selectedSubjectId) ?? subjects[0] ?? null;
    const selectedSubjectAssignment = selectedSubjectCard
      ? subjectTeacherAssignments[selectedSubjectCard.id] ?? {
          subgroup1TeacherId: null,
          subgroup2TeacherId: null
        }
      : { subgroup1TeacherId: null, subgroup2TeacherId: null };
    const getReplacementTeacherIdForSlot = (slot: string) => {
      if (Object.prototype.hasOwnProperty.call(replacementTeacherBySlot, slot)) {
        return replacementTeacherBySlot[slot] ?? null;
      }
      return null;
    };
    const replacementStatsEntries = schedule
      .map((item) => {
        const pairIdx = pairTimes.findIndex((time) => time === item.time.slice(0, 8));
        if (pairIdx < 0) return null;
        const dateStr = item.date.slice(0, 10);
        const currentSlotKey = slotKey(dateStr, item.group_id, pairIdx);
        const replacementTeacherId = getReplacementTeacherIdForSlot(currentSlotKey);
        if (!replacementTeacherId || replacementTeacherId !== selectedTeacher.id) return null;
        return {
          slotKey: currentSlotKey,
          date: dateStr,
          pairNumber: pairIdx + 1,
          groupName: item.group_name,
          subjectName: item.subject_name,
          baseTeacherName: item.teacher_name,
          hours: 2
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    const replacementHoursTotal = replacementStatsEntries.reduce(
      (sum, item) => sum + item.hours,
      0
    );
    const replacementHoursDeductedFromSelectedTeacher = schedule.reduce((sum, item) => {
      if (item.teacher_id !== selectedTeacher.id) return sum;
      const pairIdx = pairTimes.findIndex((time) => time === item.time.slice(0, 8));
      if (pairIdx < 0) return sum;
      const dateStr = item.date.slice(0, 10);
      const currentSlotKey = slotKey(dateStr, item.group_id, pairIdx);
      const replacementTeacherId = getReplacementTeacherIdForSlot(currentSlotKey);
      if (!replacementTeacherId || replacementTeacherId === item.teacher_id) return sum;
      return sum + 2;
    }, 0);
    const adjustedTeacherWorkloadHours = Math.max(
      0,
      Number(selectedTeacher.workloadHours ?? 0) - replacementHoursDeductedFromSelectedTeacher
    );
    const replacementGroups = Array.from(
      new Set(replacementStatsEntries.map((item) => item.groupName))
    );
    const replacementSubjects = Array.from(
      new Set(replacementStatsEntries.map((item) => item.subjectName))
    );
    const replacementStatsSummaryRows = Array.from(
      replacementStatsEntries.reduce((acc, entry) => {
        const summaryKey = `${entry.date}|${entry.groupName}|${entry.subjectName}|${entry.baseTeacherName}`;
        const current = acc.get(summaryKey);
        if (current) {
          current.pairCount += 1;
          current.hours += 2;
          return acc;
        }
        acc.set(summaryKey, {
          summaryKey,
          date: entry.date,
          groupName: entry.groupName,
          subjectName: entry.subjectName,
          baseTeacherName: entry.baseTeacherName,
          pairCount: 1,
          hours: 2
        });
        return acc;
      }, new Map<
        string,
        {
          summaryKey: string;
          date: string;
          groupName: string;
          subjectName: string;
          baseTeacherName: string;
          pairCount: number;
          hours: number;
        }
      >()).values()
    );
    const handleExportReplacementStatsCsv = () => {
      if (replacementStatsSummaryRows.length === 0) {
        alert("Нет данных для экспорта.");
        return;
      }
      const escapeCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
      const toRow = (values: Array<string | number>) => values.map(escapeCell).join(";");
      const header = toRow([
        "Дата",
        "Количество пар",
        "Группа",
        "Предмет",
        "Кого замещает",
        "Часы замещения"
      ]);
      const rows = replacementStatsSummaryRows.map((entry) =>
        toRow([
          entry.date,
          entry.pairCount,
          entry.groupName,
          entry.subjectName,
          entry.baseTeacherName,
          entry.hours
        ])
      );
      const summaryRows = [
        "",
        toRow(["Преподаватель", selectedTeacher.name]),
        toRow(["Сумма часов замещения", replacementHoursTotal.toFixed(1)]),
        toRow(["Группы", replacementGroups.join(", ")]),
        toRow(["Предметы", replacementSubjects.join(", ")])
      ];
      const csvContent = [header, ...rows, ...summaryRows].join("\n");
      const fileNameSafeTeacher = selectedTeacher.name.replace(/[^\w\u0400-\u04FF.-]+/g, "_");
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `replacement-stats-${fileNameSafeTeacher}-${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };
    const handleExportReplacementStatsXlsx = async () => {
      if (replacementStatsSummaryRows.length === 0) {
        alert("Нет данных для экспорта.");
        return;
      }
      const XLSX = await import("xlsx");
      const detailsSheetData = replacementStatsSummaryRows.map((entry) => ({
        "Дата": entry.date,
        "Количество пар": entry.pairCount,
        "Группа": entry.groupName,
        "Предмет": entry.subjectName,
        "Кого замещает": entry.baseTeacherName,
        "Часы замещения": entry.hours
      }));
      const summarySheetData = [
        { "Показатель": "Преподаватель", "Значение": selectedTeacher.name },
        { "Показатель": "Сумма часов замещения", "Значение": replacementHoursTotal.toFixed(1) },
        { "Показатель": "Группы", "Значение": replacementGroups.join(", ") || "Нет данных" },
        { "Показатель": "Предметы", "Значение": replacementSubjects.join(", ") || "Нет данных" }
      ];
      const workbook = XLSX.utils.book_new();
      const detailsWorksheet = XLSX.utils.json_to_sheet(detailsSheetData);
      const summaryWorksheet = XLSX.utils.json_to_sheet(summarySheetData);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Сводка");
      XLSX.utils.book_append_sheet(workbook, detailsWorksheet, "Детализация");

      const fileNameSafeTeacher = selectedTeacher.name.replace(/[^\w\u0400-\u04FF.-]+/g, "_");
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      XLSX.writeFile(workbook, `replacement-stats-${fileNameSafeTeacher}-${timestamp}.xlsx`);
    };
    const handleSubjectTeacherAssign = (
      subjectId: number,
      subgroupKey: "subgroup1TeacherId" | "subgroup2TeacherId",
      teacherId: number | null
    ) => {
      setSubjectAssignmentsMessage(null);
      setSubjectAssignmentsDirty(true);
      setSubjectTeacherAssignments((prev) => ({
        ...prev,
        [subjectId]: {
          subgroup1TeacherId: prev[subjectId]?.subgroup1TeacherId ?? null,
          subgroup2TeacherId: prev[subjectId]?.subgroup2TeacherId ?? null,
          [subgroupKey]: teacherId
        }
      }));
    };
    const handleSaveSubjectAssignments = () => {
      try {
        setSubjectAssignmentsSaving(true);
        setSubjectAssignmentsMessage(null);
        localStorage.setItem(
          SUBJECT_TEACHER_ASSIGNMENTS_KEY,
          JSON.stringify(subjectTeacherAssignments)
        );
        setSavedSubjectTeacherAssignments(subjectTeacherAssignments);
        setSubjectAssignmentsDirty(false);
        setSubjectAssignmentsMessage("Изменения сохранены");
      } catch (error) {
        console.error(error);
        setSubjectAssignmentsMessage("Не удалось сохранить изменения");
      } finally {
        setSubjectAssignmentsSaving(false);
      }
    };
    const handleCancelSubjectAssignments = () => {
      setSubjectTeacherAssignments(savedSubjectTeacherAssignments);
      setSubjectAssignmentsDirty(false);
      setSubjectAssignmentsMessage("Изменения отменены");
    };

    const gridTemplateColumns = "150px repeat(7, 220px)";

    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-900/40 bg-cover bg-center bg-no-repeat p-4"
        style={{ backgroundImage: 'url("/lk_bg.jpg")' }}
      >
        <div className="w-full max-w-6xl bg-white/95 backdrop-blur-sm shadow-lg rounded-xl p-6 flex flex-col gap-4">
          <header className="flex justify-between items-center border-b pb-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">Расписание занятий</h1>
              <p className="text-sm text-slate-500">
                Преподаватель: {teacher.name} ({teacher.email})
              </p>
              {teacher.subjectName && (
                <p className="text-xs text-slate-400 mt-1">Основной предмет: {teacher.subjectName}</p>
              )}
            </div>
            <button
              className="px-3 py-1.5 text-sm rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
              onClick={() => {
                setToken(null);
                setTeacher(null);
              }}
            >
              Выйти
            </button>
          </header>

          <main className="flex gap-4">
            <aside className="w-72 border-r pr-4">
              <div className="space-y-2">
                <button
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${
                    sidebarSection === "teachers"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                  onClick={() => setSidebarSection("teachers")}
                >
                  <span className="font-medium">Преподаватели</span>
                  <span className="text-[11px] opacity-80">
                    {sortedTeachersList.length > 0 ? `${sortedTeachersList.length} всего` : "список"}
                  </span>
                </button>
                <button
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${
                    sidebarSection === "reports"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                  onClick={() => setSidebarSection("reports")}
                >
                  <span className="font-medium">Отчёты и справки</span>
                </button>
                <button
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${
                    sidebarSection === "groups"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                  onClick={() => setSidebarSection("groups")}
                >
                  <span className="font-medium">Группы</span>
                  <span className="text-[11px] opacity-80">
                    {specialtiesData.length > 0
                      ? `${specialtiesData.length} групп`
                      : "нет групп"}
                  </span>
                </button>
                <button
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${
                    sidebarSection === "subjects"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                  onClick={() => setSidebarSection("subjects")}
                >
                  <span className="font-medium">Предметы</span>
                  <span className="text-[11px] opacity-80">
                    {subjects.length > 0 ? `${subjects.length} всего` : "нет предметов"}
                  </span>
                </button>
              </div>

              <div className="mt-4">
                {sidebarSection === "teachers" && (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase text-slate-400">Список преподавателей</span>
                      {teachersLoading && (
                        <span className="text-[11px] text-slate-400">загрузка...</span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Поиск по ФИО"
                      className="w-full border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                    />
                    {teachersError && (
                      <div className="text-xs text-red-600">{teachersError}</div>
                    )}
                    <div className="space-y-1 max-h-52 overflow-auto pr-1">
                      {filteredTeachersList.map((t) => (
                        <div
                          key={t.id}
                          className={`flex items-center justify-between rounded-md px-2 py-1 cursor-pointer border ${
                            selectedTeacherId === t.id
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
                          }`}
                          onClick={() => setSelectedTeacherId(t.id)}
                        >
                          <div className="flex-1">
                            <div className="text-xs font-medium truncate">{t.name}</div>
                            <div className="text-[10px] opacity-80 truncate">
                              {(() => {
                                const inferredSubjectName = t.id
                                  ? subjectsById.get(inferredSubjectIdByTeacher.get(t.id) ?? -1)
                                  : undefined;
                                const displaySubjectName = t.subjectName ?? inferredSubjectName;
                                return displaySubjectName
                                  ? `Предмет: ${displaySubjectName}`
                                  : "Предмет: не указан";
                              })()}
                            </div>
                            <div className="text-[10px] opacity-80 truncate">
                              {t.roomNumber ? `Кабинет: ${t.roomNumber}` : "Кабинет не указан"}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="ml-2 text-[10px] text-red-500 hover:text-red-600"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await axios.delete(`/api/teachers/${t.id}`);
                                await loadTeachers();
                              } catch (err) {
                                console.error(err);
                                alert(
                                  (err as any)?.response?.data?.details ||
                                    (err as any)?.response?.data?.message ||
                                    "Не удалось удалить преподавателя"
                                );
                              }
                            }}
                          >
                            Удалить
                          </button>
                        </div>
                      ))}
                      {filteredTeachersList.length === 0 && !teachersLoading && (
                        <div className="text-xs text-slate-400">
                          {teacherSearch.trim()
                            ? "Ничего не найдено по этому запросу."
                            : "Пока нет преподавателей. Добавьте первого для тестов."}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <button
                        type="button"
                        className="w-full py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                        onClick={() => {
                          setEditingTeacherId(null);
                          setTeacherLastName("");
                          setTeacherFirstName("");
                          setTeacherMiddleName("");
                          setTeacherModalSubjectId(null);
                          setTeacherModalRoomNumber("");
                          setIsTeacherModalOpen(true);
                        }}
                      >
                        Добавить преподавателя
                      </button>
                      <button
                        type="button"
                        className="w-full py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
                        disabled={!selectedTeacherId}
                        onClick={() => {
                          const target = sortedTeachersList.find((t) => t.id === selectedTeacherId);
                          if (!target) return;
                          const parts = target.name.trim().split(/\s+/);
                          setTeacherLastName(parts[0] ?? "");
                          setTeacherFirstName(parts[1] ?? "");
                          setTeacherMiddleName(parts.slice(2).join(" "));
                          setTeacherModalSubjectId(target.subjectId ?? null);
                          setTeacherModalRoomNumber(target.roomNumber ?? "");
                          setEditingTeacherId(target.id);
                          setIsTeacherModalOpen(true);
                        }}
                      >
                        Редактировать преподавателя
                      </button>
                    </div>
                  </div>
                )}

                {sidebarSection === "groups" && (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase text-slate-400">Группы по специальностям</span>
                    </div>
                    <div className="space-y-1 max-h-[52vh] overflow-auto pr-1">
                      {specialtiesData.map((row, rowIdx) => {
                        const isSelected = selectedSpecialtyIndex === rowIdx;
                        return (
                          <button
                            key={`${row.code}-${row.title}-${rowIdx}`}
                            type="button"
                            className={`w-full text-left rounded-md border px-2 py-2 ${
                              isSelected
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
                            }`}
                            onClick={() => setSelectedSpecialtyIndex(rowIdx)}
                          >
                            <div className="text-[11px] opacity-80">Код: {row.code}</div>
                            <div className="text-xs font-medium leading-snug">{row.title}</div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="text-[11px] text-slate-500">
                        Карточек по таблице:{" "}
                        <span className="font-semibold">{specialtiesData.length}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="flex-1 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-60"
                          disabled={!specialtiesDirty || specialtiesSaving}
                          onClick={handleSaveSpecialties}
                        >
                          {specialtiesSaving ? "Сохранение..." : "Сохранить изменения"}
                        </button>
                        <button
                          type="button"
                          className="flex-1 py-1.5 rounded-md border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 disabled:opacity-60"
                          disabled={!specialtiesDirty || specialtiesSaving}
                          onClick={handleCancelSpecialtiesEdit}
                        >
                          Отменить
                        </button>
                      </div>
                      {specialtiesMessage && (
                        <div className="text-[11px] text-slate-500">{specialtiesMessage}</div>
                      )}
                    </div>
                  </div>
                )}

                {sidebarSection === "subjects" && (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase text-slate-400">Предметы</span>
                      {subjectsLoading && (
                        <span className="text-[11px] text-slate-400">загрузка...</span>
                      )}
                    </div>
                    {subjectsError && (
                      <div className="text-xs text-red-600">{subjectsError}</div>
                    )}
                    <div className="space-y-1 max-h-52 overflow-auto pr-1">
                      {subjects.length === 0 && !subjectsLoading && (
                        <div className="text-xs text-slate-400">
                          Список предметов пока пуст. Добавьте, например, Математику, Русский
                          язык и Историю.
                        </div>
                      )}
                      {subjects.map((s, subjectIdx) => (
                        <div
                          key={s.id}
                          className={`flex items-center justify-between rounded-md px-2 py-1 border cursor-pointer ${
                            selectedSubjectIds.includes(s.id) || selectedSubjectId === s.id
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
                          }`}
                          onClick={(e) => handleSubjectCardSelect(e, s.id, subjectIdx)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] opacity-80 truncate">Карточка предмета</div>
                            <div className="text-xs font-medium truncate">{s.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="text-[11px] text-slate-500">
                        Выбрано предметов:{" "}
                        <span className="font-semibold">{selectedSubjectIds.length}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="flex-1 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-60"
                          disabled={!subjectAssignmentsDirty || subjectAssignmentsSaving}
                          onClick={handleSaveSubjectAssignments}
                        >
                          {subjectAssignmentsSaving ? "Сохранение..." : "Сохранить изменения"}
                        </button>
                        <button
                          type="button"
                          className="flex-1 py-1.5 rounded-md border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 disabled:opacity-60"
                          disabled={!subjectAssignmentsDirty || subjectAssignmentsSaving}
                          onClick={handleCancelSubjectAssignments}
                        >
                          Отменить
                        </button>
                      </div>
                      {subjectAssignmentsMessage && (
                        <div className="text-[11px] text-slate-500">{subjectAssignmentsMessage}</div>
                      )}
                      <div className="text-xs uppercase text-slate-400">Добавить предмет</div>
                      <input
                        type="text"
                        placeholder="Название предмета"
                        className="w-full border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                      />
                      <button
                        type="button"
                        className="w-full py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-60"
                        onClick={async () => {
                          if (!newSubjectName.trim()) {
                            alert("Введите название предмета");
                            return;
                          }
                          try {
                            await axios.post("/api/subjects", {
                              name: newSubjectName.trim()
                            });
                            setNewSubjectName("");
                            await loadSubjects();
                          } catch (err: any) {
                            console.error(err);
                            alert(
                              err.response?.data?.details ||
                              err.response?.data?.message ||
                                "Не удалось создать предмет"
                            );
                          }
                        }}
                      >
                        Добавить предмет
                      </button>
                      <button
                        type="button"
                        className="w-full py-1.5 rounded-md border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
                        disabled={selectedSubjectIds.length !== 1}
                        onClick={async () => {
                          if (selectedSubjectIds.length !== 1) return;
                          const targetId = selectedSubjectIds[0];
                          const target = subjects.find((s) => s.id === targetId);
                          if (!target) return;
                          const newName = window.prompt("Новое название предмета", target.name);
                          if (!newName || !newName.trim()) return;
                          try {
                            await axios.put(`/api/subjects/${target.id}`, {
                              name: newName.trim()
                            });
                            await loadSubjects();
                          } catch (err: any) {
                            console.error(err);
                            alert(
                              err.response?.data?.details ||
                                err.response?.data?.message ||
                                "Не удалось обновить предмет"
                            );
                          }
                        }}
                      >
                        Редактировать выбранный предмет
                      </button>
                      <button
                        type="button"
                        className="w-full py-1.5 rounded-md border border-red-300 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-50"
                        disabled={selectedSubjectIds.length === 0}
                        onClick={async () => {
                          if (selectedSubjectIds.length === 0) return;
                          if (
                            !window.confirm(
                              `Удалить выбранные предметы (${selectedSubjectIds.length}) вместе с занятиями?`
                            )
                          ) {
                            return;
                          }
                          try {
                            for (const id of selectedSubjectIds) {
                              await axios.delete(`/api/subjects/${id}`);
                            }
                            setSubjectTeacherAssignments((prev) => {
                              const next = { ...prev };
                              for (const id of selectedSubjectIds) {
                                delete next[id];
                              }
                              return next;
                            });
                            setSavedSubjectTeacherAssignments((prev) => {
                              const next = { ...prev };
                              for (const id of selectedSubjectIds) {
                                delete next[id];
                              }
                              localStorage.setItem(
                                SUBJECT_TEACHER_ASSIGNMENTS_KEY,
                                JSON.stringify(next)
                              );
                              return next;
                            });
                            setSubjectAssignmentsDirty(false);
                            setSubjectAssignmentsMessage(null);
                            await loadSubjects();
                            await loadSchedule();
                            setSelectedSubjectIds([]);
                            setSelectedSubjectId(null);
                          } catch (err) {
                            console.error(err);
                            alert(
                              (err as any)?.response?.data?.details ||
                                (err as any)?.response?.data?.message ||
                                "Не удалось удалить выбранные предметы"
                            );
                          }
                        }}
                      >
                        Удалить выбранные предметы
                      </button>
                    </div>
                  </div>
                )}

                {sidebarSection === "reports" && (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase text-slate-400">Отчёты и справки</span>
                      {reportsLoading && (
                        <span className="text-[11px] text-slate-400">загрузка...</span>
                      )}
                    </div>
                    {reportsError && (
                      <div className="text-xs text-red-600">{reportsError}</div>
                    )}
                    <div className="space-y-1 max-h-52 overflow-auto">
                      {reports.length === 0 && !reportsLoading && (
                        <div className="text-xs text-slate-400">
                          Пока нет отчётов. Добавьте первый шаблон документа.
                        </div>
                      )}
                      {reports.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-xs bg-white"
                        >
                          <div>
                            <div className="font-medium text-slate-800 truncate">
                              {r.title}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(r.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="text-[10px] text-red-500 hover:text-red-600"
                            onClick={async () => {
                              if (
                                !window.confirm(`Удалить отчёт "${r.title}"?`)
                              ) {
                                return;
                              }
                              try {
                                await axios.delete(`/api/reports/${r.id}`);
                                await loadReports();
                              } catch (err) {
                                console.error(err);
                                alert(
                                  (err as any)?.response?.data?.details ||
                                    (err as any)?.response?.data?.message ||
                                    "Не удалось удалить отчёт"
                                );
                              }
                            }}
                          >
                            Удалить
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="text-xs uppercase text-slate-400">Добавить отчёт</div>
                      <input
                        type="text"
                        placeholder="Название отчёта"
                        className="w-full border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        value={newReportTitle}
                        onChange={(e) => setNewReportTitle(e.target.value)}
                      />
                      <button
                        type="button"
                        className="w-full py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-60"
                        disabled={!newReportTitle.trim()}
                        onClick={async () => {
                          try {
                            await axios.post("/api/reports", {
                              title: newReportTitle.trim()
                            });
                            setNewReportTitle("шаблон док");
                            await loadReports();
                          } catch (err: any) {
                            console.error(err);
                            alert(
                              err.response?.data?.details ||
                              err.response?.data?.message ||
                                "Не удалось создать отчёт"
                            );
                          }
                        }}
                      >
                        Добавить отчёт
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </aside>

            <section className="flex-1 min-w-0">
              {sidebarSection === "teachers" && selectedTeacher && (
                <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4 flex justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase text-slate-400 mb-1">
                      Карточка преподавателя
                    </div>
                    <div className="text-lg font-semibold text-slate-800">
                      {selectedTeacher.name}
                    </div>
                    <div className="text-sm text-slate-500">
                      Предмет:
                    </div>
                    <select
                      className="mt-1 w-full max-w-xs border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      value={teacherCardSubjectId ?? ""}
                      onChange={async (e) => {
                        const nextSubjectId = e.target.value === "" ? null : Number(e.target.value);
                        setTeacherCardSubjectId(nextSubjectId);
                        await handleTeacherCardUpdate({ subjectId: nextSubjectId });
                      }}
                    >
                      <option value="">не указан</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 text-sm text-slate-500">
                      Кабинет:
                    </div>
                    <input
                      type="text"
                      className="mt-1 w-full max-w-[170px] border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      value={teacherCardRoomNumber}
                      onChange={(e) => setTeacherCardRoomNumber(e.target.value)}
                      onBlur={async () =>
                        handleTeacherCardUpdate({
                          roomNumber: teacherCardRoomNumber.trim() || null
                        })
                      }
                      onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                          (e.currentTarget as HTMLInputElement).blur();
                        }
                      }}
                    />
                    <div className="mt-2 text-sm text-slate-500">Замена преподавателя:</div>
                    <select
                      className="mt-1 w-full max-w-xs border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      value={teacherReplacementDefaults[selectedTeacher.id] ?? ""}
                      onChange={(e) => {
                        const nextReplacementTeacherId =
                          e.target.value === "" ? null : Number(e.target.value);
                        setTeacherReplacementDefaults((prev) => {
                          const next = {
                            ...prev,
                            [selectedTeacher.id]: nextReplacementTeacherId
                          };
                          localStorage.setItem(
                            TEACHER_REPLACEMENT_DEFAULTS_KEY,
                            JSON.stringify(next)
                          );
                          return next;
                        });
                      }}
                    >
                      <option value="">не выбран</option>
                      {sortedTeachersList
                        .filter((t) => t.id !== selectedTeacher.id)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedTeacher.subjectName && (
                        <span className="inline-flex items-center rounded-full bg-slate-900 text-white px-2 py-0.5 text-[11px]">
                          {selectedTeacher.subjectName}
                        </span>
                      )}
                      {selectedTeacher.subjects &&
                        selectedTeacher.subjects.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center rounded-full bg-slate-200 text-slate-800 px-2 py-0.5 text-[11px]"
                          >
                            {s.name}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase text-slate-400">Общая нагрузка</div>
                    <div className="text-xl font-semibold text-indigo-600">
                      {adjustedTeacherWorkloadHours.toFixed(1)} ч
                    </div>
                    {replacementHoursDeductedFromSelectedTeacher > 0 && (
                      <div className="mt-1 text-[10px] text-slate-400">
                        Списано за замещения: -{replacementHoursDeductedFromSelectedTeacher.toFixed(1)} ч
                      </div>
                    )}
                    <div className="mt-3 text-xs uppercase text-slate-400">Учет часов замещения</div>
                    <div className="text-xl font-semibold text-emerald-600">
                      {replacementHoursTotal.toFixed(1)} ч
                    </div>
                    <button
                      type="button"
                      className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => setIsReplacementStatsModalOpen(true)}
                    >
                      Статистика
                    </button>
                    {selectedTeacherId === teacher.id && (
                      <div className="mt-1 text-[10px] text-slate-400">
                        Это вы. Нагрузка обновляется по расписанию.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {sidebarSection === "groups" && selectedSpecialty && (
                <>
                  <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex-1">
                      <div className="text-xs uppercase text-slate-400 mb-1">
                        Карточка специальности
                      </div>
                      <label className="block text-[11px] text-slate-500 mb-1">Код</label>
                      <input
                        type="text"
                        className="w-full max-w-xs border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 mb-2"
                        value={selectedSpecialty.code}
                        onChange={(e) => updateSelectedSpecialtyField("code", e.target.value)}
                      />
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Специальность, профессия
                      </label>
                      <input
                        type="text"
                        className="w-full max-w-md border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        value={selectedSpecialty.title}
                        onChange={(e) => updateSelectedSpecialtyField("title", e.target.value)}
                      />
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className="py-1.5 px-3 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-60"
                          disabled={!specialtiesDirty || specialtiesSaving}
                          onClick={handleSaveSpecialties}
                        >
                          {specialtiesSaving ? "Сохранение..." : "Сохранить изменения"}
                        </button>
                        <button
                          type="button"
                          className="py-1.5 px-3 rounded-md border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 disabled:opacity-60"
                          disabled={!specialtiesDirty || specialtiesSaving}
                          onClick={handleCancelSpecialtiesEdit}
                        >
                          Отменить
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="w-full max-w-full overflow-auto pb-2 max-h-[62vh] rounded-md border border-slate-200">
                    <table className="w-full min-w-[700px] text-[12px] border-collapse">
                      <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700">
                        <tr>
                          <th className="border border-slate-300 px-2 py-1 text-left">1 курс</th>
                          <th className="border border-slate-300 px-2 py-1 text-left">2 курс</th>
                          <th className="border border-slate-300 px-2 py-1 text-left">3 курс</th>
                          <th className="border border-slate-300 px-2 py-1 text-left">4 курс</th>
                          <th className="border border-slate-300 px-2 py-1 text-left">5 курс</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white text-slate-800">
                          <td className="border border-slate-300 px-2 py-1 align-top">
                            <input
                              type="text"
                              className="w-full border rounded px-1 py-0.5 text-[12px]"
                              value={selectedSpecialty.course1}
                              onChange={(e) =>
                                updateSelectedSpecialtyField("course1", e.target.value)
                              }
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-1 align-top">
                            <input
                              type="text"
                              className="w-full border rounded px-1 py-0.5 text-[12px]"
                              value={selectedSpecialty.course2}
                              onChange={(e) =>
                                updateSelectedSpecialtyField("course2", e.target.value)
                              }
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-1 align-top">
                            <input
                              type="text"
                              className="w-full border rounded px-1 py-0.5 text-[12px]"
                              value={selectedSpecialty.course3}
                              onChange={(e) =>
                                updateSelectedSpecialtyField("course3", e.target.value)
                              }
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-1 align-top">
                            <input
                              type="text"
                              className="w-full border rounded px-1 py-0.5 text-[12px]"
                              value={selectedSpecialty.course4}
                              onChange={(e) =>
                                updateSelectedSpecialtyField("course4", e.target.value)
                              }
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-1 align-top">
                            <input
                              type="text"
                              className="w-full border rounded px-1 py-0.5 text-[12px]"
                              value={selectedSpecialty.course5}
                              onChange={(e) =>
                                updateSelectedSpecialtyField("course5", e.target.value)
                              }
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {sidebarSection === "subjects" && selectedSubjectCard && (
                <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase text-slate-400 mb-1">Карточка предмета</div>
                  <label className="block text-[11px] text-slate-500 mb-1">Название предмета</label>
                  <input
                    type="text"
                    className="w-full max-w-md border rounded-md px-2 py-1 text-sm bg-white"
                    value={selectedSubjectCard.name}
                    disabled
                  />
                  <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
                    <div className="grid grid-cols-[130px_1fr] gap-2 text-xs font-medium text-slate-600 mb-2">
                      <div>Подгруппа</div>
                      <div>Преподаватель</div>
                    </div>
                    <div className="grid grid-cols-[130px_1fr] gap-2 items-center mb-2">
                      <div className="text-xs text-slate-700">Подгруппа 1</div>
                      <select
                        className="border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        value={selectedSubjectAssignment.subgroup1TeacherId ?? ""}
                        onChange={(e) =>
                          handleSubjectTeacherAssign(
                            selectedSubjectCard.id,
                            "subgroup1TeacherId",
                            e.target.value === "" ? null : Number(e.target.value)
                          )
                        }
                      >
                        <option value="">Не назначен</option>
                        {sortedTeachersList.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-[130px_1fr] gap-2 items-center">
                      <div className="text-xs text-slate-700">Подгруппа 2</div>
                      <select
                        className="border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        value={selectedSubjectAssignment.subgroup2TeacherId ?? ""}
                        onChange={(e) =>
                          handleSubjectTeacherAssign(
                            selectedSubjectCard.id,
                            "subgroup2TeacherId",
                            e.target.value === "" ? null : Number(e.target.value)
                          )
                        }
                      >
                        <option value="">Не назначен</option>
                        {sortedTeachersList.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
              {sidebarSection !== "groups" &&
                sidebarSection !== "subjects" &&
                sidebarSection !== "reports" && (
                <>
                  <div className="mb-3 flex justify-between items-center">
                    <div className="space-x-2 text-sm">
                      <button
                        className="px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                        onClick={async () => {
                          const prevWeek = new Date(weekStart);
                          prevWeek.setDate(weekStart.getDate() - 7);
                          setWeekStart(prevWeek);
                          await loadSchedule(prevWeek);
                        }}
                      >
                        &lt; Неделя
                      </button>
                      <button
                        className="px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                        onClick={async () => {
                          const now = new Date();
                          const day = now.getDay() || 7;
                          const monday = new Date(now);
                          monday.setDate(now.getDate() - (day - 1));
                          monday.setHours(0, 0, 0, 0);
                          setWeekStart(monday);
                          await loadSchedule(monday);
                        }}
                      >
                        Текущая неделя
                      </button>
                      <button
                        className="px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                        onClick={async () => {
                          const nextWeek = new Date(weekStart);
                          nextWeek.setDate(weekStart.getDate() + 7);
                          setWeekStart(nextWeek);
                          await loadSchedule(nextWeek);
                        }}
                      >
                        Неделя &gt;
                      </button>
                    </div>
                    <div className="text-sm text-slate-500">
                      Календарь: неделя с{" "}
                      {formatDateRu(weekStart)} по{" "}
                      {formatDateRu(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000))}
                    </div>
                  </div>
                  <div className="mb-3 text-xs text-slate-500">
                    Выбрана группа:{" "}
                    <span className="font-semibold">
                      {selectedScheduleGroup ? selectedScheduleGroup.name : "не выбрана"}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-52 shrink-0 rounded-md border border-slate-200 bg-slate-50 p-2">
                      <div className="text-xs font-semibold text-slate-600 mb-2">Выбрать группу</div>
                      <div className="space-y-1 max-h-[62vh] overflow-auto pr-1">
                        {groupsList.map((group) => (
                          <button
                            key={group.id}
                            type="button"
                            className={`w-full text-left rounded border px-2 py-1.5 text-xs ${
                              selectedScheduleGroup?.id === group.id
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                            onClick={() => setScheduleSelectedGroupId(group.id)}
                          >
                            {group.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                    <div className="w-full max-w-full overflow-auto pb-2 max-h-[68vh] rounded-md border border-slate-200">
                    <div className="min-w-[1690px] min-h-max pr-2">
                      <div
                        className="text-xs font-medium text-slate-600 border-b border-slate-800 pb-2 grid"
                        style={{ gridTemplateColumns: gridTemplateColumns }}
                      >
                        <div className="text-left px-2">Название группы</div>
                        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d, idx) => {
                          const dayDate = new Date(weekStart);
                          dayDate.setDate(weekStart.getDate() + idx);
                          return (
                            <div key={d} className="text-center">
                              {d}, {formatDateRu(dayDate)}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-2 space-y-2">
                        {scheduleGroupsToRender.map((group) => (
                          <div
                            key={group.id}
                            className="grid items-stretch"
                            style={{ gridTemplateColumns: gridTemplateColumns }}
                          >
                            <div className="border border-slate-800 px-2 py-2 text-sm font-bold text-slate-800 flex items-center justify-center text-center">
                              {group.name}
                            </div>
                            {Array.from({ length: 7 }).map((_, dayIdx) => {
                              const dayDate = new Date(weekStart);
                              dayDate.setDate(weekStart.getDate() + dayIdx);
                              const dateStr = formatDate(dayDate);

                              return (
                                <div
                                  key={dayIdx}
                                  className="border border-slate-800 p-1 bg-slate-50 min-h-[248px]"
                                >
                                  <div className="space-y-1">
                                    {Array.from({ length: 7 }).map((_, pairIdx) => {
                                      const pairTime = pairTimes[pairIdx];
                                      const existingItem =
                                        scheduleIndex.get(
                                          `${group.id}|${dateStr}|${pairTime}`
                                        ) ?? null;

                                      const key = slotKey(dateStr, group.id, pairIdx);
                                      const draft = slotDrafts[key];
                                      const selectedSubjectId =
                                        draft?.subjectId ?? existingItem?.subject_id ?? null;
                                      const selectedTeacherId =
                                        draft?.teacherId ?? existingItem?.teacher_id ?? null;
                                      const selectedSlotTeacher = selectedTeacherId
                                        ? teachersById.get(selectedTeacherId) ?? null
                                        : null;
                                      const effectiveReplacementTeacherId = getReplacementTeacherIdForSlot(
                                        key
                                      );
                                      const selectedReplacementTeacher = effectiveReplacementTeacherId
                                        ? teachersById.get(effectiveReplacementTeacherId) ?? null
                                        : null;
                                      const selectedSlotTeacherRoom =
                                        selectedSlotTeacher?.roomNumber?.trim() || "не указан";
                                      const displayedRoom =
                                        selectedReplacementTeacher?.roomNumber?.trim() ||
                                        selectedSlotTeacherRoom;

                                      return (
                                        <div
                                          key={pairIdx}
                                          className="border border-slate-800 bg-white p-1"
                                        >
                                          <div className="text-[10px] text-slate-700 font-medium mb-1">
                                            {pairIdx + 1} пара
                                          </div>
                                          <div className="grid grid-cols-2 gap-1">
                                            <select
                                              className="border border-slate-700 rounded-sm px-1 py-0.5 text-[10px] bg-white text-slate-900"
                                              value={selectedSubjectId ?? ""}
                                              onChange={async (e) => {
                                                const nextSubjectId = e.target.value
                                                  ? Number(e.target.value)
                                                  : null;
                                                const nextTeacherId = selectedTeacherId;
                                                setSlotDrafts((prev) => ({
                                                  ...prev,
                                                  [key]: {
                                                    subjectId: nextSubjectId,
                                                    teacherId: nextTeacherId
                                                  }
                                                }));
                                                try {
                                                  await upsertScheduleSlot(
                                                    dateStr,
                                                    group.id,
                                                    pairIdx,
                                                    nextSubjectId,
                                                    nextTeacherId,
                                                    existingItem ?? undefined
                                                  );
                                                } catch (err: any) {
                                                  console.error(err);
                                                  alert(
                                                    err.response?.data?.details ||
                                                      err.response?.data?.message ||
                                                      "Не удалось сохранить занятие"
                                                  );
                                                }
                                              }}
                                            >
                                              <option value="">Предмет</option>
                                              {subjects.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                  {s.name}
                                                </option>
                                              ))}
                                            </select>
                                            <select
                                              className="border border-slate-700 rounded-sm px-1 py-0.5 text-[10px] bg-white text-slate-900"
                                              value={selectedTeacherId ?? ""}
                                              onChange={async (e) => {
                                                const nextTeacherId = e.target.value
                                                  ? Number(e.target.value)
                                                  : null;
                                                const nextSubjectId = selectedSubjectId;
                                                setSlotDrafts((prev) => ({
                                                  ...prev,
                                                  [key]: {
                                                    subjectId: nextSubjectId,
                                                    teacherId: nextTeacherId
                                                  }
                                                }));
                                                try {
                                                  await upsertScheduleSlot(
                                                    dateStr,
                                                    group.id,
                                                    pairIdx,
                                                    nextSubjectId,
                                                    nextTeacherId,
                                                    existingItem ?? undefined
                                                  );
                                                } catch (err: any) {
                                                  console.error(err);
                                                  alert(
                                                    err.response?.data?.details ||
                                                      err.response?.data?.message ||
                                                      "Не удалось сохранить преподавателя пары"
                                                  );
                                                }
                                              }}
                                            >
                                              <option value="">Преподаватель</option>
                                              {sortedTeachersList.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                  {t.name}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                          <div className="mt-1">
                                            <select
                                              className="w-full border border-slate-700 rounded-sm px-1 py-0.5 text-[10px] bg-white text-slate-900"
                                              value={effectiveReplacementTeacherId ?? ""}
                                              onChange={(e) => {
                                                const nextReplacementTeacherId = e.target.value
                                                  ? Number(e.target.value)
                                                  : null;
                                                setReplacementTeacherBySlot((prev) => {
                                                  const next = {
                                                    ...prev,
                                                    [key]: nextReplacementTeacherId
                                                  };
                                                  localStorage.setItem(
                                                    REPLACEMENT_ASSIGNMENTS_KEY,
                                                    JSON.stringify(next)
                                                  );
                                                  return next;
                                                });
                                              }}
                                            >
                                              <option value="">Замена преподавателя</option>
                                              {sortedTeachersList
                                                .filter((t) => t.id !== selectedTeacherId)
                                                .map((t) => (
                                                  <option key={t.id} value={t.id}>
                                                    {t.name}
                                                  </option>
                                                ))}
                                            </select>
                                          </div>
                                          <div className="mt-1 border border-slate-700 rounded-sm px-1 py-0.5 text-[10px] text-slate-800 bg-slate-50">
                                            Кабинет: {displayedRoom}
                                            {selectedReplacementTeacher
                                              ? ` • Замещает: ${selectedReplacementTeacher.name}`
                                              : ""}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                        {scheduleGroupsToRender.length === 0 && (
                          <div className="text-xs text-slate-400">
                            Нет групп для отображения. Добавьте группу во вкладке «Группы».
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  </div>
                  </div>

                  {scheduleError && (
                    <div className="mt-2 text-xs text-red-600">{scheduleError}</div>
                  )}
                  {scheduleLoading && (
                    <div className="mt-2 text-xs text-slate-500">Загрузка расписания...</div>
                  )}
                </>
              )}

              {isTeacherModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-30">
                  <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-5 space-y-3">
                    <h2 className="text-lg font-semibold text-slate-800">
                      {editingTeacherId ? "Редактировать преподавателя" : "Новый преподаватель"}
                    </h2>
                    <div className="space-y-2 text-sm">
                      <input
                        type="text"
                        placeholder="Фамилия"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        value={teacherLastName}
                        onChange={(e) => setTeacherLastName(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Имя"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        value={teacherFirstName}
                        onChange={(e) => setTeacherFirstName(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Отчество"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        value={teacherMiddleName}
                        onChange={(e) => setTeacherMiddleName(e.target.value)}
                      />
                      <select
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        value={teacherModalSubjectId ?? ""}
                        onChange={(e) =>
                          setTeacherModalSubjectId(
                            e.target.value === "" ? null : Number(e.target.value)
                          )
                        }
                      >
                        <option value="">Предмет (опционально)</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Номер кабинета"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        value={teacherModalRoomNumber}
                        onChange={(e) => setTeacherModalRoomNumber(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 text-sm hover:bg-slate-50"
                        onClick={() => {
                          setIsTeacherModalOpen(false);
                          setEditingTeacherId(null);
                          setTeacherModalRoomNumber("");
                        }}
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm hover:bg-slate-800"
                        onClick={handleCreateTeacher}
                      >
                        {editingTeacherId ? "Сохранить" : "Добавить"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isGroupModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-30">
                  <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-5 space-y-3">
                    <h2 className="text-lg font-semibold text-slate-800">Новая группа</h2>
                    <div className="space-y-2 text-sm">
                      <input
                        type="text"
                        placeholder="Название группы"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        value={groupModalName}
                        onChange={(e) => setGroupModalName(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 text-sm hover:bg-slate-50"
                        onClick={() => {
                          setIsGroupModalOpen(false);
                          setGroupModalName("");
                        }}
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm hover:bg-slate-800"
                        onClick={handleCreateGroup}
                      >
                        Добавить группу
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isGroupEditModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-30">
                  <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-5 space-y-3">
                    <h2 className="text-lg font-semibold text-slate-800">
                      Редактировать группу
                    </h2>
                    <div className="space-y-2 text-sm">
                      <input
                        type="text"
                        placeholder="Новое название группы"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        value={groupEditModalName}
                        onChange={(e) => setGroupEditModalName(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 text-sm hover:bg-slate-50"
                        onClick={() => {
                          setIsGroupEditModalOpen(false);
                          setGroupEditModalName("");
                        }}
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm hover:bg-slate-800"
                        onClick={handleSaveGroupRename}
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {isReplacementStatsModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-30">
                  <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-800">Статистика замещений</h2>
                        <p className="text-xs text-slate-500 mt-1">
                          По преподавателю: {selectedTeacher?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-md border border-emerald-300 text-emerald-700 text-sm hover:bg-emerald-50"
                          onClick={handleExportReplacementStatsXlsx}
                        >
                          Экспорт XLSX
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-md border border-emerald-300 text-emerald-700 text-sm hover:bg-emerald-50"
                          onClick={handleExportReplacementStatsCsv}
                        >
                          Экспорт CSV
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 text-sm hover:bg-slate-50"
                          onClick={() => setIsReplacementStatsModalOpen(false)}
                        >
                          Закрыть
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <div className="text-[11px] uppercase text-slate-400">Сколько часов замещения</div>
                        <div className="text-xl font-semibold text-emerald-600 mt-1">
                          {replacementHoursTotal.toFixed(1)} ч
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <div className="text-[11px] uppercase text-slate-400">У какой группы замещение</div>
                        <div className="text-xs text-slate-700 mt-1">
                          {replacementGroups.length > 0 ? replacementGroups.join(", ") : "Нет данных"}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <div className="text-[11px] uppercase text-slate-400">По какому предмету замещение</div>
                        <div className="text-xs text-slate-700 mt-1">
                          {replacementSubjects.length > 0
                            ? replacementSubjects.join(", ")
                            : "Нет данных"}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-md border border-slate-200 overflow-hidden">
                      <div className="grid grid-cols-[120px_80px_1fr_1fr_1fr] bg-slate-100 text-[11px] text-slate-700 font-medium">
                        <div className="px-2 py-1 border-r border-slate-200">Дата</div>
                        <div className="px-2 py-1 border-r border-slate-200">Кол-во пар</div>
                        <div className="px-2 py-1 border-r border-slate-200">Группа</div>
                        <div className="px-2 py-1 border-r border-slate-200">Предмет</div>
                        <div className="px-2 py-1">Кого замещает</div>
                      </div>
                      <div className="max-h-56 overflow-auto text-xs">
                        {replacementStatsSummaryRows.length === 0 && (
                          <div className="px-3 py-3 text-slate-400">Замещения не найдены.</div>
                        )}
                        {replacementStatsSummaryRows.map((entry) => (
                          <div
                            key={entry.summaryKey}
                            className="grid grid-cols-[120px_80px_1fr_1fr_1fr] border-t border-slate-200"
                          >
                            <div className="px-2 py-1 border-r border-slate-200">{entry.date}</div>
                            <div className="px-2 py-1 border-r border-slate-200">{entry.pairCount}</div>
                            <div className="px-2 py-1 border-r border-slate-200">{entry.groupName}</div>
                            <div className="px-2 py-1 border-r border-slate-200">
                              {entry.subjectName}
                            </div>
                            <div className="px-2 py-1">{entry.baseTeacherName}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-900/40 bg-cover bg-center bg-no-repeat p-4"
      style={{ backgroundImage: 'url("/vpt_foto.jpg")' }}
    >
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-semibold text-slate-800 mb-4">
          {forgotPasswordMode
            ? "Восстановление пароля"
            : mode === "login"
            ? "Авторизация"
            : "Регистрация преподавателя"}
        </h1>

        {!forgotPasswordMode && (
          <div className="flex gap-2 mb-4 text-sm">
            <button
              className={`flex-1 py-2 rounded-md border text-center ${
                mode === "login"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-300"
              }`}
              onClick={() => setMode("login")}
            >
              Вход
            </button>
            <button
              className={`flex-1 py-2 rounded-md border text-center ${
                mode === "register"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-300"
              }`}
              onClick={() => setMode("register")}
            >
              Регистрация
            </button>
          </div>
        )}

        {forgotPasswordMode ? (
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {forgotMessage && <div className="text-sm text-slate-600">{forgotMessage}</div>}
            <button
              type="submit"
              className="w-full mt-2 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              Отправить ссылку для сброса
            </button>
            <button
              type="button"
              className="w-full mt-2 py-2 rounded-md border border-slate-300 text-slate-600 text-sm hover:bg-slate-50"
              onClick={() => {
                setForgotPasswordMode(false);
                setForgotMessage(null);
              }}
            >
              Вернуться к входу
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="block text-sm text-slate-600 mb-1">Имя</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-slate-600 mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full border rounded-md px-3 py-2 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 px-2 text-xs text-slate-500 hover:text-slate-700"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Скрыть" : "Показать"}
                </button>
              </div>
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Подождите..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
            {/* Скрываем ссылку «Забыли пароль?» по требованию заказчика */}
          </form>
        )}
      </div>

      {scheduleFormOpen && token && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-5 space-y-3">
            <h2 className="text-lg font-semibold text-slate-800">
              {editingScheduleId ? "Редактирование занятия" : "Новое занятие"}
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Дата</label>
                <input
                  type="date"
                  className="w-full border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  value={scheduleFormDate}
                  onChange={(e) => setScheduleFormDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">Время начала</label>
                  <input
                    type="time"
                    className="w-full border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    value={scheduleFormTime}
                    onChange={(e) => setScheduleFormTime(e.target.value)}
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-slate-500 mb-1">Длительность, ч</label>
                  <input
                    type="number"
                    step="0.5"
                    className="w-full border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    value={scheduleFormDuration}
                    onChange={(e) => setScheduleFormDuration(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Группа</label>
                <input
                  type="text"
                  disabled
                  className="w-full border rounded-md px-2 py-1 text-sm bg-slate-100 text-slate-500"
                  value={
                    groups.find((g) => g.id === scheduleFormGroupId)?.name || "Выберите ячейку в расписании"
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Предмет</label>
                <select
                  className="w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  value={profileSubjectId ?? ""}
                  onChange={(e) =>
                    setProfileSubjectId(e.target.value === "" ? null : Number(e.target.value))
                  }
                >
                  <option value="">Выберите предмет в профиле</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Для разных предметов можно будет завести несколько записей.
                </p>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Аудитория</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  value={scheduleFormRoom}
                  onChange={(e) => setScheduleFormRoom(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <button
                className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 text-sm hover:bg-slate-50"
                onClick={() => {
                  setScheduleFormOpen(false);
                  setEditingScheduleId(null);
                }}
              >
                Отмена
              </button>
              <div className="flex gap-2">
                {editingScheduleId && (
                  <button
                    className="px-3 py-1.5 rounded-md border border-red-300 text-red-600 text-sm hover:bg-red-50"
                    onClick={async () => {
                      try {
                        await axios.delete(`/api/schedule/${editingScheduleId}`);
                        await loadSchedule();
                        const profile = await axios.get<Teacher>("/api/profile/me");
                        setTeacher((prev) => ({ ...(prev ?? profile.data), ...profile.data }));
                        setScheduleFormOpen(false);
                        setEditingScheduleId(null);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  >
                    Удалить
                  </button>
                )}
                <button
                  className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                  onClick={async () => {
                    if (
                      !scheduleFormDate ||
                      !scheduleFormTime ||
                      !scheduleFormDuration ||
                      !scheduleFormGroupId
                    ) {
                      return;
                    }
                    if (!profileSubjectId) {
                      alert("Сначала выберите предмет в профиле или в форме.");
                      return;
                    }
                    const payload = {
                      date: scheduleFormDate,
                      time: `${scheduleFormTime}:00`,
                      durationHours: Number(scheduleFormDuration.replace(",", ".")),
                      groupId: scheduleFormGroupId,
                      subjectId: profileSubjectId,
                      room: scheduleFormRoom || null
                    };
                    try {
                      if (editingScheduleId) {
                        await axios.put(`/api/schedule/${editingScheduleId}`, payload);
                      } else {
                        await axios.post("/api/schedule", payload);
                      }
                      await loadSchedule();
                      const profile = await axios.get<Teacher>("/api/profile/me");
                      setTeacher((prev) => ({ ...(prev ?? profile.data), ...profile.data }));
                      setScheduleFormOpen(false);
                      setEditingScheduleId(null);
                    } catch (err) {
                      console.error(err);
                      alert("Ошибка сохранения занятия");
                    }
                  }}
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;






