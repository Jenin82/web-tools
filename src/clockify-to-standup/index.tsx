"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { JsonInput } from "./components/JsonInput";
import { ApiInput } from "./components/ApiInput";
import { OutputDisplay } from "./components/OutputDisplay";
import { processTimeEntries as processTimeEntriesUtil } from './utils/processTimeEntries';
import { fetchTimeEntries, fetchClockifyWorkspaces } from './utils/api';
import { TimeEntriesData, ClockifyWorkspace } from "./types";
import { useClockifyStore } from './store/useClockifyStore';

export type { TimeEntriesData } from "./types";

const ClockifyToStandup = () => {
  const [inputMethod, setInputMethod] = useState<'json' | 'api'>('api');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  // Zustand store for persistent state
  const {
    apiKey,
    workspaceId,
    workspaces,
    setApiKey,
    setWorkspaceId,
    setWorkspaces,
  } = useClockifyStore();

  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [apiError, setApiError] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load workspaces when API key changes
  useEffect(() => {
    if (apiKey) {
      loadWorkspaces(apiKey);
    } else {
      setWorkspaces([]);
    }
    // We only want to run this effect when the component mounts or apiKey changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Fetch workspaces from Clockify API
  const loadWorkspaces = async (key: string) => {
    if (!key) return;
    
    setIsLoadingWorkspaces(true);
    setApiError('');
    
    try {
      const fetchedWorkspaces = await fetchClockifyWorkspaces(key);
      setWorkspaces(fetchedWorkspaces);
      
      // If we have workspaces but no workspace is selected, select the first one
      if (fetchedWorkspaces.length > 0 && !workspaceId) {
        setWorkspaceId(fetchedWorkspaces[0].id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch workspaces';
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingWorkspaces(false);
      setIsInitialized(true);
    }
  };

  const validateTimeEntries = (data: unknown): data is TimeEntriesData => {
    if (!data || typeof data !== 'object') return false;
    if (!('timeEntriesList' in data)) return false;
    if (!Array.isArray((data as TimeEntriesData).timeEntriesList)) return false;
    return true;
  };

  const handleFetchTimeEntries = async (apiKey: string, workspaceId: string, startDate?: Date, endDate?: Date) => {
    try {
      setIsProcessing(true);
      setApiError('');
      setError('');
      
      const timeEntriesData = await fetchTimeEntries(apiKey, workspaceId, startDate, endDate);
      
      // Process the time entries like we do with JSON input
      const result = processTimeEntriesUtil(timeEntriesData);
      setOutput(result);
      
      // Auto-copy to clipboard
      navigator.clipboard.writeText(result);
      toast.success('Standup summary copied to clipboard!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch time entries';
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyOutput = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      toast.success('Copied to clipboard!');
    }
  };

  const handleProcess = () => {
    try {
      // Check for empty input
      if (!input.trim()) {
        setError('Please enter JSON data');
        return;
      }

      // Try to parse JSON
      let parsedData;
      try {
        parsedData = JSON.parse(input);
      } catch (parseError) {
        // Try to extract JSON from string if it's wrapped in code blocks
        const jsonMatch = input.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            parsedData = JSON.parse(jsonMatch[1]);
          } catch (nestedError) {
            throw new Error('Invalid JSON format. Could not parse the provided input.');
          }
        } else {
          throw new Error('Invalid JSON format. Please check your input.');
        }
      }

      // Validate the structure
      if (!validateTimeEntries(parsedData)) {
        throw new Error('Invalid data structure. Expected { timeEntriesList: [...] }');
      }

      // Process the data
      const result = processTimeEntriesUtil(parsedData);
      setOutput(result);
      setError('');
      
      // Auto-copy to clipboard
      navigator.clipboard.writeText(result);
      toast.success('Standup summary copied to clipboard!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error processing data:', err);
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Clockify to Standup</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={inputMethod} 
            onValueChange={(value) => setInputMethod(value as 'json' | 'api')}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="json">JSON Input</TabsTrigger>
              <TabsTrigger value="api">Clockify API</TabsTrigger>
            </TabsList>
            
            <TabsContent value="json">
              <JsonInput 
                value={input}
                onChange={setInput}
                onProcess={handleProcess}
                isProcessing={isProcessing}
                error={error}
              />
            </TabsContent>
            
            <TabsContent value="api">
              <ApiInput 
                onFetchTimeEntries={handleFetchTimeEntries}
                isProcessing={isProcessing}
                error={apiError}
                workspaces={useClockifyStore(state => state.workspaces)}
                isLoadingWorkspaces={useClockifyStore(state => state.workspaces.length === 0 && !!state.apiKey)}
              />
            </TabsContent>
          </Tabs>
          
          {output && (
            <OutputDisplay 
              output={output} 
              onCopy={handleCopyOutput} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClockifyToStandup;