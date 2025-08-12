import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || '2025-08-12';
  const tokenId = searchParams.get('tokenId');
  
  try {
    // Get the path to the public directory
    const publicDir = path.join(process.cwd(), 'public');
    const csvPath = path.join(publicDir, 'tokens', `${date}.csv`);
    
    // Check if file exists
    const fileExists = fs.existsSync(csvPath);
    if (!fileExists) {
      return NextResponse.json({ 
        error: 'CSV file not found',
        csvPath,
        publicDir,
        checkedPath: csvPath
      }, { status: 404 });
    }
    
    // Read the file
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split('\n');
    
    // If tokenId is provided, search for it
    if (tokenId) {
      let matchingLine = null;
      for (const line of lines) {
        if (line.startsWith(tokenId)) {
          const fields = line.split(',');
          if (fields.length >= 3) {
            matchingLine = {
              id: fields[0],
              date: fields[1],
              prize: fields[2]
            };
            break;
          }
        }
      }
      
      if (matchingLine) {
        return NextResponse.json({
          success: true,
          token: matchingLine,
          fileExists,
          lineCount: lines.length
        });
      } else {
        return NextResponse.json({
          error: 'Token not found in CSV',
          fileExists,
          lineCount: lines.length
        }, { status: 404 });
      }
    }
    
    // Return general file info
    return NextResponse.json({
      success: true,
      fileExists,
      lineCount: lines.length,
      sampleLines: lines.slice(0, 3)
    });
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      message: 'Error accessing CSV file'
    }, { status: 500 });
  }
}
