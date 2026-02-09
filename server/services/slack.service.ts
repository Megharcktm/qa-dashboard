import axios from 'axios';

interface SlackMessage {
  user?: string;
  username?: string;
  text: string;
  ts: string;
  thread_ts?: string;
  files?: Array<{
    name: string;
    type: string;
    url?: string;
    mimetype?: string;
  }>;
}

interface SlackConversation {
  channel: string;
  messages: SlackMessage[];
  error?: string;
}

export class SlackService {
  private token: string;
  private baseUrl = 'https://slack.com/api';

  constructor(token?: string) {
    this.token = token || process.env.SLACK_BOT_TOKEN || '';
  }

  /**
   * Get Slack conversation messages for a channel (thread if messageTs provided)
   */
  async getConversationMessages(
    channelId: string,
    messageTs?: string
  ): Promise<SlackConversation> {
    try {
      if (!this.token) {
        return {
          channel: channelId,
          messages: [],
          error: 'Slack token not configured. Add SLACK_BOT_TOKEN to .env',
        };
      }

      let endpoint = `${this.baseUrl}/conversations.history`;
      let params: any = {
        channel: channelId,
        limit: 50,
      };

      // If messageTs is provided, fetch the thread instead of channel history
      if (messageTs) {
        endpoint = `${this.baseUrl}/conversations.replies`;
        params = {
          channel: channelId,
          ts: messageTs,
          limit: 50,
        };
      }

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        params,
      });

      if (!response.data.ok) {
        return {
          channel: channelId,
          messages: [],
          error: response.data.error || 'Failed to fetch Slack messages',
        };
      }

      // Format messages and fetch user info for each
      const messagesData = response.data.messages || [];
      const messages: SlackMessage[] = await Promise.all(
        messagesData.map(async (msg: any) => {
          let username = 'Unknown';

          // Try to get username from user ID
          if (msg.user) {
            const userInfo = await this.getUserInfo(msg.user);
            username = userInfo?.real_name || userInfo?.name || 'Unknown';
          }
          // Fallback to username field if available
          else if (msg.username) {
            username = msg.username;
          }

          return {
            user: msg.user,
            username,
            text: msg.text,
            ts: msg.ts,
            thread_ts: msg.thread_ts,
            files: msg.files?.map((file: any) => ({
              name: file.name,
              type: file.pretty_type || file.mimetype || 'file',
              url: file.url_private || file.permalink_public,
              mimetype: file.mimetype,
            })),
          };
        })
      );

      return {
        channel: channelId,
        messages,
      };
    } catch (error) {
      console.error('Error fetching Slack messages:', error);
      return {
        channel: channelId,
        messages: [],
        error: error instanceof Error ? error.message : 'Failed to fetch Slack messages',
      };
    }
  }

  /**
   * Get user info for a Slack user ID
   */
  async getUserInfo(userId: string): Promise<{ name?: string; real_name?: string } | null> {
    try {
      if (!this.token) return null;

      const response = await axios.get(`${this.baseUrl}/users.info`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        params: {
          user: userId,
        },
      });

      if (!response.data.ok) return null;

      return {
        name: response.data.user.name,
        real_name: response.data.user.real_name,
      };
    } catch (error) {
      console.error('Error fetching Slack user info:', error);
      return null;
    }
  }
}

export default new SlackService();
