import html2canvas from "html2canvas";

/**
 * Renders an off-screen React ref to a PNG blob URL.
 * @param {React.RefObject} ref  - a ref mounted on the card div
 * @param {string} filename      - suggested download filename (no extension)
 * @returns {Promise<string>}    - blob URL string
 */
export async function generateShareImage(ref, filename = "pawppy-share") {
  if (!ref?.current) throw new Error("ref.current is null");

  const canvas = await html2canvas(ref.current, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    logging: false,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("canvas.toBlob returned null")); return; }
      resolve(URL.createObjectURL(blob));
    }, "image/png");
  });
}

/**
 * Triggers a browser download from a blob URL.
 */
export function downloadBlobUrl(blobUrl, filename = "pawppy-share.png") {
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
