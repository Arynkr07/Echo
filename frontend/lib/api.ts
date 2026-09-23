const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface TranscriptItem {
  speaker: string;
  time: string;
  text: string;
}

export interface TaskItem {
  id: number;
  title: string;
  owner: string;
  due: string;
  done: boolean;
}

export interface MeetingSummary {
  summary: string;
  decisions: string[];
  actions: TaskItem[];
}

export interface DashboardMetrics {
  totalMeetings: number;
  transcribedPercent: number;
  totalActions: number;
  completedPercent: number;
  avgLengthMin: number;
  hoursSaved: number;
  sentimentPercent: number;
  teamEngagementPercent: number;
}

export interface Meeting {
  id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
}

export const api = {
  /** Get the most recently recorded meeting ID from the backend. */
  async getLatestMeeting(): Promise<Meeting | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/meeting`, { cache: "no-store" });
      if (!res.ok) return null;
      const meetings: Meeting[] = await res.json();
      if (!meetings.length) return null;

      // Sort descending by started_at and return the newest meeting
      return meetings.sort(
        (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      )[0];
    } catch {
      return null;
    }
  },

  /** Fetch transcript segments for a given meeting. */
  async getLiveTranscript(meetingId: string): Promise<TranscriptItem[]> {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/meeting/${meetingId}/transcript`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to fetch transcript");
      const data = await res.json();
      // Backend returns { segments: [{ speaker, time, text, ... }] }
      return (data.segments || []) as TranscriptItem[];
    } catch {
      return [];
    }
  },

  /** Fetch AI summary, decisions, and action items for a given meeting. */
  async getMeetingIntelligence(meetingId: string): Promise<MeetingSummary | null> {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/meeting/${meetingId}/summary`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to fetch meeting intelligence");
      // Backend already returns { summary, decisions, actions: [{ id, title, owner, due, done }] }
      return await res.json();
    } catch {
      return null;
    }
  },

  /** Fetch aggregate dashboard metrics. */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/metrics`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return await res.json();
    } catch {
      // Fallback stub so the dashboard still renders offline
      return {
        totalMeetings: 0,
        transcribedPercent: 0,
        totalActions: 0,
        completedPercent: 0,
        avgLengthMin: 0,
        hoursSaved: 0,
        sentimentPercent: 92,
        teamEngagementPercent: 84,
      };
    }
  },

  /** Ask a question about a specific meeting. */
  async askQuestion(meetingId: string, question: string): Promise<string> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/meeting/${meetingId}/question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error("Failed to ask question");
      const data = await res.json();
      return data.answer || "No answer returned.";
    } catch {
      return "Could not reach backend.";
    }
  },

  /** Toggle a task's done status locally (tasks are not persisted separately). */
  toggleTaskStatus(tasks: TaskItem[], taskId: number): TaskItem[] {
    return tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t));
  },
};
