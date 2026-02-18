import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth";
import profileRouter from "./routes/profile";
import scheduleRouter from "./routes/schedule";
import groupsRouter from "./routes/groups";
import teachersRouter from "./routes/teachers";
import subjectsRouter from "./routes/subjects";
import reportsRouter from "./routes/reports";
import { initDb, pool } from "./db";

dotenv.config();

async function startServer() {
  await initDb();

  const app = express();
  const port = process.env.PORT || 4000;

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok", db: "connected" });
    } catch {
      res.status(500).json({ status: "error", db: "disconnected" });
    }
  });

  app.use("/api/auth", authRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/schedule", scheduleRouter);
  app.use("/api/groups", groupsRouter);
  app.use("/api/teachers", teachersRouter);
  app.use("/api/subjects", subjectsRouter);
  app.use("/api/reports", reportsRouter);

  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});

