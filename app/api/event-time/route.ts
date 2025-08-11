import { NextResponse } from 'next/server';
import { getEventTZ, getTimeUntilEvent } from '@/app/lib/env';

export async function GET() {
  const timeUntilEvent = getTimeUntilEvent();
  const eventTZ = getEventTZ();

  return NextResponse.json({
    eventTZ,
    timeUntilEvent,
    serverTime: new Date().toISOString(),
  });
}
