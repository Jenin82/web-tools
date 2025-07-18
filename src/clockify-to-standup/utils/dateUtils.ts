export const formatDuration = (
  duration: string | undefined | null,
  startTime?: string,
  endTime?: string
): string => {
  try {
    // First, try to parse the duration string if provided
    if (duration) {
      // Handle ISO 8601 duration format (e.g., PT1H30M)
      const matches = duration.match(
        /PT(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)?/
      );
      if (matches) {
        const hours = matches[1] ? parseInt(matches[1], 10) : 0;
        const minutes = matches[2] ? parseInt(matches[2], 10) : 0;

        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0 || hours === 0) parts.push(`${minutes}m`);

        const formatted = parts.join(" ");
        if (formatted) return formatted;
      }
    }

    // Fall back to calculating from start/end times if duration string is not available or invalid
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end.getTime() - start.getTime();

      if (diffMs > 0) {
        const minutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (remainingMinutes > 0 || hours === 0)
          parts.push(`${remainingMinutes}m`);

        return parts.join(" ") || "0m";
      }
    }

    return "0m";
  } catch (error) {
    console.error("Error formatting duration:", error, {
      duration,
      startTime,
      endTime,
    });
    return "0m";
  }
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Format date to ISO string for Clockify API
export const formatDateForApi = (date: Date): string => {
  // Ensure we're working with a date object
  const d = new Date(date);
  // Return ISO string with milliseconds and timezone
  return d.toISOString();
};

// Format date for display in the standup output (DD-MM-YYYY)
export const formatDateForDisplay = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const getPreviousWorkDay = (date: Date): Date => {
  const prevDay = new Date(date);
  prevDay.setDate(prevDay.getDate() - 1);

  // If it's Sunday (0) or Monday (1), go back to Friday
  if (prevDay.getDay() === 0) {
    prevDay.setDate(prevDay.getDate() - 2);
  } else if (prevDay.getDay() === 6) {
    prevDay.setDate(prevDay.getDate() - 1);
  }

  return prevDay;
};

export const getDayName = (date: Date): string => {
  return date.toLocaleDateString("en-US", { weekday: "long" });
};
