#!/usr/bin/env ts-node
/**
 * test-verify-csv.ts
 * Lectura rápida del CSV generado para verificar distribución esperada.
 */

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const EXPECTED = { trident: 16, cigarrillos: 16, cerebritos: 16, popcorn: 16, agua: 16, chupetines: 24 } as const;

function verifyCsv(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
  const rows = parsed.data as Array<Record<string, string>>;

  // headers exactos
  const headers = (parsed.meta.fields || []).join(',');
  if (headers !== 'id,day,prize,sig,url') {
    throw new Error(`Encabezados inesperados: ${headers}`);
  }

  const counts: Record<string, number> = { trident: 0, cigarrillos: 0, cerebritos: 0, popcorn: 0, agua: 0, chupetines: 0 };
  let unknown = 0;

  for (const r of rows) {
    const prize = (r.prize || '').trim();
    if (prize in counts) counts[prize]++;
    else unknown++;
  }

  const total = rows.length;
  const expectedTotal = Object.values(EXPECTED).reduce((a, b) => a + b, 0);

  const mismatches = Object.entries(EXPECTED).filter(([k, v]) => counts[k] !== v);

  return { total, expectedTotal, counts, mismatches, unknown };
}

function main() {
  const day = process.argv[2];
  if (!day) {
    console.error('Uso: ts-node scripts/test-verify-csv.ts YYYY-MM-DD');
    process.exit(1);
  }
  const filePath = path.join(process.cwd(), 'tokens', `${day}.csv`);
  if (!fs.existsSync(filePath)) {
    console.error(`No existe: ${filePath}`);
    process.exit(1);
  }

  const res = verifyCsv(filePath);
  console.log('Conteos:', res.counts);
  if (res.unknown > 0) console.error(`Desconocidos: ${res.unknown}`);
  if (res.total !== res.expectedTotal || res.mismatches.length > 0) {
    console.error('Distribución inválida:', res);
    process.exit(2);
  }
  console.log('OK: distribución válida');
}

if (require.main === module) {
  main();
}

export {};
