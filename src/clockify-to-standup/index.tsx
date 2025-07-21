"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ApiInput } from "./components/ApiInput";
import { OutputDisplay } from "./components/OutputDisplay";
import { JiraIntegration } from "./components/JiraIntegration";
import { processTimeEntries } from "./utils/processTimeEntries";
import { fetchTimeEntries, fetchClockifyWorkspaces } from "./utils/api";
import { useClockifyStore } from "./store/useClockifyStore";
import { ClockifyWorkspace, JiraIssue } from "./types";

// Helper to get the previous workday, skipping weekends
const getPreviousWorkDay = (date: Date = new Date()): Date => {
  const prevDay = new Date(date);
  prevDay.setDate(prevDay.getDate() - 1);
  if (prevDay.getDay() === 0) { // Sunday
    prevDay.setDate(prevDay.getDate() - 2);
  } else if (prevDay.getDay() === 6) { // Saturday
    prevDay.setDate(prevDay.getDate() - 1);
  }
  return prevDay;
};

export const ClockifyToStandupPage = () => {
  const [output, setOutput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [workspaces, setWorkspaces] = useState<ClockifyWorkspace[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(getPreviousWorkDay());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedJiraTasks, setSelectedJiraTasks] = useState<JiraIssue[]>([]);

  // Zustand store hooks
  const { apiKey, workspaceId, setWorkspaceId } = useClockifyStore();

  // Effect to load workspaces when API key changes
  useEffect(() => {
    if (apiKey) {
      setIsLoadingWorkspaces(true);
      setError("");
      fetchClockifyWorkspaces(apiKey)
        .then((fetchedWorkspaces: ClockifyWorkspace[]) => {
          setWorkspaces(fetchedWorkspaces);
          if (fetchedWorkspaces.length > 0 && !workspaceId) {
            setWorkspaceId(fetchedWorkspaces[0].id);
          }
        })
        .catch((err: any) => {
          setError(err.message || "Failed to load workspaces. Check your API key.");
          setWorkspaces([]);
        })
        .finally(() => {
          setIsLoadingWorkspaces(false);
        });
    } else {
      setWorkspaces([]);
      setWorkspaceId(''); // Clear workspace when API key is removed
    }
  }, [apiKey, workspaceId, setWorkspaceId]);

  const handleGenerateStandup = async () => {
    if (!apiKey || !workspaceId) {
      setError("API Key and Workspace must be selected.");
      return;
    }

    setIsProcessing(true);
    setError("");
    setOutput("");

    try {
      const timeEntries = await fetchTimeEntries(
        apiKey,
        workspaceId,
        useCustomDates ? startDate : getPreviousWorkDay(),
        useCustomDates ? endDate : new Date()
      );
      const standup = processTimeEntries(timeEntries, selectedJiraTasks);
      setOutput(standup);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred while fetching time entries.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Clockify to Standup
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Generate your daily standup report from Clockify & Jira.
        </p>
      </header>

      <div className="space-y-8">
        <section className="p-6 border rounded-lg bg-card text-card-foreground">
          <h2 className="text-2xl font-semibold mb-4">1. Clockify Setup</h2>
          <ApiInput
            error={error}
            workspaces={workspaces}
            isLoadingWorkspaces={isLoadingWorkspaces}
            useCustomDates={useCustomDates}
            setUseCustomDates={setUseCustomDates}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />
        </section>

        <section className="p-6 border rounded-lg bg-card text-card-foreground">
          <h2 className="text-2xl font-semibold mb-4">2. Jira Integration (Optional)</h2>
          <JiraIntegration onTasksSelected={setSelectedJiraTasks} />
        </section>

        <div className="flex justify-center mt-8">
          <Button
            onClick={handleGenerateStandup}
            disabled={isProcessing || !apiKey || !workspaceId}
            size="lg"
            className="w-full max-w-xs text-lg"
          >
            {isProcessing ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...</>
            ) : (
              "Generate Standup"
            )}
          </Button>
        </div>

        <OutputDisplay output={output} setOutput={setOutput} />
      </div>
    </div>
  );
};

export default ClockifyToStandupPage;