import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ClockifyWorkspace } from "../types";
import { useClockifyStore } from "../store/useClockifyStore";

type ApiInputProps = {
  onFetchTimeEntries: (
    apiKey: string,
    workspaceId: string,
    startDate?: Date,
    endDate?: Date
  ) => void;
  isProcessing: boolean;
  error?: string;
  workspaces: ClockifyWorkspace[];
  isLoadingWorkspaces: boolean;
};

// Function to get the most recent workday (handles weekends)
const getPreviousWorkDay = (date: Date = new Date()): Date => {
  const prevDay = new Date(date);
  prevDay.setDate(prevDay.getDate() - 1);

  // If it's Monday, go back to Friday
  if (prevDay.getDay() === 0) {
    // Sunday
    prevDay.setDate(prevDay.getDate() - 2);
  } else if (prevDay.getDay() === 6) {
    // Saturday
    prevDay.setDate(prevDay.getDate() - 1);
  }

  return prevDay;
};

export const ApiInput = ({
  onFetchTimeEntries,
  isProcessing,
  error,
  workspaces,
  isLoadingWorkspaces,
}: ApiInputProps) => {
  // Get state and actions from Zustand store
  const { 
    apiKey, 
    workspaceId, 
    setApiKey, 
    setWorkspaceId,
    setWorkspaces,
  } = useClockifyStore();

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  // Set default dates on component mount
  useEffect(() => {
    const today = new Date();
    const yesterday = getPreviousWorkDay(today);

    setStartDate(yesterday);
    setEndDate(today);
  }, []);

  // Load workspaces when API key changes
  useEffect(() => {
    const loadWorkspaces = async () => {
      if (!apiKey) return;

      try {
        const response = await fetch("https://api.clockify.me/api/v1/workspaces", {
          headers: {
            "X-Api-Key": apiKey,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch workspaces");
        }

        const data = await response.json();
        setWorkspaces(data);

        // Auto-select the first workspace if none is selected
        if (data.length > 0 && !workspaceId) {
          setWorkspaceId(data[0].id);
        }
      } catch (err) {
        console.error("Error fetching workspaces:", err);
        setWorkspaceError("Failed to load workspaces. Please check your API key.");
      }
    };

    loadWorkspaces();
  }, [apiKey, setWorkspaces, workspaceId, setWorkspaceId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey) {
      setWorkspaceError("API key is required");
      return;
    }

    if (!workspaceId) {
      setWorkspaceError("Please select a workspace");
      return;
    }

    // Use custom dates if enabled, otherwise use default (yesterday and today)
    const effectiveStartDate = useCustomDates && startDate ? startDate : undefined;
    const effectiveEndDate = useCustomDates && endDate ? endDate : undefined;

    onFetchTimeEntries(apiKey, workspaceId, effectiveStartDate, effectiveEndDate);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="api-key">API Key</Label>
          {isLoadingWorkspaces && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex space-x-2">
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Clockify API key"
            className="flex-1"
          />
          {apiKey && (
            <Button
              variant="outline"
              onClick={() => setApiKey("")}
              disabled={isProcessing}
              type="button"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="workspace">Workspace</Label>
        <select
          id="workspace"
          value={workspaceId}
          onChange={(e) => setWorkspaceId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoadingWorkspaces || workspaces.length === 0}
        >
          {isLoadingWorkspaces ? (
            <option>Loading workspaces...</option>
          ) : workspaces.length === 0 ? (
            <option>No workspaces available</option>
          ) : (
            workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name} ({workspace.id})
              </option>
            ))
          )}
        </select>
        {workspaceError && (
          <p className="mt-1 text-sm text-red-600">{workspaceError}</p>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="font-medium">Error fetching data</div>
          <div className="mt-1">{error}</div>
        </div>
      )}

      <div className="flex items-center space-x-2 mb-2">
        <input
          type="checkbox"
          id="use-custom-dates"
          checked={useCustomDates}
          onChange={(e) => setUseCustomDates(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <Label
          htmlFor="use-custom-dates"
          className="text-sm font-medium text-gray-700"
        >
          Use custom date range (optional)
        </Label>
      </div>

      {useCustomDates && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal mt-1"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal mt-1"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={
          !apiKey ||
          !workspaceId ||
          isProcessing ||
          (useCustomDates && (!startDate || !endDate))
        }
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Fetching Time Entries...
          </>
        ) : (
          "Generate Standup"
        )}
      </Button>
    </form>
  );
};
