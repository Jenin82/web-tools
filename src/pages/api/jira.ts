import type { NextApiRequest, NextApiResponse } from 'next';
import { JiraIssue } from '../../clockify-to-standup/types/index';

// Define the structure of a raw Jira API issue response
interface RawJiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    project: {
      key: string;
      name: string;
    };
    status: {
      name: string;
    };
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email, token, domain } = req.body;

  if (!email || !token || !domain) {
    return res.status(400).json({ message: 'Missing required parameters: email, token, domain' });
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  const jiraUrl = `https://${domain.trim()}`;

  const headers = {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  try {
    // JQL to find issues assigned to the current user that are in progress or selected for development
    const jql = `assignee = currentUser() AND status in ("In Progress", "Selected for Development") ORDER BY updated DESC`;
    
    const response = await fetch(`${jiraUrl}/rest/api/3/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jql, fields: ["summary", "project", "status"] }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Jira API Error:', { status: response.status, error: errorData });
      return res.status(response.status).json({ 
        message: `Failed to fetch tasks from Jira. Status: ${response.status}`,
        details: errorData.errorMessages || 'No additional details provided.',
      });
    }

    const data = await response.json();

    // Transform the raw response into the simplified JiraIssue format our app uses
    const issues: JiraIssue[] = data.issues.map((issue: RawJiraIssue) => ({
      id: issue.id,
      key: issue.key,
      fields: {
        summary: issue.fields.summary,
        project: {
          key: issue.fields.project.key,
          name: issue.fields.project.name,
        },
      },
    }));

    res.status(200).json(issues);

  } catch (error: any) {
    console.error('Internal Server Error fetching from Jira:', error);
    res.status(500).json({ message: 'An internal server error occurred.', details: error.message });
  }
}
