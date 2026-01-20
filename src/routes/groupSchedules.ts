import { Router } from "express";
import type { Request, Response } from "express";
import GroupSchedule from "../models/GroupSchedule.js";
import Group from "../models/Group.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { hasScheduleConflict } from "../utils/scheduleValidator.js";

const router = Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to verify JWT token
const verifyToken = (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// POST Create a new group schedule
router.post("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const { groupId, title, description, day, startTime, endTime } = req.body;
    const userId = (req as any).userId;

    // Validation
    if (!groupId || !title || !day || !startTime || !endTime) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      res.status(400).json({ message: "Invalid time format. Use HH:MM" });
      return;
    }

    // Check if start time is before end time
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      res.status(400).json({ message: "Start time must be before end time" });
      return;
    }

    // Check if user is a member of the group
    const group = await Group.findById(groupId);

    if (!group) {
      res.status(404).json({ message: "Group not found" });
      return;
    }

    const isMember = group.members.some(
      (memberId) => memberId.toString() === userId
    );
    const isCreator = group.createdBy.toString() === userId;

    if (!isMember && !isCreator) {
      res.status(403).json({ message: "You are not a member of this group" });
      return;
    }

    // Get all existing schedules for this group
    const existingSchedules = await GroupSchedule.find({
      groupId: new mongoose.Types.ObjectId(groupId),
    });

    // Check for conflicts
    if (
      hasScheduleConflict(
        day,
        startTime,
        endTime,
        existingSchedules.map((s) => ({
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
          _id: s._id.toString(),
        }))
      )
    ) {
      res.status(400).json({
        message:
          "Schedule conflict detected. This time slot overlaps with an existing schedule.",
      });
      return;
    }

    const newSchedule = new GroupSchedule({
      groupId: new mongoose.Types.ObjectId(groupId),
      title,
      description,
      day,
      startTime,
      endTime,
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    await newSchedule.save();
    await newSchedule.populate("groupId createdBy", "name username email");

    res.status(201).json(newSchedule);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Error creating schedule",
    });
  }
});

// GET all schedules for a group
router.get(
  "/group/:groupId",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      const userId = (req as any).userId;

      // Check if user is a member of the group
      const group = await Group.findById(groupId);

      if (!group) {
        res.status(404).json({ message: "Group not found" });
        return;
      }

      const isMember = group.members.some(
        (memberId) => memberId.toString() === userId
      );
      const isCreator = group.createdBy.toString() === userId;

      if (!isMember && !isCreator) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      const schedules = await GroupSchedule.find({
        groupId: new mongoose.Types.ObjectId(groupId),
      })
        .populate("createdBy", "username email")
        .sort({ day: 1, startTime: 1 });

      res.status(200).json(schedules);
    } catch (error: any) {
      res.status(500).json({
        message: error.message || "Error fetching schedules",
      });
    }
  }
);

// GET specific schedule by ID
router.get("/:scheduleId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const userId = (req as any).userId;

    const schedule = await GroupSchedule.findById(scheduleId)
      .populate("groupId", "name")
      .populate("createdBy", "username email");

    if (!schedule) {
      res.status(404).json({ message: "Schedule not found" });
      return;
    }

    // Check if user is a member of the group
    const group = await Group.findById(schedule.groupId);

    if (!group) {
      res.status(404).json({ message: "Group not found" });
      return;
    }

    const isMember = group.members.some(
      (memberId) => memberId.toString() === userId
    );
    const isCreator = group.createdBy.toString() === userId;

    if (!isMember && !isCreator) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    res.status(200).json(schedule);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Error fetching schedule",
    });
  }
});

// PUT Update schedule
router.put("/:scheduleId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const { title, description, day, startTime, endTime } = req.body;
    const userId = (req as any).userId;

    const schedule = await GroupSchedule.findById(scheduleId);

    if (!schedule) {
      res.status(404).json({ message: "Schedule not found" });
      return;
    }

    // Check if user is the creator
    if (schedule.createdBy.toString() !== userId) {
      res.status(403).json({ message: "Only creator can update schedule" });
      return;
    }

    // If time or day is being changed, check for conflicts
    if (day !== undefined || startTime !== undefined || endTime !== undefined) {
      const newDay = day || schedule.day;
      const newStartTime = startTime || schedule.startTime;
      const newEndTime = endTime || schedule.endTime;

      // Validate time format
      if (startTime || endTime) {
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (
          (startTime && !timeRegex.test(startTime)) ||
          (endTime && !timeRegex.test(endTime))
        ) {
          res.status(400).json({ message: "Invalid time format. Use HH:MM" });
          return;
        }
      }

      // Check if start time is before end time
      const [startHour, startMin] = newStartTime.split(":").map(Number);
      const [endHour, endMin] = newEndTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        res.status(400).json({ message: "Start time must be before end time" });
        return;
      }

      // Get all existing schedules for this group (excluding current schedule)
      const existingSchedules = await GroupSchedule.find({
        groupId: schedule.groupId,
      });

      if (
        hasScheduleConflict(
          newDay,
          newStartTime,
          newEndTime,
          existingSchedules.map((s) => ({
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
            _id: s._id.toString(),
          })),
          scheduleId
        )
      ) {
        res.status(400).json({
          message:
            "Schedule conflict detected. This time slot overlaps with an existing schedule.",
        });
        return;
      }

      schedule.day = newDay;
      schedule.startTime = newStartTime;
      schedule.endTime = newEndTime;
    }

    if (title !== undefined) schedule.title = title;
    if (description !== undefined) schedule.description = description;

    await schedule.save();
    await schedule.populate("groupId createdBy", "name username email");

    res.status(200).json(schedule);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Error updating schedule",
    });
  }
});

// DELETE Delete schedule
router.delete(
  "/:scheduleId",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { scheduleId } = req.params;
      const userId = (req as any).userId;

      const schedule = await GroupSchedule.findById(scheduleId);

      if (!schedule) {
        res.status(404).json({ message: "Schedule not found" });
        return;
      }

      // Check if user is the creator
      if (schedule.createdBy.toString() !== userId) {
        res.status(403).json({ message: "Only creator can delete schedule" });
        return;
      }

      await GroupSchedule.findByIdAndDelete(scheduleId);

      res.status(200).json({ message: "Schedule deleted successfully" });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || "Error deleting schedule",
      });
    }
  }
);

export default router;
