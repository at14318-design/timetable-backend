import { Router } from "express";
import type { Request, Response } from "express";
import Timetable from "../models/Timetable.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const router = Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to verify JWT token
const verifyToken = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).userId = decoded.userId;
    (req as any).userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// GET user's timetable entries
router.get("/:userId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requestingUserId = (req as any).userId;

    // Users can only see their own timetable
    if (userId !== requestingUserId) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const entries = await Timetable.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).sort({ day: 1, startTime: 1 });

    res.set("Cache-Control", "no-store");
    res.status(200).json(entries);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// POST new timetable entry
router.post("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const { subject, day, startTime, endTime, reminder } = req.body;
    const userId = (req as any).userId;

    if (!subject || !day || !startTime || !endTime) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const newEntry = new Timetable({
      userId: new mongoose.Types.ObjectId(userId),
      subject,
      day,
      startTime,
      endTime,
      reminder: !!reminder,
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// PUT update timetable entry
router.put("/:entryId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const { subject, day, startTime, endTime, reminder } = req.body;
    const userId = (req as any).userId;

    const entry = await Timetable.findById(entryId);

    if (!entry) {
      res.status(404).json({ message: "Entry not found" });
      return;
    }

    // Check if user owns this entry
    if (entry.userId.toString() !== userId) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    if (subject) entry.subject = subject;
    if (day) entry.day = day;
    if (startTime) entry.startTime = startTime;
    if (endTime) entry.endTime = endTime;
    if (reminder !== undefined) entry.reminder = reminder;

    await entry.save();
    res.status(200).json(entry);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// DELETE timetable entry
router.delete("/:entryId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const userId = (req as any).userId;

    const entry = await Timetable.findById(entryId);

    if (!entry) {
      res.status(404).json({ message: "Entry not found" });
      return;
    }

    // Check if user owns this entry
    if (entry.userId.toString() !== userId) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    await Timetable.findByIdAndDelete(entryId);
    res.status(200).json({ message: "Entry deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

export default router;
