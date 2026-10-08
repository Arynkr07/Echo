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

let currentUserId =
  typeof window !== "undefined"
    ? localStorage.getItem("echo_user_id") || "anonymous"
    : "anonymous";

export const setApiUser = (uid: string) => {
  currentUserId = uid;
  // Also save to localStorage so the Chrome Extension content script can read it
  if (typeof window !== "undefined") {
    localStorage.setItem("echo_user_id", uid);
  }
};

const getHeaders = () => {
  const uid =
    currentUserId !== "anonymous"
      ? currentUserId
      : typeof window !== "undefined"
      ? localStorage.getItem("echo_user_id") || "anonymous"
      : "anonymous";
  return {
    "Content-Type": "application/json",
    "x-user-id": uid,
  };
};

export const api = {
  /** Get all meetings from the backend, sorted newest first. */
  async getAllMeetings(): Promise<Meeting[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/meeting`, {
        headers: getHeaders(),
        cache: "no-store",
      });
      if (!res.ok) return [];
      const meetings: Meeting[] = await res.json();
      return meetings.sort(
        (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );
    } catch {
      return [];
    }
  },

  /** Get the most recently recorded meeting ID from the backend. */
  async getLatestMeeting(): Promise<Meeting | null> {
    const meetings = await this.getAllMeetings();
    return meetings.length > 0 ? meetings[0] : null;
  },

  /** Fetch transcript segments for a given meeting. */
  async getLiveTranscript(meetingId: string): Promise<TranscriptItem[]> {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/meeting/${meetingId}/transcript`,
        { headers: getHeaders(), cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to fetch transcript");
      const data = await res.json();
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
        { headers: getHeaders(), cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to fetch meeting intelligence");
      return await res.json();
    } catch {
      return null;
    }
  },

  /** Fetch aggregate dashboard metrics. */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/metrics`, { headers: getHeaders(), cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return await res.json();
    } catch {
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
        headers: getHeaders(),
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error("Failed to ask question");
      const data = await res.json();
      return data.answer || "No answer returned.";
    } catch {
      return "Could not reach backend.";
    }
  },

  /** Delete a meeting. */
  async deleteMeeting(meetingId: string): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/meeting/${meetingId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /** Toggle a task's done status locally (tasks are not persisted separately). */
  toggleTaskStatus(tasks: TaskItem[], taskId: number): TaskItem[] {
    return tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t));
  },
};
