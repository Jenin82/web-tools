import { useState, useEffect } from 'react';
import { useJiraStore } from '../store/useJiraStore';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { JiraIssue } from '../types/index';

interface GroupedTasks {
  [projectName: string]: JiraIssue[];
}

interface JiraTaskSelectorProps {
  onTasksSelected: (selectedTasks: JiraIssue[]) => void;
}

export const JiraTaskSelector = ({ onTasksSelected }: JiraTaskSelectorProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  const { email, apiToken, domain, isConnected } = useJiraStore();

  const [selectedTasks, setSelectedTasks] = useState<JiraIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks>({});

  const fetchTasks = async () => {
    if (!isConnected()) {
      toast.error('Please connect to Jira first.');
      return;
    }

    setIsLoading(true);
    setGroupedTasks({});
    try {
      const response = await fetch('/api/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: apiToken, domain }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as { message: string }).message || 'Failed to fetch Jira tasks.');
      }



      const grouped = data.reduce((acc: GroupedTasks, task: JiraIssue) => {
        const projectName = `${task.fields.project.name} [${task.fields.project.key}]`;
        if (!acc[projectName]) {
          acc[projectName] = [];
        }
        acc[projectName].push(task);
        return acc;
      }, {} as GroupedTasks);
      setGroupedTasks(grouped);

      if (data.length === 0) {
        toast.info("No 'In Progress' or 'Selected for Development' tasks found.");
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskToggle = (task: JiraIssue) => {
    setSelectedTasks((prevSelected) => {
      const isSelected = prevSelected.some((t) => t.id === task.id);
      if (isSelected) {
        return prevSelected.filter((t) => t.id !== task.id);
      } else {
        return [...prevSelected, task];
      }
    });
  };

  useEffect(() => {
    onTasksSelected(selectedTasks);
  }, [selectedTasks, onTasksSelected]);

  if (!isConnected()) {
    return null;
  }

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button onClick={fetchTasks} disabled={isLoading} size="sm">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Fetch Jira Tasks
        </Button>
      </div>
      {Object.keys(groupedTasks).length > 0 && (
        <div className="space-y-4 rounded-md border p-4" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {Object.entries(groupedTasks).map(([projectName, projectTasks]) => (
            <div key={projectName}>
              <h4 className="mb-2 font-semibold">{projectName}</h4>
              <div className="space-y-2 pl-4">
                {projectTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <Checkbox
                      id={task.id}
                      checked={selectedTasks.some((t) => t.id === task.id)}
                      onCheckedChange={() => handleTaskToggle(task)}
                    />
                    <Label htmlFor={task.id} className="cursor-pointer">
                      {`[${task.key}] ${task.fields.summary}`}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};
