import mongoose, { Document } from "mongoose";
export interface ITimetable extends Document {
    subject: string;
    day: string;
    startTime: string;
    endTime: string;
}
declare const _default: mongoose.Model<ITimetable, {}, {}, {}, mongoose.Document<unknown, {}, ITimetable, {}, mongoose.DefaultSchemaOptions> & ITimetable & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, ITimetable>;
export default _default;
//# sourceMappingURL=Timetable.d.ts.map