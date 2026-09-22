import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    totalMeetings: 48,
    transcribedPercent: 92,
    totalActions: 134,
    completedPercent: 66,
    avgLengthMin: 38,
    hoursSaved: 18.4,
    sentimentPercent: 92,
    teamEngagementPercent: 84
  });
}
