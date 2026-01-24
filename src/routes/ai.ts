import type { Request, Response } from "express";
import { Router } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Timetable from "../models/Timetable.js";

const router = Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

router.get("/suggestions", (req: Request, res: Response) => {
  res.json({
    suggestions: [
      "What is my next class?",
      "Show me my timetable for today",
      "Rate my timetable",
      "Do I have any free slots on Monday?",
      "What classes do I have on Friday?",
    ],
  });
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    let prompt = message;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const userId = decoded.userId;

        const entries = await Timetable.find({
          userId: new mongoose.Types.ObjectId(userId),
        }).sort({ day: 1, startTime: 1 });

        if (entries.length > 0) {
          const timetableData = entries
            .map((e) => `${e.day}: ${e.subject} (${e.startTime}-${e.endTime})`)
            .join("\n");
          prompt = `${message}\n\nContext: The user has the following timetable:\n${timetableData}\n\nInstruction: If the user asks to rate the timetable, analyze the schedule balance, gaps, and workload, then provide a rating out of 10 with reasons.`;
        }
      } catch (error) {
        console.error("Token verification failed in AI route", error);
      }
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.VITE_GEMINI_API_KEY || "",
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }
    const data = await response.json();
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    res.json({ reply });
  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "Error processing AI request" });
  }
});

export default router;
