import mongoose, { Schema, Document } from "mongoose";

export interface ITimetable extends Document {
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
}

const TimetableSchema: Schema = new Schema({
  subject: { type: String, required: true },
  day: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

export default mongoose.model<ITimetable>("Timetable", TimetableSchema);
