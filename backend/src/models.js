import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

const emailSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    to: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 20000 },
    scheduledAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["SCHEDULED", "PROCESSING", "SENT", "FAILED", "CANCELLED"],
      default: "SCHEDULED",
      index: true
    },
    jobId: { type: String, unique: true, sparse: true },
    sentAt: Date,
    previewUrl: String,
    error: String
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
export const Email = mongoose.model("Email", emailSchema);
