import mongoose, { Schema, Document } from "mongoose";

export interface IGroupSchedule extends Document {
  groupId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  day: string;
  startTime: string;
  endTime: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GroupScheduleSchema: Schema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    day: {
      type: String,
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IGroupSchedule>(
  "GroupSchedule",
  GroupScheduleSchema
);
