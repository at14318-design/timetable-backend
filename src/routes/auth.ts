import { Router } from "express";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// POST login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return token and user info
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST register (optional, for testing)
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, username, role } = req.body;

    // Validate input
    if (!email || !password || !username) {
      res
        .status(400)
        .json({ message: "Email, password, and username are required" });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    // Create new user
    const newUser = new User({
      email,
      password,
      username,
      role: role || "student",
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
