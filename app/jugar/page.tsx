// Note: No 'use client' here, this is a Server Component.
import JugarClientWrapper from "./JugarClient";
import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function getPrizeForToken(
  id: string
): Promise<{ prize?: string; error?: string }> {
  if (!id || typeof id !== "string") {
    return { error: "El ID del token es inválido." };
  }

  // The token ID format is ktd-YYYY-MM-DD-NNN
  const dateMatch = id.match(/ktd-(\d{4}-\d{2}-\d{2})-\d+/);
  if (!dateMatch || !dateMatch[1]) {
    return { error: "Formato de ID de token inválido. No se pudo extraer la fecha." };
  }
  const dateString = dateMatch[1];

  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "tokens",
      `${dateString}.csv`
    );

    let fileContent;
    try {
      fileContent = await fs.readFile(filePath, "utf-8");
    } catch (e) {
      return { error: `No se encontró el archivo de premios para la fecha ${dateString}. Contacta a un organizador.` };
    }

    const records = parse(fileContent, {
      columns: false, // CSV has no headers, format is: token,timestamp,prize
      skip_empty_lines: true,
    });

    // Find the record where the first column matches the token ID
    const record = records.find((r: any) => r[0] === id);

    if (!record) {
      return { error: "Tu token no se encontró en la lista de premios de hoy." };
    }

    // The prize is in the third column (index 2)
    return { prize: record[2] };
  } catch (error) {
    console.error("Error processing token:", error);
    return { error: "Ocurrió un error crítico al procesar tu solicitud." };
  }
}

export default async function JugarPage({ searchParams }: PageProps) {
  const id = searchParams?.id as string | undefined;
  let prize: string | undefined;
  let error: string | undefined;

  if (id) {
    const result = await getPrizeForToken(id);
    prize = result.prize;
    error = result.error;
  } else {
    error = "ID de token no proporcionado. Por favor, escanea el QR de tu pulsera.";
  }

  return (
    <JugarClientWrapper id={id || ""} predefinedPrize={prize} error={error} />
  );
}