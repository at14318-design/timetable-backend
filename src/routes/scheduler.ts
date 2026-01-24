import cron from "node-cron";
import nodemailer from "nodemailer";
import Timetable, { type ITimetable } from "../models/Timetable.js";
import type { IUser } from "../models/User.js";

// Configure Nodemailer transporter
// Ensure EMAIL_USER and EMAIL_PASS are set in your .env file
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "at14318@gmail.com",
    pass: process.env.EMAIL_PASS || "yixg ptsl lfly kwrv",
  },
});

// Map Date.getDay() (0-6) to day names stored in DB
const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Interface for the populated event object
interface IPopulatedTimetable extends Omit<ITimetable, "userId"> {
  userId: IUser;
}

const startScheduler = () => {
  console.log("Event Reminder Scheduler started...");

  // Run every minute
  cron.schedule("* * * * *", async () => {
    const now = new Date();

    // Calculate time 15 minutes from now
    const targetTime = new Date(now.getTime() + 15 * 60000);

    // Format to HH:mm (24-hour format) to match your DB storage
    const hours = String(targetTime.getHours()).padStart(2, "0");
    const minutes = String(targetTime.getMinutes()).padStart(2, "0");
    const timeString = `${hours}:${minutes}`;

    // Get day name (e.g., "Monday") matching Date.getDay() index
    const dayName = days[targetTime.getDay()];

    try {
      // Find events starting in 15 minutes that have reminders enabled
      const events = (await Timetable.find({
        day: dayName ?? "",
        startTime: timeString,
        reminder: true,
      }).populate("userId")) as unknown as IPopulatedTimetable[]; // Populate user details to get the email

      if (events.length > 0) {
        console.log(
          `Found ${events.length} events starting at ${timeString} on ${dayName}`,
        );
      }

      for (const event of events) {
        if (event.userId && event.userId.email) {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: event.userId.email,
            subject: `Reminder: ${event.subject} starts in 15 minutes`,
            text: `Hello ${event.userId.username || "User"},\n\nThis is a reminder that your event "${event.subject}" is scheduled to start at ${event.startTime}.\n\nBest regards,\nTimetable App`,
          };

          // Send email without awaiting to prevent blocking the loop
          transporter.sendMail(mailOptions, (error: Error | null) => {
            if (error)
              console.error(
                `Error sending email to ${event.userId.email}:`,
                error,
              );
            else console.log(`Reminder sent to ${event.userId.email}`);
          });
        }
      }
    } catch (error) {
      console.error("Error in scheduler:", error);
    }
  });
};

export default startScheduler;
