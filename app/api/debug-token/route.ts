import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/app/lib/env';
import crypto from 'crypto';
import { validateSignedToken } from '@/app/lib/token-utils';

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const id = url.searchParams.get('id');
  const sig = url.searchParams.get('sig');
  if (!id || !sig) {
    return NextResponse.json({ ok: false, error: 'missing id or sig' }, { status: 400 });
  }
  const current = crypto.createHmac('sha256', env.SIGNING_SECRET).update(id).digest('hex');
  const legacyCandidates: string[] = [];
  // Intentar reconstruir posibles combinaciones legacy mínimas (heurística)
  // Nota: la validación real en validateSignedToken carga metadatos CSV; aquí solo mostramos current.
  const valid = validateSignedToken(id, sig);
  return NextResponse.json({
    ok: true,
    id,
    providedSigHead: sig.slice(0, 16),
    providedLen: sig.length,
    currentSigHead: current.slice(0, 16),
    matchCurrent: sig === current,
    legacyChecked: legacyCandidates.length > 0,
    valid,
    envSecretLen: env.SIGNING_SECRET.length,
  });
}
