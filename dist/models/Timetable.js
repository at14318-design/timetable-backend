import mongoose, { Schema, Document } from "mongoose";
const TimetableSchema = new Schema({
    subject: { type: String, required: true },
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
});
export default mongoose.model("Timetable", TimetableSchema);
//# sourceMappingURL=Timetable.js.map