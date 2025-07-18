export interface TimeEntry {
  id: string;
  description: string;
  timeInterval: {
    start: string;
    end: string;
    duration: string | null;
  };
  project: {
    name: string;
  };
  task?: {
    name: string;
  };
}

export interface TimeEntriesData {
  timeEntriesList: TimeEntry[];
}

export interface ClockifyWorkspace {
  id: string;
  name: string;
}

export interface ClockifyUser {
  id: string;
  name: string;
  email: string;
  activeWorkspace: string;
  defaultWorkspace: string;
  status: 'ACTIVE' | 'PENDING_EMAIL_VERIFICATION' | 'DELETED';
}

export interface ClockifyApiFormData {
  apiKey: string;
  workspaceId: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
}
