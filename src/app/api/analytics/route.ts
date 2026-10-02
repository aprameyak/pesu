import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { trackEvent, type AnalyticsEventName } from "@/lib/analytics";

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json();
  const event = body.event as AnalyticsEventName;
  if (!event) return NextResponse.json({ ok: false }, { status: 400 });
  await trackEvent(event, session?.user?.id, body.payload);
  return NextResponse.json({ ok: true });
}
