import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import dayjs from 'dayjs';
import { parse } from 'csv-parse/sync';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extensiones de dayjs para manejo de zonas horarias
dayjs.extend(utc);
dayjs.extend(timezone);

// Zona horaria del evento
const EVENT_TZ = process.env.NEXT_PUBLIC_EVENT_TZ || 'America/Lima';

// Tipo para la respuesta de tokens
interface TokenEntry {
  id: string;
  prize: number;
  used: boolean;
}

// Tipo para los registros CSV de tokens
interface TokenRecord {
  id: string;
  day: string;
  prize: string;
  sig: string;
  url: string;
}

/**
 * Obtiene información de un token específico por su ID
 * @param id ID del token a buscar
 */
async function getTokenById(id: string): Promise<NextResponse> {
  // Extraer la fecha del ID (formato esperado: ktd-YYYY-MM-DD-XXX)
  const dateMatch = id.match(/ktd-(\d{4}-\d{2}-\d{2})-\d+/);
  if (!dateMatch) {
    return NextResponse.json(
      { success: false, error: 'Formato de ID inválido' },
      { status: 400 }
    );
  }

  const tokenDate = dateMatch[1];
  const csvFilePath = path.join(process.cwd(), 'tokens', `${tokenDate}.csv`);
  
  // Verificar si existe el archivo CSV
  if (!fs.existsSync(csvFilePath)) {
    console.error(`Archivo de tokens no encontrado: ${csvFilePath}`);
    return NextResponse.json(
      { success: false, error: 'Tokens no encontrados para esta fecha' },
      { status: 404 }
    );
  }

  try {
    // Leer el archivo CSV
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    }) as TokenRecord[];

    // Buscar el token específico
    const tokenRecord = records.find((record: TokenRecord) => record.id === id);
    if (!tokenRecord) {
      console.log(`Token no encontrado en CSV: ${id}`);
      return NextResponse.json(
        { success: false, error: 'Token no encontrado' },
        { status: 404 }
      );
    }

    // Devolver información relevante del token
    return NextResponse.json({
      success: true,
      id: tokenRecord.id,
      day: tokenRecord.day,
      prize: tokenRecord.prize
    });
  } catch (error) {
    console.error('Error al procesar archivo de tokens:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar tokens' },
      { status: 500 }
    );
  }
}

// Manejo de solicitudes GET para listar tokens o obtener información de un token específico
export async function GET(request: NextRequest) {
  // Verificar si se solicita un token específico por ID
  const id = request.nextUrl.searchParams.get('id');
  
  if (id) {
    return getTokenById(id);
  }
  
  // Para listar todos los tokens, verificar token de administrador
  const token = request.nextUrl.searchParams.get('token');
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-token-2025';
  
  if (!token || token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  
  // Obtener día solicitado o usar el día actual
  const day = request.nextUrl.searchParams.get('day') || 
              dayjs().tz(EVENT_TZ).format('YYYY-MM-DD');
  
  try {
    // Directorio donde se almacenan los archivos de tokens
    const dataDir = path.join(process.cwd(), 'data', 'tokens');
    
    // Nombre de archivo basado en la fecha
    const filename = `tokens_${day}.csv`;
    const filePath = path.join(dataDir, filename);
    
    // Verificar si existe el archivo
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ 
        error: 'No hay datos para esta fecha',
        day 
      }, { status: 404 });
    }
    
    // Leer y parsear el archivo CSV
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    }) as TokenRecord[];
    
    // Obtener estado de uso de cada token desde localStorage
    // Aquí solo devolvemos todos como "no utilizados" ya que
    // el estado real de uso se consulta desde el lado del cliente
    const tokens: TokenEntry[] = records.map((record: TokenRecord) => ({
      id: record.id,
      prize: parseInt(record.prize, 10) || 0,
      used: false
    }));
    
    return NextResponse.json({
      day,
      count: tokens.length,
      tokens
    });
    
  } catch (error) {
    console.error('Error al procesar tokens:', error);
    return NextResponse.json({ 
      error: 'Error al procesar la solicitud',
      day 
    }, { status: 500 });
  }
}
