'use client';

import { useState, useEffect, useRef } from 'react';
import Dropzone, { DropzoneOptions, FileRejection } from 'react-dropzone';
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

// CONSTANTES DE LA PULSERA
const WRISTBAND = {
  WIDTH_PX: 2413,  // Ancho total de la pulsera en píxeles (del pantallazo)
  HEIGHT_PX: 398,  // Alto de la pulsera en píxeles (del pantallazo)
  QR_AREA: {
    OFFSET_LEFT_PX: 1538, // Posición exacta desde la izquierda según el segundo pantallazo
    WIDTH_PX: 76,        // Ancho exacto del área del QR según el segundo pantallazo
    HEIGHT_PX: 76,       // Alto exacto del área del QR según el segundo pantallazo
    QR_SIZE_PX: 85,      // QR más grande que el área para asegurar que ocupe todo el espacio blanco
    ID_OFFSET_Y: 86.1,   // Posición Y donde va el texto ID-1234 (justo debajo del QR)
  },
  // Mantenemos las medidas en MM para compatibilidad
  WIDTH_MM: 204.3,
  HEIGHT_MM: 33.69
};

// Preset de calibración por defecto, actualizado con las medidas exactas
const DEFAULT_PRESET = {
  dpi: 300, // DPI según el valor detectado en la imagen (300.00097895252077)
  qrArea: {
    // Valores exactos según el JSON de calibración
    x: 1500, // Posición X ajustada según el JSON
    y: 100, // Posición Y desde arriba para centrar verticalmente
    w: 76, // Ancho del área según JSON
    h: 76, // Alto del área según JSON
    rotation: 0
  },
  qrSizePx: 85, // Tamaño QR en píxeles, ajustado para llenar el espacio
  idLabel: { enabled: true, dy: 130, fontPx: 28, align: 'center' }, // Ajustado según imagen para que quede por debajo del QR
};

// Utilidades de conversión y detección DPI
function detectDpiFromTemplate(imgWidthPx: number): number {
  return imgWidthPx / (WRISTBAND.WIDTH_MM / 25.4);
}

function mmToPx(mm: number, dpi: number): number {
  return mm * dpi / 25.4;
}

function pxToMm(px: number, dpi: number): number {
  return px * 25.4 / dpi;
}

// Calcula las coordenadas exactas del QR según la imagen real
function calculateQrAreaPx(templateWidth: number) {
  // Calculamos la escala entre la plantilla original y la cargada por el usuario
  const escala = templateWidth / WRISTBAND.WIDTH_PX;
  
  // Calculamos la posición centrada del QR
  const x = (WRISTBAND.QR_AREA.OFFSET_LEFT_PX - WRISTBAND.QR_AREA.WIDTH_PX / 2) * escala; // Posición izquierda del área
  const y = 100 * escala; // Posición desde arriba ajustada para centrar verticalmente
  
  return {
    x,
    y,
    w: WRISTBAND.QR_AREA.WIDTH_PX * escala,
    h: WRISTBAND.QR_AREA.HEIGHT_PX * escala,
  };
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

  // Actualiza el preset cuando se carga la imagen
  useEffect(() => {
    if (templateImg) {
      const dpi = detectDpiFromTemplate(templateImg.width);
      const qrArea = calculateQrAreaPx(templateImg.width);
      
      setPreset(prev => ({
        ...prev,
        dpi,
        qrArea: {
          ...prev.qrArea,
          x: qrArea.x,
          y: qrArea.y,
          w: qrArea.w,
          h: qrArea.h
        }
      }));

      // Renderiza una vista previa
      renderPreview('https://ejemplo.com/qr-demo', 'ID-1234');
      
      // Cambia a la pestaña de vista previa
      setActiveTab('preview');
      
      setStatus({
        type: 'success',
        message: 'Plantilla cargada correctamente. QR posicionado según medidas proporcionadas.'
      });
    }
  }, [templateImg]);

  // Cargar imagen y obtener dimensiones
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
  
  // Procesar CSV
  const handleCsvFile = (file: File) => {
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        // Omitir encabezado
        const header = lines[0].split(',');
        const idIndex = header.findIndex(h => /id/i.test(h));
        const dayIndex = header.findIndex(h => /day|día|fecha/i.test(h));
        const urlIndex = header.findIndex(h => /url|link|qr/i.test(h));
        
        if (idIndex === -1 || urlIndex === -1) {
          throw new Error('El CSV debe contener columnas para ID y URL');
        }
        
        const rows = lines.slice(1).map(l => {
          const cols = l.split(',');
          return {
            id: cols[idIndex].trim(),
            day: dayIndex > -1 ? cols[dayIndex].trim() : 'dia',
            url: cols[urlIndex].trim()
          };
        });
        
        setCsvRows(rows);
        setStatus({
          type: 'success',
          message: `Se cargaron ${rows.length} registros del CSV correctamente.`
        });
      } catch (err) {
        setStatus({
          type: 'error',
          message: `Error al procesar el CSV: ${err instanceof Error ? err.message : String(err)}`
        });
      }
    };
    reader.readAsText(file);
  };

  // Renderiza QR sobre plantilla en canvas
  async function renderPreview(qrData: string, id: string = 'ID-1234') {
    if (!templateImg || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Limpia el canvas y dibuja la plantilla
    ctx.clearRect(0, 0, templateImg.width, templateImg.height);
    ctx.drawImage(templateImg, 0, 0);
    
    // Calcular la escala proporcional
    const escala = templateImg.width / WRISTBAND.WIDTH_PX;
    
    // Aplicar escala a las dimensiones usando los valores del preset
    const areaX = preset.qrArea.x * escala;
    const areaY = preset.qrArea.y * escala;
    const areaW = preset.qrArea.w * escala;
    const areaH = preset.qrArea.h * escala;
    
    // Tamaño del QR para que ocupe todo el área blanca
    const qrMargin = 0; // Sin margen para maximizar tamaño
    const qrPx = preset.qrSizePx * escala;
    
    // Dibuja un área blanca del tamaño exacto según referencia
    ctx.save();
    ctx.beginPath();
    ctx.rect(areaX, areaY, areaW, areaH); // Rectángulo blanco exacto según referencia
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
    
    // Genera QR con nivel bajo de corrección de errores para maximizar tamaño
    const qrOpts = { errorCorrectionLevel: 'L' as const, margin: qrMargin, width: qrPx };
    const qrUrl: string = await QRCode.toDataURL(qrData, qrOpts);
    const qrImg = new window.Image();
    
    qrImg.onload = () => {
      // Centra perfectamente el QR en el área blanca, con un pequeño ajuste para cubrir completamente el área
      const cx = areaX + (areaW - qrPx) / 2;
      const cy = areaY + (areaH - qrPx) / 2;
      ctx.drawImage(qrImg, cx, cy, qrPx, qrPx);
      
      // Dibuja el ID debajo del área blanca
      if (preset.idLabel?.enabled) {
        const fontPx = preset.idLabel.fontPx * escala; // Usar tamaño definido en el preset
        ctx.save();
        ctx.font = `bold ${fontPx}px sans-serif`;
        ctx.textAlign = (preset.idLabel.align || 'center') as CanvasTextAlign;
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#222222';
        
        // Posición del ID debajo del área blanca según la configuración
        const labelX = areaX + areaW / 2;
        const labelY = areaY + (preset.idLabel.dy * escala / 6); // Ajustado según dy
        ctx.fillText(id, labelX, labelY);
        ctx.restore();
      }
    };
    
    qrImg.src = qrUrl;
  }

  // Exporta ZIP con PNGs y PDF de imposición
  async function exportZipAndPdf(rows: Array<{id: string, day: string, url: string}>) {
    if (!templateImg) return;
    
    setLoading(true);
    setStatus({
      type: 'info',
      message: 'Generando archivos para impresión...'
    });
    
    const zip = new JSZip();
    
    try {
      // Renderiza cada pulsera y agrega al ZIP
      for (const row of rows) {
        await renderPreview(row.url, row.id);
        const canvas = canvasRef.current;
        if (!canvas) continue;
        const png = canvas.toDataURL('image/png');
        const data = png.split(',')[1];
        zip.file(`pulsera_${row.day}_${row.id}.png`, data, {base64: true});
      }
      
      // PDF de imposición
      const pdf = await composeImpositionPdf(rows);
      const pdfBytes = await pdf.save();
      zip.file('imposicion.pdf', pdfBytes);
      
      const blob = await zip.generateAsync({type:'blob'});
      setZipBlob(blob);
      
      setStatus({
        type: 'success',
        message: 'Archivos generados correctamente. Listo para descargar.'
      });
    } catch (err) {
      setStatus({
        type: 'error',
        message: `Error al generar los archivos: ${err instanceof Error ? err.message : String(err)}`
      });
    } finally {
      setLoading(false);
    }
  }

  // Composición de PDF de imposición (A4/A3 configurable)
  async function composeImpositionPdf(rows: Array<{id: string, day: string, url: string}>, config = {paper: 'A4', cols: 2, rows: 6, bleedMm: 2}) {
    // Medidas papel en mm
    const paperSizes = {A4: {w: 210, h: 297}, A3: {w: 297, h: 420}};
    const paperKey = (typeof config.paper === 'string' && ['A4','A3'].includes(config.paper)) ? config.paper : 'A4';
    const paper = paperKey === 'A3' ? paperSizes.A3 : paperSizes.A4;
    const dpi = preset.dpi;
    const bleedPx = Math.round(mmToPx(config.bleedMm, dpi));
    const cellW = Number(templateImg?.width ?? 0) + 2 * bleedPx;
    const cellH = Number(templateImg?.height ?? 0) + 2 * bleedPx;
    const pdfW = Math.round(mmToPx(paper.w, dpi));
    const pdfH = Math.round(mmToPx(paper.h, dpi));
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([pdfW, pdfH]);
    let col = 0, row = 0;
    for (let i = 0; i < rows.length; i++) {
      // Renderiza pulsera
      await renderPreview(rows[i].url, rows[i].id);
      
      // Importante: esperar a que el QR se renderice completamente
      // La generación del QR es asíncrona pero no devuelve una promesa
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = canvasRef.current;
      if (!canvas) continue;
      
      const pngBytes = await fetch(canvas.toDataURL('image/png')).then(r => r.arrayBuffer());
      const img = await pdfDoc.embedPng(pngBytes);
      const x = Number(col * cellW + bleedPx);
      const y = Number(pdfH - ((row + 1) * cellH) + bleedPx);
      page.drawImage(img, {
        x,
        y,
        width: Number(templateImg?.width ?? 0),
        height: Number(templateImg?.height ?? 0)
      });
      // Marcas de corte
      page.drawLine({
        start: {x: Number(col * cellW), y: Number(pdfH - row * cellH)},
        end: {x: Number((col+1)*cellW), y: Number(pdfH - row * cellH)},
        color: rgb(0,0,0), thickness: 0.5
      });
      page.drawLine({
        start: {x: Number(col * cellW), y: Number(pdfH - row * cellH)},
        end: {x: Number(col*cellW), y: Number(pdfH - (row+1)*cellH)},
        color: rgb(0,0,0), thickness: 0.5
      });
      // Siguiente celda
      col++;
      if (col >= config.cols) {
        col = 0;
        row++;
        if (row >= config.rows) {
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Generador de Pulseras QR
        </motion.h1>
        
        <motion.p 
          className="text-gray-300 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Sube una plantilla de pulsera y un CSV de datos para generar pulseras personalizadas con códigos QR.
        </motion.p>
        
        {/* Barra de estado */}
        {status.type && (
          <motion.div 
            className={`mb-6 p-4 rounded-lg flex items-center ${
              status.type === 'success' ? 'bg-green-800/50 border border-green-500/30' : 
              status.type === 'error' ? 'bg-red-800/50 border border-red-500/30' :
              'bg-blue-800/50 border border-blue-500/30'
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mr-3">
              {status.type === 'success' ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : status.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-400" />
              ) : (
                <PanelLeft className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <p>{status.message}</p>
          </motion.div>
        )}
        
        {/* Pestañas */}
        <div className="flex border-b border-gray-700 mb-6">
          <button 
            className={`px-4 py-2 ${activeTab === 'upload' ? 'text-fiesta-purple border-b-2 border-fiesta-purple' : 'text-gray-400'}`}
            onClick={() => setActiveTab('upload')}
          >
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span>Cargar Archivos</span>
            </div>
          </button>
          <button 
            className={`px-4 py-2 ${activeTab === 'preview' ? 'text-fiesta-purple border-b-2 border-fiesta-purple' : 'text-gray-400'}`}
            onClick={() => setActiveTab('preview')}
            disabled={!templateImg}
          >
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              <span>Vista Previa</span>
            </div>
          </button>
          <button 
            className={`px-4 py-2 ${activeTab === 'calibration' ? 'text-fiesta-purple border-b-2 border-fiesta-purple' : 'text-gray-400'}`}
            onClick={() => setActiveTab('calibration')}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Calibración</span>
            </div>
          </button>
        </div>
        
        {/* Contenido por pestañas */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          {/* Cargar archivos */}
          {activeTab === 'upload' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <FileImage className="w-5 h-5 text-fiesta-purple" />
                  <span>Plantilla de Pulsera</span>
                </h2>
                <Dropzone 
                  accept={{'image/png': ['.png']}} 
                  onDrop={(files: File[], _: FileRejection[]) => handleTemplateFile(files[0])} 
                  multiple={false}
                >
                  {({getRootProps, getInputProps}) => (
                    <div 
                      {...getRootProps()} 
                      className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer transition-all hover:border-fiesta-purple"
                    >
                      <input {...getInputProps()} />
                      {templateFile ? (
                        <div className="flex flex-col items-center">
                          <div className="w-64 h-32 bg-gray-800 rounded-lg overflow-hidden mb-3">
                            <img 
                              src={URL.createObjectURL(templateFile)} 
                              alt="Vista previa" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="text-green-400 font-medium">{templateFile.name}</span>
                          <span className="text-xs text-gray-400 mt-1">Haz clic para cambiar</span>
                        </div>
                      ) : (
                        <div className="py-8">
                          <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                          <p className="text-gray-300">Arrastra o haz clic para seleccionar la plantilla PNG</p>
                          <p className="text-xs text-gray-500 mt-2">Formato recomendado: 4820 x 795 px (204.3 x 33.69 mm @ 600dpi)</p>
                        </div>
                      )}
                    </div>
                  )}
                </Dropzone>
                {templateImg && (
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div className="bg-gray-800/50 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <Ruler className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-300">Dimensiones:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 text-gray-400">
                        <div>Ancho: <span className="text-white">{templateImg.width} px</span></div>
                        <div>Alto: <span className="text-white">{templateImg.height} px</span></div>
                        <div>Ancho: <span className="text-white">{WRISTBAND.WIDTH_MM} mm</span></div>
                        <div>Alto: <span className="text-white">{WRISTBAND.HEIGHT_MM} mm</span></div>
                      </div>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <QrCode className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-300">Posición QR:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 text-gray-400">
                        <div>DPI: <span className="text-white">{detectDpiFromTemplate(templateImg.width).toFixed(2)}</span></div>
                        <div>QR: <span className="text-white">{preset.qrSizePx}px</span></div>
                        <div>Área QR X: <span className="text-white">{Math.round(preset.qrArea.x)}px</span></div>
                        <div>Área QR Y: <span className="text-white">{Math.round(preset.qrArea.y)}px</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <FileDown className="w-5 h-5 text-fiesta-purple" />
                  <span>Archivo CSV</span>
                </h2>
                <Dropzone 
                  accept={{'text/csv': ['.csv']}} 
                  onDrop={(files: File[], _: FileRejection[]) => handleCsvFile(files[0])} 
                  multiple={false}
                >
                  {({getRootProps, getInputProps}) => (
                    <div 
                      {...getRootProps()} 
                      className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer transition-all hover:border-fiesta-purple"
                    >
                      <input {...getInputProps()} />
                      {csvFile ? (
                        <div className="flex flex-col items-center py-4">
                          <FileDown className="w-8 h-8 text-fiesta-purple mb-2" />
                          <span className="text-green-400 font-medium">{csvFile.name}</span>
                          <span className="text-xs text-gray-400 mt-1">CSV con {csvRows.length} registros</span>
                          <span className="text-xs text-gray-400">Haz clic para cambiar</span>
                        </div>
                      ) : (
                        <div className="py-8">
                          <FileDown className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                          <p className="text-gray-300">Arrastra o haz clic para seleccionar el CSV de tokens</p>
                          <p className="text-xs text-gray-500 mt-2">El archivo debe tener columnas para ID y URL</p>
                        </div>
                      )}
                    </div>
                  )}
                </Dropzone>
                {csvRows.length > 0 && (
                  <div className="mt-4 bg-gray-800/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">{csvRows.length} registros cargados</span>
                      <div className="text-xs text-gray-400">
                        Ejemplo: <span className="bg-gray-700 px-2 py-1 rounded font-mono">{csvRows[0]?.id}</span> → <span className="bg-gray-700 px-2 py-1 rounded font-mono truncate max-w-xs inline-block">{csvRows[0]?.url}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          
          {/* Vista previa */}
          {activeTab === 'preview' && templateImg && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center">
                <h2 className="text-xl font-semibold mb-4">Vista Previa del QR</h2>
                
                <div className="relative w-full overflow-auto bg-gray-800/50 rounded-lg p-4">
                  <canvas 
                    ref={canvasRef} 
                    width={templateImg.width} 
                    height={templateImg.height} 
                    className="max-w-full mx-auto border border-gray-700 rounded-lg"
                  />
                  
                  <div className="absolute top-2 right-2 bg-black/70 text-xs text-gray-300 px-2 py-1 rounded">
                    {templateImg.width} x {templateImg.height} px
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 mt-6">
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-fiesta-purple to-fiesta-blue text-white rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
                    onClick={() => renderPreview('https://ejemplo.com/qr-demo', 'ID-1234')}
                    type="button"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Renderizar QR Demo</span>
                  </button>
                  
                  {csvRows.length > 0 && (
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-fiesta-teal to-fiesta-blue text-white rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
                      onClick={() => renderPreview(csvRows[0].url, csvRows[0].id)}
                      type="button"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Renderizar Primer QR del CSV</span>
                    </button>
                  )}
                  
                  {templateImg && csvRows.length > 0 && (
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-fiesta-blue to-fiesta-teal text-white rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                      disabled={loading}
                      onClick={() => exportZipAndPdf(csvRows)}
                      type="button"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Generando...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Generar ZIP + PDF</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  {zipBlob && (
                    <a
                      href={URL.createObjectURL(zipBlob)}
                      download="pulseras.zip"
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar ZIP</span>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Calibración */}
          {activeTab === 'calibration' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-semibold mb-4">Calibración Avanzada</h2>
                
                <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-200">Medidas de la pulsera</span>
                    <div className="text-xs text-gray-400 bg-black/30 px-2 py-1 rounded">
                      {WRISTBAND.WIDTH_MM} × {WRISTBAND.HEIGHT_MM} mm
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h3 className="text-gray-300 mb-2">Posición del QR</h3>
                      <div className="space-y-1 text-gray-400">
                        <div>Distancia desde izquierda: <span className="text-white">{WRISTBAND.QR_AREA.OFFSET_LEFT_PX} px</span></div>
                        <div>Posición X: <span className="text-white">{WRISTBAND.QR_AREA.OFFSET_LEFT_PX} px</span></div>
                        <div>Tamaño área: <span className="text-white">{WRISTBAND.QR_AREA.WIDTH_PX}x{WRISTBAND.QR_AREA.HEIGHT_PX} px</span></div>
                        <div>Tamaño del QR: <span className="text-white">{WRISTBAND.QR_AREA.QR_SIZE_PX} px</span></div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-gray-300 mb-2">Valores en Píxeles</h3>
                      <div className="space-y-1 text-gray-400">
                        {templateImg && (
                          <>
                            <div>DPI detectado: <span className="text-white">{detectDpiFromTemplate(templateImg.width).toFixed(2)}</span></div>
                            <div>X: <span className="text-white">{preset.qrArea.x.toFixed(0)} px</span></div>
                            <div>Y: <span className="text-white">{preset.qrArea.y.toFixed(0)} px</span></div>
                            <div>Ancho: <span className="text-white">{preset.qrArea.w.toFixed(0)} px</span></div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <details className="bg-gray-800/30 rounded-lg p-4 text-sm">
                  <summary className="cursor-pointer text-gray-300 font-medium">Editar JSON de calibración avanzada</summary>
                  <div className="mt-4">
                    <textarea
                      className="w-full h-60 p-3 border rounded bg-black/50 text-gray-200 font-mono text-sm"
                      value={JSON.stringify(preset, null, 2)}
                      onChange={e => {
                        try {
                          const newPreset = JSON.parse(e.target.value);
                          setPreset(newPreset);
                          if (templateImg) {
                            renderPreview('https://ejemplo.com/qr-demo', 'ID-1234');
                          }
                        } catch {}
                      }}
                    />
                    <p className="mt-2 text-gray-400">Modifica los valores con precaución. Los cambios se aplicarán inmediatamente.</p>
                  </div>
                </details>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
