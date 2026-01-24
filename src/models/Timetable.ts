import mongoose, { Schema, Document } from "mongoose";

export interface ITimetable extends Document {
  userId: mongoose.Types.ObjectId;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  reminder?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TimetableSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      required: true,
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
    reminder: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model<ITimetable>("Timetable", TimetableSchema);
