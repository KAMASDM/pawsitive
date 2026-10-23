// OCR assets are served by Pawppy. The selected file never leaves this device.
export async function readDocument(file, onProgress = () => {}) {
  if (!file || file.size > 10 * 1024 * 1024 || !/^(image\/(jpeg|png|webp)|application\/pdf|text\/plain)$/.test(file.type)) throw new Error('Choose a JPEG, PNG, WebP, PDF or text file up to 10 MB.');
  if (file.type === 'text/plain') return (await file.text()).slice(0, 60000);
  let worker, pdf, pdfTask, scan;
  const recognize = async image => {
    if (!worker) {
      const { createWorker } = await import('tesseract.js');
      worker = await createWorker('eng', 1, { workerPath: '/document-reader/v1/worker.min.js', workerBlobURL: false, corePath: '/document-reader/v1', langPath: '/document-reader/v1', logger: message => onProgress(message.status === 'recognizing text' ? `Reading text… ${Math.round((message.progress || 0) * 100)}%` : 'Preparing the reader…') });
    }
    return (await worker.recognize(image)).data.text;
  };
  try {
    if (file.type !== 'application/pdf') {
      // Bound the pixels sent to WebAssembly on phones. Original camera files
      // can contain tens of megapixels even when their compressed size is small.
      const url = URL.createObjectURL(file);
      try {
        const image = new Image(); image.src = url; await image.decode();
        const scale = Math.min(1, 2400 / Math.max(image.naturalWidth, image.naturalHeight));
        scan = document.createElement('canvas'); scan.width = Math.max(1, Math.round(image.naturalWidth * scale)); scan.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const ctx = scan.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, scan.width, scan.height); ctx.drawImage(image, 0, 0, scan.width, scan.height);
      } finally { URL.revokeObjectURL(url); }
      return (await recognize(scan)).slice(0, 60000);
    }
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
    pdfTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false, stopAtErrors: true });
    pdf = await pdfTask.promise;
    if (pdf.numPages > 5) throw new Error('Choose a PDF with up to five pages, or upload the vaccination pages separately.');
    const pages = [];
    for (let index = 1; index <= pdf.numPages; index++) {
      onProgress(`Reading page ${index} of ${pdf.numPages}…`);
      const page = await pdf.getPage(index);
      const content = await page.getTextContent();
      let text = content.items.map(item => `${item.str || ''}${item.hasEOL ? '\n' : ' '}`).join('');
      if (text.trim().length < 20) {
        const original = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(2, 1800 / Math.max(original.width, original.height)) });
        const canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        text = await recognize(canvas); canvas.width = canvas.height = 0;
      }
      pages.push(text.slice(0, 12000)); page.cleanup();
    }
    return pages.join('\n\n');
  } finally { if (scan) scan.width = scan.height = 0; await worker?.terminate(); await pdfTask?.destroy(); }
}
export async function smallPhoto(file) {
  if (!file || file.size > 10 * 1024 * 1024 || !/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Choose a JPEG, PNG or WebP photo up to 10 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url; await image.decode();
    const scale = Math.min(1, 900 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    let quality = .8, result;
    do { result = canvas.toDataURL('image/jpeg', quality); quality -= .15; } while (result.length > 340000 && quality > .15);
    if (result.length > 350000) throw new Error('This photo is too detailed. Try a smaller photo.');
    return result;
  } finally { URL.revokeObjectURL(url); }
}
