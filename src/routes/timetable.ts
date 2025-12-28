import { Router } from "express";
import Timetable from "../models/Timetable.js";

const router = Router();

// GET all entries
router.get("/", async (req, res) => {
  try {
    const entries = await Timetable.find();
    res.set("Cache-Control", "no-store");
    res.status(200).json(entries); // explicitly return 200 OK
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST new entry
router.post("/", async (req, res) => {
  const newEntry = new Timetable(req.body);
  await newEntry.save();
  res.json(newEntry);
});

export default router;
