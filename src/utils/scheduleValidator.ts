// Convert time string (HH:MM) to minutes since midnight for easy comparison
export const timeToMinutes = (time: string): number => {
  const parts = time.split(":");
  const hours = parseInt(parts[0] || "", 10);
  const minutes = parseInt(parts[1] || "", 10);
  return hours * 60 + minutes;
};

// Check if two time slots overlap
export const timesSlotsOverlap = (
  startTime1: string,
  endTime1: string,
  startTime2: string,
  endTime2: string
): boolean => {
  const start1 = timeToMinutes(startTime1);
  const end1 = timeToMinutes(endTime1);
  const start2 = timeToMinutes(startTime2);
  const end2 = timeToMinutes(endTime2);

  // No overlap if one ends before the other starts
  if (end1 <= start2 || end2 <= start1) {
    return false;
  }

  return true;
};

// Check if a schedule conflicts with existing schedules
export const hasScheduleConflict = (
  day: string,
  startTime: string,
  endTime: string,
  existingSchedules: Array<{
    day: string;
    startTime: string;
    endTime: string;
    _id?: string;
  }>,
  excludeId?: string
): boolean => {
  return existingSchedules.some((schedule) => {
    // Skip the same schedule if we're updating
    if (excludeId && schedule._id?.toString() === excludeId) {
      return false;
    }

    // Check if on same day and times overlap
    if (schedule.day === day) {
      return timesSlotsOverlap(
        startTime,
        endTime,
        schedule.startTime,
        schedule.endTime
      );
    }

    return false;
  });
};
