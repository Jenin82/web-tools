import { TimeEntriesData, TimeEntry } from "../types";
import { formatDuration, formatDateForDisplay } from "./dateUtils";

export const processTimeEntries = (data: TimeEntriesData): string => {
  if (!data.timeEntriesList || data.timeEntriesList.length === 0) {
    return "No time entries found.";
  }

  // Group entries by date
  const entriesByDate: Record<string, TimeEntry[]> = {};
  
  data.timeEntriesList.forEach(entry => {
    if (!entry.timeInterval?.start) return;
    
    const dateStr = entry.timeInterval.start.split('T')[0];
    if (!entriesByDate[dateStr]) {
      entriesByDate[dateStr] = [];
    }
    entriesByDate[dateStr].push(entry);
  });

  // Sort dates in descending order
  const sortedDates = Object.keys(entriesByDate).sort().reverse();
  if (sortedDates.length === 0) {
    return "No valid time entries found.";
  }

  // Get today's and yesterday's entries
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  // const yesterdayStr = yesterday.toISOString().split('T')[0]; // Unused variable

  // Find the most recent workday with entries (for "yesterday" section)
  let lastWorkdayWithEntries: string | null = null;
  for (const dateStr of sortedDates) {
    if (dateStr < today) {
      lastWorkdayWithEntries = dateStr;
      break;
    }
  }

  // If no previous workday found, use the oldest date
  if (!lastWorkdayWithEntries && sortedDates.length > 0) {
    lastWorkdayWithEntries = sortedDates[sortedDates.length - 1];
  }

  // Prepare output
  const output: string[] = [];
  
  // Add today's date header
  output.push(`Date: ${formatDateForDisplay(new Date())}`);
  output.push('');

  // Add yesterday's work section
  output.push('What I accomplished yesterday?');
  output.push('');
  
  if (lastWorkdayWithEntries) {
    const entries = entriesByDate[lastWorkdayWithEntries] || [];
    if (entries.length > 0) {
      const workDate = new Date(lastWorkdayWithEntries);
      const dayName = workDate.toLocaleDateString('en-US', { weekday: 'long' });
      const formattedDate = workDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      output.push(`(Work from ${dayName}, ${formattedDate})`);
      
      // Group by task ID if available, otherwise by description
      interface Task {
        desc: string;
        duration: number;
        taskId?: string;
        taskName?: string;
        formattedDuration: string;
        timeInterval?: {
          start: string;
          end: string;
          duration: string;
        };
      }
      const tasks = new Map<string, Task>();
      
      // First pass: collect all entries grouped by task
      const tasksByKey = new Map<string, {
        desc: string;
        taskId: string;
        taskName?: string;
        entries: Array<{
          durationMs: number;
          formattedDuration: string;
          start: string;
          end: string;
        }>;
      }>();

      entries.forEach(entry => {
        const desc = entry.description?.trim() || 'No description';
        const taskId = desc.match(/\[([^\]]+)\]]/)?.[1] || '';
        const formattedDesc = desc.replace(/\s*\[[^\]]+\]\s*$/, '').trim();
        const key = taskId || formattedDesc;
        
        // Calculate duration for this entry
        let durationMs = 0;
        let formattedDuration = '0m';
        
        if (entry.timeInterval?.duration) {
          // Use the pre-formatted duration from the API
          formattedDuration = entry.timeInterval.duration;
          
          // Parse the formatted duration to calculate milliseconds
          const durationMatch = formattedDuration.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/);
          const hours = durationMatch?.[1] ? parseInt(durationMatch[1], 10) : 0;
          const minutes = durationMatch?.[2] ? parseInt(durationMatch[2], 10) : 0;
          durationMs = (hours * 3600000) + (minutes * 60000);
        } else if (entry.timeInterval?.start && entry.timeInterval?.end) {
          // Calculate from start/end times if duration not available
          const start = new Date(entry.timeInterval.start);
          const end = new Date(entry.timeInterval.end);
          durationMs = end.getTime() - start.getTime();
          
          if (durationMs > 0) {
            formattedDuration = formatDuration(
              entry.timeInterval.duration,
              entry.timeInterval.start,
              entry.timeInterval.end
            );
          }
        }
        
        // Add to task group
        const existing = tasksByKey.get(key);
        if (existing) {
          existing.entries.push({
            durationMs,
            formattedDuration,
            start: entry.timeInterval?.start || new Date().toISOString(),
            end: entry.timeInterval?.end || new Date().toISOString()
          });
        } else {
          tasksByKey.set(key, {
            desc: formattedDesc,
            taskId,
            taskName: entry.task?.name,
            entries: [{
              durationMs,
              formattedDuration,
              start: entry.timeInterval?.start || new Date().toISOString(),
              end: entry.timeInterval?.end || new Date().toISOString()
            }]
          });
        }
      });
      
      // Process each unique task and aggregate durations
      tasksByKey.forEach((taskData, key) => {
        // Skip if we've already processed this task
        if (tasks.has(key)) return;
        
        // Calculate total duration in milliseconds
        const totalDurationMs = taskData.entries.reduce(
          (sum, entry) => sum + entry.durationMs,
          0
        );
        
        // Format the total duration
        const hours = Math.floor(totalDurationMs / 3600000);
        const minutes = Math.floor((totalDurationMs % 3600000) / 60000);
        
        let formattedDuration = '';
        if (hours > 0) formattedDuration += `${hours}h`;
        if (minutes > 0 || hours === 0) {
          if (formattedDuration) formattedDuration += ' ';
          formattedDuration += `${minutes}m`;
        }
        
        // Add the task with aggregated duration
        tasks.set(key, {
          desc: taskData.desc,
          duration: totalDurationMs,
          taskId: taskData.taskId,
          taskName: taskData.taskName || '',
          formattedDuration,
          timeInterval: {
            start: taskData.entries[0]?.start || new Date().toISOString(),
            end: taskData.entries[taskData.entries.length - 1]?.end || new Date().toISOString(),
            duration: formattedDuration
          }
        });
      });

      // Convert to array and sort by duration (descending)
      const sortedTasks = Array.from(tasks.values())
        .sort((a, b) => b.duration - a.duration);

      // Add tasks to output with formatted durations
      sortedTasks.forEach(task => {
        const taskRef = task.taskId ? ` [${task.taskId}]` : '';
        output.push(`- ${task.desc} (${task.formattedDuration})${taskRef}`);
      });
    }
  }
  
  output.push('');

  // Add today's plan section
  output.push('What I am going to do today?');
  output.push('');
  
  if (entriesByDate[today]?.length > 0) {
    const uniqueTasks = new Map<string, string>();
    
    entriesByDate[today].forEach(entry => {
      const desc = entry.description?.trim() || 'No description';
      const taskId = desc.match(/\[([^\]]+)\]/)?.[1] || entry.task?.name || '';
      
      // Use task ID as key if available, otherwise use description
      const key = taskId || desc;
      const displayText = desc.replace(/\s*\[[^\]]+\]\s*$/, '').trim();
      
      if (!uniqueTasks.has(key)) {
        const taskRef = taskId ? ` [${taskId}]` : '';
        uniqueTasks.set(key, `- ${displayText}${taskRef}`);
      }
    });
    
    // Add tasks to output
    uniqueTasks.forEach(taskText => {
      output.push(taskText);
    });
  }

  return output.join('\n');
};
