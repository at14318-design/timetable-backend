import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import timetableRoutes from "./routes/timetable.js";
import authRoutes from "./routes/auth.js";
import groupRoutes from "./routes/groups.js";
import groupScheduleRoutes from "./routes/groupSchedules.js";
import aiRoutes from "./routes/ai.js";
import startScheduler from "./routes/scheduler.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/schedules", groupScheduleRoutes);

startScheduler();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
