import { JiraConnectDialog } from "./JiraConnectDialog";
import { JiraTaskSelector } from "./JiraTaskSelector";
import { JiraIssue } from "../types";

interface JiraIntegrationProps {
  onTasksSelected: (tasks: JiraIssue[]) => void;
}

export const JiraIntegration = ({ onTasksSelected }: JiraIntegrationProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 justify-between">
        <h2 className="text-xl font-semibold">Jira Integration</h2>
        <JiraConnectDialog />
      </div>
      <JiraTaskSelector onTasksSelected={onTasksSelected} />
    </div>
  );
};
