import { Router } from "express";
import type { Request, Response } from "express";
import Group from "../models/Group.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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

// POST Create a new group
router.post("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const userId = (req as any).userId;

    if (!name) {
      res.status(400).json({ message: "Group name is required" });
      return;
    }

    const newGroup = new Group({
      name,
      description,
      createdBy: new mongoose.Types.ObjectId(userId),
      members: [new mongoose.Types.ObjectId(userId)],
    });

    await newGroup.save();
    await newGroup.populate("createdBy members", "username email");

    res.status(201).json(newGroup);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Error creating group" });
  }
});

// GET all groups for current user
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const groups = await Group.find({
      $or: [
        { createdBy: new mongoose.Types.ObjectId(userId) },
        { members: new mongoose.Types.ObjectId(userId) },
      ],
    }).populate("createdBy members", "username email");

    res.status(200).json(groups);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Error fetching groups" });
  }
});

// GET specific group by ID
router.get("/:groupId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = (req as any).userId;

    const group = await Group.findById(groupId).populate(
      "createdBy members",
      "username email"
    );

    if (!group) {
      res.status(404).json({ message: "Group not found" });
      return;
    }

    // Check if user is a member or creator
    const isMember = group.members.some(
      (memberId) => memberId.toString() === userId
    );
    const isCreator = group.createdBy.toString() === userId;

    if (!isMember && !isCreator) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    res.status(200).json(group);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Error fetching group",
    });
  }
});

// PUT Update group
router.put("/:groupId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { name, description } = req.body;
    const userId = (req as any).userId;

    const group = await Group.findById(groupId);

    if (!group) {
      res.status(404).json({ message: "Group not found" });
      return;
    }

    // Only creator can update group details
    if (group.createdBy.toString() !== userId) {
      res.status(403).json({ message: "Only group creator can update" });
      return;
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;

    await group.save();
    await group.populate("createdBy members", "username email");

    res.status(200).json(group);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Error updating group" });
  }
});

// POST Add member to group
router.post(
  "/:groupId/members",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      const { email } = req.body;
      const userId = (req as any).userId;

      if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
      }

      const group = await Group.findById(groupId);

      if (!group) {
        res.status(404).json({ message: "Group not found" });
        return;
      }

      // Only creator can add members
      if (group.createdBy.toString() !== userId) {
        res.status(403).json({ message: "Only group creator can add members" });
        return;
      }

      const userToAdd = await User.findOne({ email });

      if (!userToAdd) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Check if already a member
      if (
        group.members.some(
          (memberId) => memberId.toString() === userToAdd._id.toString()
        )
      ) {
        res.status(400).json({ message: "User is already a member" });
        return;
      }

      group.members.push(userToAdd._id);
      await group.save();
      await group.populate("createdBy members", "username email");

      res.status(200).json(group);
    } catch (error: any) {
      res.status(500).json({
        message: error.message || "Error adding member",
      });
    }
  }
);

// DELETE Remove member from group
router.delete(
  "/:groupId/members/:memberId",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { groupId, memberId } = req.params;
      const userId = (req as any).userId;

      const group = await Group.findById(groupId);

      if (!group) {
        res.status(404).json({ message: "Group not found" });
        return;
      }

      // Only creator can remove members
      if (group.createdBy.toString() !== userId) {
        res
          .status(403)
          .json({ message: "Only group creator can remove members" });
        return;
      }

      group.members = group.members.filter((id) => id.toString() !== memberId);

      await group.save();
      await group.populate("createdBy members", "username email");

      res.status(200).json(group);
    } catch (error: any) {
      res.status(500).json({
        message: error.message || "Error removing member",
      });
    }
  }
);

// DELETE Delete group
router.delete("/:groupId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = (req as any).userId;

    const group = await Group.findById(groupId);

    if (!group) {
      res.status(404).json({ message: "Group not found" });
      return;
    }

    // Only creator can delete group
    if (group.createdBy.toString() !== userId) {
      res.status(403).json({ message: "Only group creator can delete group" });
      return;
    }

    await Group.findByIdAndDelete(groupId);

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Error deleting group" });
  }
});

export default router;
