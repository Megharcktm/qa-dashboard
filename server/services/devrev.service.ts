import axios, { AxiosInstance, AxiosError } from 'axios';

interface DevRevWork {
  id: string;
  display_id: string;
  title: string;
  body?: string;
  type: string;
  state?: string;
  stage_name?: string;
  priority?: string;
  severity?: string;
  created_date: string;
  modified_date: string;
  target_close_date?: string;
  created_by?: { id: string; display_name: string };
  modified_by?: { id: string; display_name: string };
  owned_by?: { id: string; display_name: string };
  reported_by?: { id: string; display_name: string };
  applies_to_part?: { id: string; display_name: string };
  tags?: Array<{ id: string; name: string }>;
  sprint?: { id: string; display_name: string };
  [key: string]: any; // Allow other fields
}

interface DevRevListResponse {
  works: DevRevWork[];
  next_cursor?: string | null;
}

export class DevRevService {
  private client: AxiosInstance;
  private token: string;

  constructor() {
    const token = process.env.DEVREV_PAT_TOKEN?.trim();
    if (!token) {
      throw new Error('DEVREV_PAT_TOKEN environment variable is not set');
    }

    this.token = token;
    this.client = axios.create({
      baseURL: process.env.DEVREV_API_URL || 'https://api.devrev.ai',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async fetchAllWorks(
    types?: string[],
    onProgress?: (count: number, cursor?: string) => void
  ): Promise<DevRevWork[]> {
    let allWorks: DevRevWork[] = [];
    let cursor: string | null = null;
    let pageCount = 0;

    try {
      do {
        pageCount++;
        console.log(`Fetching DevRev works page ${pageCount}...`);

        const requestBody: any = {
          limit: 100,
        };

        // Add cursor if not first request
        if (cursor) {
          requestBody.cursor = cursor;
        }

        // Filter by types if provided (issue, ticket, etc)
        if (types && types.length > 0) {
          requestBody.type = types;
        }

        const response = await this.client.post<DevRevListResponse>(
          '/works.list',
          requestBody
        );

        const { works = [], next_cursor } = response.data;

        console.log(`  Received ${works.length} works`);
        allWorks = allWorks.concat(works);

        cursor = next_cursor || null;

        // Call progress callback
        if (onProgress) {
          onProgress(allWorks.length, cursor || undefined);
        }

        // Avoid infinite loops
        if (!cursor) {
          break;
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } while (cursor);

      console.log(`✓ Fetched ${allWorks.length} total works from DevRev`);
      return allWorks;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data
        ? JSON.stringify(axiosError.response.data)
        : axiosError.message;

      console.error('Error fetching from DevRev:', errorMessage);
      throw new Error(`Failed to fetch works from DevRev: ${errorMessage}`);
    }
  }

  async fetchIssuesAndTickets(
    onProgress?: (count: number, cursor?: string) => void
  ): Promise<DevRevWork[]> {
    return this.fetchAllWorks(['issue', 'ticket'], onProgress);
  }

  /**
   * Fetch internal discussions/comments for a work item
   */
  async fetchWorkDiscussions(workId: string): Promise<any[]> {
    try {
      const response = await this.client.post('/work_comments.list', {
        work: { id: workId },
        limit: 100,
      });

      return response.data.comments || [];
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error fetching work discussions:', axiosError.message);
      return [];
    }
  }
}

export function createDevRevService(): DevRevService {
  return new DevRevService();
}
