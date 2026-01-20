import mongoose, { Schema, Document } from "mongoose";

export interface IGroup extends Document {
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IGroup>("Group", GroupSchema);
