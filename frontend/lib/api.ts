const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface TranscriptItem {
  id?: string;
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

export const api = {
  // 1. Fetch real-time transcript stream for the active session
  async getLiveTranscript(sessionId: string = "default"): Promise<TranscriptItem[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/meetings/${sessionId}/transcript`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch transcript");
      return await res.json();
    } catch {
      // Fallback stub for offline dev
      return [
        { speaker: "Rahul", time: "10:32 AM", text: "Let us lock down the core deliverables for the upcoming milestone." },
        { speaker: "Aryan", time: "10:34 AM", text: "Backend API endpoints and the Whisper ingestion stream will be operational by Oct 5." },
        { speaker: "Rahul", time: "10:36 AM", text: "Understood. I will align presentation assets and slide reviews for Oct 8." },
      ];
    }
  },

async getMeetingIntelligence(sessionId: string = "default"): Promise<MeetingSummary> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/meetings/${sessionId}/summary`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch meeting intelligence");
      return await res.json();
    } catch {
      return {
        summary: "The core roadmap milestones are confirmed. Priority is placed on concluding the WebSocket ingestion bridge and the local Faster-Whisper pipeline by October 5.",
        decisions: [
          "MVP target release scheduled for October 15.",
          "All audio processing executes locally with zero external stream leaks."
        ],
        actions: [
          { id: 1, title: "Finalize Whisper STT chunk pipeline", owner: "Aryan", due: "Oct 5", done: true },
          { id: 2, title: "Prepare architecture presentation deck", owner: "Rahul", due: "Oct 8", done: false },
        ]
      };
    }
  },

async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/metrics`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return await res.json();
    } catch {
      return {
        totalMeetings: 48,
        transcribedPercent: 92,
        totalActions: 134,
        completedPercent: 66,
        avgLengthMin: 38,
        hoursSaved: 18.4,
        sentimentPercent: 92,
        teamEngagementPercent: 84
      };
    }
  },

async toggleTaskStatus(taskId: number, completed: boolean): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: completed }),
      });
      return res.ok;
    } catch {
      return true;
    }
  }
};
