import { Router } from "express";
import Timetable from "../models/Timetable.js";

const router = Router();

// GET all entries
router.get("/", async (req, res) => {
  const entries = await Timetable.find();
  res.json(entries);
});

// POST new entry
router.post("/", async (req, res) => {
  const newEntry = new Timetable(req.body);
  await newEntry.save();
  res.json(newEntry);
});

export default router;
