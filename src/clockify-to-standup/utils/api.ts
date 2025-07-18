import { TimeEntriesData, ClockifyWorkspace, ClockifyUser, TimeEntry } from "../types";
import { formatDuration } from "./dateUtils";

// Validate workspace ID format (24-character hex string)
const isValidWorkspaceId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const makeRequest = async <T>(
  url: string,
  apiKey: string,
  method: string = "GET",
  body?: Record<string, unknown> | string
): Promise<T> => {
  const headers: HeadersInit = {
    "X-Api-Key": apiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("API Error:", {
      status: response.status,
      statusText: response.statusText,
      url,
      response: responseData,
    });

    throw new Error(
      responseData.message ||
        `API error (${response.status}): ${response.statusText}`
    );
  }

  return responseData;
};

// Fetch current user
const fetchCurrentUser = async (apiKey: string): Promise<ClockifyUser> => {
  return makeRequest<ClockifyUser>(
    "https://api.clockify.me/api/v1/user",
    apiKey
  );
};

// Fetch workspaces from Clockify API
export const fetchClockifyWorkspaces = async (
  apiKey: string
): Promise<ClockifyWorkspace[]> => {
  return makeRequest<ClockifyWorkspace[]>(
    "https://api.clockify.me/api/v1/workspaces",
    apiKey
  );
};

// Get default date range (yesterday and today)
const getDefaultDateRange = () => {
  // Get current date in local timezone
  const now = new Date();

  // Start of today in local time
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Start of yesterday in local time
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Adjust for weekends
  if (yesterday.getDay() === 0) {
    // Sunday
    yesterday.setDate(yesterday.getDate() - 2); // Friday
  } else if (yesterday.getDay() === 6) {
    // Saturday
    yesterday.setDate(yesterday.getDate() - 1); // Friday
  }

  // End of today in local time
  const endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);

  // Log dates in both local and UTC for debugging
  console.log("Default date range:", {
    local: {
      start: yesterday.toString(),
      end: endDate.toString(),
    },
    utc: {
      start: yesterday.toISOString(),
      end: endDate.toISOString(),
    },
  });

  return { startDate: yesterday, endDate };
};

// Fetch time entries from Clockify API
export const fetchTimeEntries = async (
  apiKey: string,
  workspaceId: string,
  startDate?: Date,
  endDate?: Date
): Promise<TimeEntriesData> => {
  try {
    // Clean and validate workspace ID
    const cleanWorkspaceId = workspaceId.trim();

    if (!isValidWorkspaceId(cleanWorkspaceId)) {
      throw new Error(
        `Invalid workspace ID format. Expected 24-character hex string, got: ${cleanWorkspaceId}`
      );
    }

    // First, get the current user ID
    const currentUser = await fetchCurrentUser(apiKey);
    if (!currentUser.id) {
      throw new Error("Failed to get current user ID");
    }

    // Use default date range if not provided
    const { startDate: defaultStartDate, endDate: defaultEndDate } =
      getDefaultDateRange();
    const effectiveStartDate = startDate || defaultStartDate;
    const effectiveEndDate = endDate || defaultEndDate;

    // Create URL with query parameters using the correct endpoint format
    const url = new URL(
      `https://api.clockify.me/api/workspaces/${cleanWorkspaceId}/timeEntries/user/${currentUser.id}/full`
    );

    // Format dates for the API - ensure we're using UTC dates
    const startDateStr = effectiveStartDate.toISOString();
    const endDateStr = effectiveEndDate.toISOString();

    // Set query parameters
    url.searchParams.append("start", startDateStr);
    url.searchParams.append("end", endDateStr);
    url.searchParams.append("page", "0");
    url.searchParams.append("limit", "50"); // Match the limit from your example

    const requestUrl = url.toString();

    // Define the API response type
    interface TimeEntryResponse {
      id: string;
      description: string;
      timeInterval: {
        start: string;
        end: string | null;
        duration: string;
      };
      project: {
        name: string;
      };
      projectId: string;
    }

    // Make the API request with proper typing
    const response = await makeRequest<TimeEntryResponse[] | { timeEntriesList: TimeEntryResponse[] }>(requestUrl, apiKey);

    // Extract time entries from the response object
    const timeEntriesList: TimeEntryResponse[] = Array.isArray(response)
      ? response
      : response?.timeEntriesList || [];

    console.log("Extracted time entries:", {
      isArray: Array.isArray(timeEntriesList),
      count: timeEntriesList.length,
      firstEntry: timeEntriesList[0],
    });

    // Transform the entries to match the expected TimeEntry format
    const formattedEntries: TimeEntry[] = timeEntriesList.map((entry: TimeEntryResponse) => {
      // Extract task ID from description if it exists (format: [TASK-123])
      const taskIdMatch = entry.description?.match(/\[([^\]]+)\]/);
      const taskId = taskIdMatch ? taskIdMatch[1] : "";

      // Clean up the description by removing the task ID
      const cleanDescription =
        entry.description?.replace(/^\s*\[[^\]]+\]\s*:\s*/, "") ||
        "No description";

      const start = entry.timeInterval?.start || "";
      const end = entry.timeInterval?.end || "";
      
      // Format duration using both the duration string and start/end times as fallback
      const duration = formatDuration(entry.timeInterval?.duration, start, end);

      return {
        id: entry.id,
        description: cleanDescription,
        timeInterval: {
          start,
          end,
          duration
        },
        project: {
          name: entry.project?.name || "No Project",
          id: entry.projectId || ""
        },
        task: {
          name: taskId || "No Task",
          id: taskId
        }
      };
    });

    console.log("Processed time entries summary:", {
      count: formattedEntries.length,
      hasEntries: formattedEntries.length > 0,
      firstEntry: formattedEntries[0],
      lastEntry: formattedEntries[formattedEntries.length - 1],
    });

    // Return in the format expected by processTimeEntries
    return { timeEntriesList: formattedEntries };
  } catch (error) {
    console.error("Error fetching time entries:", error);
    throw error;
  }
};
