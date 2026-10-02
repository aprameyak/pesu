import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAnalyticsEvent, trackEvent } from "@/lib/analytics";

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json();
  const event = typeof body.event === "string" ? body.event : "";
  if (!isAnalyticsEvent(event)) return NextResponse.json({ ok: false }, { status: 400 });
  await trackEvent(event, session?.user?.id, body.payload);
  return NextResponse.json({ ok: true });
}
