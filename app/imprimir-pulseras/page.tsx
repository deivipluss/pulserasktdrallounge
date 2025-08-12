'use client';

import { useState, useEffect, useRef } from 'react';
import Dropzone, { FileRejection } from 'react-dropzone';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { PDFDocument, rgb } from 'pdf-lib';
import { motion } from 'framer-motion';
import { 
  FileDown, 
  QrCode, 
  PanelLeft, 
  Ruler, 
  Settings, 
  AlertCircle, 
  Check,
  Download,
  FileImage,
  Upload
} from 'lucide-react';

// CONSTANTES DE LA PULSERA (Fuente única de verdad)
const WRISTBAND = {
  WIDTH_PX: 2413,
  HEIGHT_PX: 398,
  QR_AREA: {
    OFFSET_LEFT_PX: 1538,
    WIDTH_PX: 234,
    HEIGHT_PX: 234,
    BOTTOM_MARGIN_PX: 86.1,
  },
  WIDTH_MM: 204.3,
  HEIGHT_MM: 33.69
};

// Preset de calibración por defecto, calculado a partir de las constantes
const DEFAULT_PRESET = {
  dpi: 300,
  qrArea: {
    x: WRISTBAND.QR_AREA.OFFSET_LEFT_PX,
    y: WRISTBAND.HEIGHT_PX - WRISTBAND.QR_AREA.BOTTOM_MARGIN_PX - WRISTBAND.QR_AREA.HEIGHT_PX, // 398 - 86.1 - 76 = 235.9
    w: WRISTBAND.QR_AREA.WIDTH_PX,
    h: WRISTBAND.QR_AREA.HEIGHT_PX,
    rotation: 0
  },
  qrSizePx: WRISTBAND.QR_AREA.WIDTH_PX,
  idLabel: { enabled: false, dy: 0, fontPx: 18, align: 'center' }, // ID deshabilitado
};

// Utilidades
function detectDpiFromTemplate(imgWidthPx: number): number {
  return imgWidthPx / (WRISTBAND.WIDTH_MM / 25.4);
}

function mmToPx(mm: number, dpi: number): number {
  return mm * dpi / 25.4;
}

export default function ImprimirPulserasPage() {
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [preset, setPreset] = useState(DEFAULT_PRESET);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [templateImg, setTemplateImg] = useState<HTMLImageElement | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'preview' | 'calibration'>('upload');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info' | null, message: string }>({ 
    type: null, message: '' 
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (templateImg) {
      const dpi = detectDpiFromTemplate(templateImg.width);
      setPreset(prev => ({ ...prev, dpi }));
    }
  }, [templateImg]);

  useEffect(() => {
    if (templateImg) {
      renderPreview('https://ejemplo.com/qr-demo', 'ID-1234');
      setActiveTab('preview');
      setStatus({
        type: 'success',
        message: 'Plantilla cargada. QR posicionado según medidas exactas.'
      });
    }
  }, [templateImg, preset]);

  const handleTemplateFile = (file: File) => {
    setTemplateFile(file);
    const reader = new FileReader();
    reader.onload = e => {
      const img = new window.Image();
      img.onload = () => setTemplateImg(img);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
  const handleCsvFile = (file: File) => {
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        const header = lines[0].split(',');
        const idIndex = header.findIndex(h => /id/i.test(h));
        const urlIndex = header.findIndex(h => /url|link|qr/i.test(h));
        
        if (idIndex === -1 || urlIndex === -1) throw new Error('CSV debe tener columnas "id" y "url"');
        
        const rows = lines.slice(1).map(l => {
          const cols = l.split(',');
          return { id: cols[idIndex].trim(), url: cols[urlIndex].trim() };
        });
        
        setCsvRows(rows);
        setStatus({ type: 'success', message: `Se cargaron ${rows.length} registros.` });
      } catch (err) {
        setStatus({ type: 'error', message: `Error en CSV: ${err instanceof Error ? err.message : String(err)}` });
      }
    };
    reader.readAsText(file);
  };

  async function renderPreview(qrData: string, id: string) {
    if (!templateImg || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, templateImg.width, templateImg.height);
    ctx.drawImage(templateImg, 0, 0);
    
    const areaX = preset.qrArea.x;
    const areaY = preset.qrArea.y;
    const areaW = preset.qrArea.w;
    const areaH = preset.qrArea.h;
    
    const qrUrl = await QRCode.toDataURL(qrData, { 
      errorCorrectionLevel: 'L', 
      margin: 1,
      width: areaW,
      color: { dark: '#000000', light: '#ffffff' }
    });
    
    const qrImg = new window.Image();
    qrImg.onload = () => {
      ctx.drawImage(qrImg, areaX, areaY, areaW, areaH);
    };
    qrImg.src = qrUrl;
  }  async function exportZipAndPdf(rows: Array<{id: string, url: string}>) {
    if (!templateImg) return;
    
    setLoading(true);
    setStatus({ type: 'info', message: 'Generando archivos...' });
    
    const zip = new JSZip();
    
    try {
      for (const row of rows) {
        await renderPreview(row.url, row.id);
        const canvas = canvasRef.current;
        if (!canvas) continue;
        const png = canvas.toDataURL('image/png');
        zip.file(`pulsera_${row.id}.png`, png.split(',')[1], { base64: true });
      }
      
      const pdf = await composeImpositionPdf(rows);
      const pdfBytes = await pdf.save();
      zip.file('imposicion.pdf', pdfBytes);
      
      const blob = await zip.generateAsync({ type: 'blob' });
      setZipBlob(blob);
      setStatus({ type: 'success', message: 'Archivos listos para descargar.' });
    } catch (err) {
      setStatus({ type: 'error', message: `Error al generar: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setLoading(false);
    }
  }

  async function composeImpositionPdf(rows: Array<{id: string, url: string}>, config = { paper: 'A4', cols: 2, rows: 6, bleedMm: 2 }) {
    const paperSizes = { A4: { w: 210, h: 297 }, A3: { w: 297, h: 420 } };
    const paper = config.paper === 'A3' ? paperSizes.A3 : paperSizes.A4;
    const dpi = preset.dpi;
    const bleedPx = Math.round(mmToPx(config.bleedMm, dpi));
    const cellW = (templateImg?.width ?? 0) + 2 * bleedPx;
    const cellH = (templateImg?.height ?? 0) + 2 * bleedPx;
    const pdfW = Math.round(mmToPx(paper.w, dpi));
    const pdfH = Math.round(mmToPx(paper.h, dpi));
    
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([pdfW, pdfH]);
    let col = 0, row = 0;

    for (let i = 0; i < rows.length; i++) {
      await renderPreview(rows[i].url, rows[i].id);
      await new Promise(resolve => setTimeout(resolve, 50)); // Espera para renderizado
      
      const canvas = canvasRef.current;
      if (!canvas) continue;
      
      const pngBytes = await fetch(canvas.toDataURL('image/png', 1.0)).then(r => r.arrayBuffer());
      const img = await pdfDoc.embedPng(pngBytes);
      
      const x = col * cellW + bleedPx;
      const y = pdfH - ((row + 1) * cellH) + bleedPx;
      
      page.drawImage(img, { x, y, width: templateImg?.width ?? 0, height: templateImg?.height ?? 0 });
      
      col++;
      if (col >= config.cols) {
        col = 0;
        row++;
        if (row >= config.rows && i < rows.length - 1) {
          row = 0;
          page = pdfDoc.addPage([pdfW, pdfH]);
        }
      }
    }
    return pdfDoc;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="container mx-auto p-6">
        <motion.h1 
          className="text-3xl font-bold mb-2 text-gradient"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        >
          Generador de Pulseras QR
        </motion.h1>
        
        <motion.p 
          className="text-gray-300 mb-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
        >
          Sube una plantilla PNG y un archivo CSV para generar pulseras con QR.
        </motion.p>
        
        {status.type && (
          <motion.div 
            className={`mb-6 p-4 rounded-lg flex items-center ${
              status.type === 'success' ? 'bg-green-800/50 border border-green-500/30' : 
              status.type === 'error' ? 'bg-red-800/50 border border-red-500/30' :
              'bg-blue-800/50 border border-blue-500/30'
            }`}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          >
            <div className="mr-3">
              {status.type === 'success' ? <Check className="w-5 h-5 text-green-400" /> :
               status.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-400" /> :
               <PanelLeft className="w-5 h-5 text-blue-400" />}
            </div>
            <p>{status.message}</p>
          </motion.div>
        )}
        
        <div className="flex border-b border-gray-700 mb-6">
          {['upload', 'preview', 'calibration'].map((tabName, index) => (
            <button 
              key={tabName}
              className={`px-4 py-2 flex items-center gap-2 ${activeTab === tabName ? 'text-fiesta-purple border-b-2 border-fiesta-purple' : 'text-gray-400'}`}
              onClick={() => setActiveTab(tabName as any)}
              disabled={tabName !== 'upload' && !templateImg}
            >
              {index === 0 && <Upload className="w-4 h-4" />}
              {index === 1 && <QrCode className="w-4 h-4" />}
              {index === 2 && <Settings className="w-4 h-4" />}
              <span>{tabName.charAt(0).toUpperCase() + tabName.slice(1)}</span>
            </button>
          ))}
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          {activeTab === 'upload' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <FileImage className="w-5 h-5 text-fiesta-purple" />
                  <span>1. Plantilla de Pulsera (.png)</span>
                </h2>
                <Dropzone accept={{'image/png': ['.png']}} onDrop={([file]) => handleTemplateFile(file)} multiple={false}>
                  {({getRootProps, getInputProps}) => (
                    <div {...getRootProps()} className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-fiesta-purple">
                      <input {...getInputProps()} />
                      {templateFile ? (
                        <p className="text-green-400">{templateFile.name}</p>
                      ) : (
                        <p>Arrastra o haz clic para seleccionar la plantilla</p>
                      )}
                    </div>
                  )}
                </Dropzone>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <FileDown className="w-5 h-5 text-fiesta-purple" />
                  <span>2. Archivo de Datos (.csv)</span>
                </h2>
                <Dropzone accept={{'text/csv': ['.csv']}} onDrop={([file]) => handleCsvFile(file)} multiple={false}>
                  {({getRootProps, getInputProps}) => (
                    <div {...getRootProps()} className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-fiesta-purple">
                      <input {...getInputProps()} />
                      {csvFile ? (
                        <p className="text-green-400">{csvFile.name}</p>
                      ) : (
                        <p>Arrastra o haz clic para seleccionar el CSV</p>
                      )}
                    </div>
                  )}
                </Dropzone>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'preview' && templateImg && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-xl font-semibold">Vista Previa</h2>
              <div className="flex justify-center bg-gray-800/50 p-4 rounded-lg">
                <canvas ref={canvasRef} width={templateImg.width} height={templateImg.height} className="max-w-full h-auto" />
              </div>
              <div className="flex justify-center">
                <button 
                  onClick={() => exportZipAndPdf(csvRows)} 
                  disabled={!csvRows.length || loading}
                  className="bg-fiesta-purple text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-80 disabled:bg-gray-600 flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  {loading ? 'Generando...' : 'Exportar Archivos'}
                </button>
              </div>
              {zipBlob && (
                <div className="text-center mt-4">
                  <a href={URL.createObjectURL(zipBlob)} download="pulseras.zip" className="text-green-400 underline">
                    Descargar pulseras.zip
                  </a>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'calibration' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-xl font-semibold">Calibración (Valores de Referencia)</h2>
              <div className="bg-gray-800/50 p-4 rounded-lg text-sm space-y-2">
                <p><strong>DPI Detectado:</strong> {preset.dpi.toFixed(2)}</p>
                <p><strong>Posición QR (X):</strong> {preset.qrArea.x} px</p>
                <p><strong>Posición QR (Y):</strong> {preset.qrArea.y.toFixed(1)} px</p>
                <p><strong>Ancho QR:</strong> {preset.qrArea.w} px</p>
                <p><strong>Alto QR:</strong> {preset.qrArea.h} px</p>
              </div>
              <p className="text-xs text-gray-400">Estos valores se basan en las constantes del archivo y no son editables directamente en la UI.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
