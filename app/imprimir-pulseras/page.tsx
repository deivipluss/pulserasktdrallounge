'use client';

import { useState, useRef } from 'react';
import Dropzone, { DropzoneOptions, FileRejection } from 'react-dropzone';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { PDFDocument, rgb } from 'pdf-lib';

// Preset de calibración por defecto
const DEFAULT_PRESET = {
  template: '', // nombre del archivo PNG
  dpi: 600,
  qrArea: { x: 1535, y: 88, w: 756, h: 756, rotation: 0 },
  qrSizeMm: 32,
  idLabel: { enabled: true, dy: 40, fontPx: 64, align: 'center' },
};

// Utilidades de conversión y detección DPI
function detectDpiFromTemplate(imgWidthPx: number, imgWidthMm: number = 204.3): number {
  return imgWidthPx / (imgWidthMm / 25.4);
}
function mmToPx(mm: number, dpi: number): number {
  return mm * dpi / 25.4;
}
function pxToMm(px: number, dpi: number): number {
  return px * 25.4 / dpi;
}

export default function ImprimirPulserasPage() {
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [preset, setPreset] = useState(DEFAULT_PRESET);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [templateImg, setTemplateImg] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Calcula el tamaño QR en px, ajusta si no cabe en el área y deja margen
  function getQrPx(qrSizeMm: number, dpi: number, areaW: number, areaH: number): { qrPx: number, finalMm: number } {
    // El QR ocupará como máximo el 80% del área disponible, pero nunca más que el tamaño en mm solicitado
    const maxPx = Math.floor(Math.min(areaW, areaH) * 0.8);
    let qrPx = Math.round(mmToPx(qrSizeMm, dpi));
    if (qrPx > maxPx) {
      qrPx = maxPx;
    }
    return { qrPx, finalMm: pxToMm(qrPx, dpi) };
  }

  // Renderiza QR sobre plantilla en canvas
  async function renderPreview(qrData: string, id: string = 'ID-1234') {
    if (!templateImg || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, templateImg.width, templateImg.height);
    ctx.drawImage(templateImg, 0, 0);
    const { x, y, w, h } = preset.qrArea;
    // El QR debe ocupar el máximo posible dentro del área blanca
    // Deja solo un pequeño margen (4 px) para el quiet zone del QR
    const qrMargin = 4;
    const qrPx = Math.min(w, h) - 2 * qrMargin;
    // Cartucho blanco ocupa toda el área definida
    const cartX = x;
    const cartY = y;
    const cartW = w;
    const cartH = h;
    // Cartucho blanco con radio
    const radius = 12;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cartX + radius, cartY);
    ctx.lineTo(cartX + cartW - radius, cartY);
    ctx.quadraticCurveTo(cartX + cartW, cartY, cartX + cartW, cartY + radius);
    ctx.lineTo(cartX + cartW, cartY + cartH - radius);
    ctx.quadraticCurveTo(cartX + cartW, cartY + cartH, cartX + cartW - radius, cartY + cartH);
    ctx.lineTo(cartX + radius, cartY + cartH);
    ctx.quadraticCurveTo(cartX, cartY + cartH, cartX, cartY + cartH - radius);
    ctx.lineTo(cartX, cartY + radius);
    ctx.quadraticCurveTo(cartX, cartY, cartX + radius, cartY);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
    // Genera QR ECC H con quiet zone
    const qrOpts = { errorCorrectionLevel: 'H' as const, margin: qrMargin, width: qrPx };
    const qrUrl: string = await QRCode.toDataURL(qrData, qrOpts);
    const qrImg = new window.Image();
    qrImg.onload = () => {
      // Centra el QR en el área blanca
      const cx = cartX + (cartW - qrPx) / 2;
      const cy = cartY + (cartH - qrPx) / 2;
      ctx.drawImage(qrImg, cx, cy, qrPx, qrPx);
      if (preset.idLabel?.enabled) {
        const fontPx = preset.idLabel.fontPx || 64;
        ctx.save();
        ctx.font = `bold ${fontPx}px sans-serif`;
        ctx.textAlign = (['left','right','center','start','end'].includes(preset.idLabel.align) ? preset.idLabel.align : 'center') as CanvasTextAlign;
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#222';
        // Posición: debajo del QR, desplazamiento dy
        const labelX = cartX + cartW / 2;
        const labelY = cy + qrPx + (preset.idLabel.dy || 40);
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
    const zip = new JSZip();
    // Renderiza cada pulsera y agrega al ZIP
    for (const row of rows) {
      // Renderiza en canvas
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
    setLoading(false);
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Imprimir Pulseras</h1>
        <div className="mb-6">
          <Dropzone accept={{'image/png': ['.png']}} onDrop={(files: File[], _fileRejections: FileRejection[]) => handleTemplateFile(files[0])} multiple={false}>
            {({getRootProps, getInputProps}: {getRootProps: any, getInputProps: any}) => (
              <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer bg-white dark:bg-gray-800">
                <input {...getInputProps()} />
                {templateFile ? (
                  <span>Plantilla cargada: {templateFile.name}</span>
                ) : (
                  <span>Arrastra o selecciona la plantilla PNG de la pulsera</span>
                )}
              </div>
            )}
          </Dropzone>
          {templateImg && (
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              <div>DPI estimado: <b>{detectDpiFromTemplate(templateImg.width, 204.3).toFixed(2)}</b></div>
              <div>Ancho px: {templateImg.width} px</div>
              <div>Ancho mm: 204.3 mm</div>
              <div>QR final: <b>{pxToMm(mmToPx(preset.qrSizeMm, preset.dpi), preset.dpi).toFixed(2)} mm</b></div>
            </div>
          )}
        </div>
        <div className="mb-6">
          <Dropzone accept={{'text/csv': ['.csv']}} onDrop={(files: File[], _fileRejections: FileRejection[]) => setCsvFile(files[0])} multiple={false}>
            {({getRootProps, getInputProps}: {getRootProps: any, getInputProps: any}) => (
              <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer bg-white dark:bg-gray-800">
                <input {...getInputProps()} />
                {csvFile ? (
                  <span>CSV cargado: {csvFile.name}</span>
                ) : (
                  <span>Arrastra o selecciona el CSV de tokens</span>
                )}
              </div>
            )}
          </Dropzone>
        </div>
        <div className="mb-6">
          <label className="block font-bold mb-2">Preset de calibración (JSON)</label>
          <textarea
            className="w-full h-40 p-2 border rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            value={JSON.stringify(preset, null, 2)}
            onChange={e => {
              try {
                setPreset(JSON.parse(e.target.value));
              } catch {}
            }}
          />
        </div>
        {/* Preview Canvas */}
        {templateImg && (
          <div className="mb-6">
            <label className="block font-bold mb-2">Vista previa QR</label>
            <canvas ref={canvasRef} width={templateImg.width} height={templateImg.height} style={{border:'1px solid #ccc', maxWidth:'100%'}} />
            <div className="flex gap-2 mt-2">
              <button
                className="px-4 py-2 bg-fiesta-purple text-white rounded"
                onClick={() => renderPreview('https://ejemplo.com/qr-demo', 'ID-1234')}
                type="button"
              >
                Renderizar QR demo
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                type="button"
                onClick={() => window.open('https://ejemplo.com/qr-demo', '_blank')}
              >
                Probar QR
              </button>
            </div>
          </div>
        )}
        {/* Botón para exportar ZIP y PDF */}
        {templateImg && csvRows.length > 0 && (
          <div className="mb-6">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded"
              disabled={loading}
              onClick={() => exportZipAndPdf(csvRows)}
              type="button"
            >
              {loading ? 'Generando ZIP...' : 'Descargar ZIP + PDF'}
            </button>
            {zipBlob && (
              <a
                href={URL.createObjectURL(zipBlob)}
                download="pulseras.zip"
                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded"
              >
                Descargar ZIP
              </a>
            )}
          </div>
        )}
        {/* TODO: Preview, Compose, Download ZIP */}
      </div>
    </div>
  );
}
