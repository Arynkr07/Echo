import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    session: "Weekly Sync #4",
    pipeline: "Whisper STT Local",
    active: true,
  });
}
