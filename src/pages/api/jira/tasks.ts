import type { NextApiRequest, NextApiResponse } from 'next';

// Define the structure of a Jira issue
interface JiraIssue {
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

// Define the structure of the API response
interface ApiResponse {
  tasks?: JiraIssue[];
  error?: string;
}

// Main handler for the API route
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email, apiToken, domain } = req.body;

  if (!email || !apiToken || !domain) {
    return res.status(400).json({ error: 'Missing Jira credentials' });
  }

  try {
    // Construct the JQL query to find tasks assigned to the user
    // that are in 'In Progress' or 'Selected for Development' status
    const jql = `assignee = currentUser() AND status IN ("In Progress", "Selected for Development") ORDER BY updated DESC`;

    // Encode the JQL query for the URL
    const encodedJql = encodeURIComponent(jql);

    // Construct the Jira API URL
    const jiraApiUrl = `https://${domain}/rest/api/3/search?jql=${encodedJql}`;

    // Create the authorization header
    const authToken = Buffer.from(`${email}:${apiToken}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Fetch the data from Jira
    const response = await fetch(jiraApiUrl, { headers });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Jira API error:', errorData);
      throw new Error(`Jira API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const tasks: JiraIssue[] = data.issues || [];

    res.status(200).json({ tasks });

  } catch (error) {
    console.error('Error fetching Jira tasks:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
}
