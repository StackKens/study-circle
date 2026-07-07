// MAX_FILE_SIZE for downloaded content (10 MB)
const MAX_DOWNLOAD_SIZE = 10 * 1024 * 1024;

// MAX_CONTENT_LENGTH stored in the database
const MAX_STORED_LENGTH = 5000;

type ExtractResult = {
  content: string;
  method: "pdf" | "document" | "none";
};

export async function extractTextFromUrl(
  url: string,
  fileType: string,
): Promise<ExtractResult | null> {
  if (fileType !== "pdf" && fileType !== "document") {
    return null;
  }

  try {
    const buffer = await downloadWithLimit(url, MAX_DOWNLOAD_SIZE);
    if (!buffer) return null;

    if (fileType === "pdf") {
      return extractFromPdf(buffer);
    }

    return extractFromDocument(buffer);
  } catch (err) {
    console.error(`content-extractor error for ${url}:`, err);
    return null;
  }
}

function truncate(text: string, maxLen = MAX_STORED_LENGTH): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "\n\n[...truncated]";
}

async function downloadWithLimit(
  url: string,
  maxBytes: number,
): Promise<Buffer | null> {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "StudyCircle/1.0" },
  });

  if (!response.ok) {
    console.warn(`content-extractor: download failed (${response.status}) for ${url}`);
    return null;
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    console.warn(`content-extractor: file too large (${contentLength} bytes) for ${url}`);
    return null;
  }

  const chunks: Buffer[] = [];
  let total = 0;

  if (!response.body) return null;

  for await (const chunk of response.body as unknown as AsyncIterable<Buffer>) {
    total += chunk.length;
    if (total > maxBytes) {
      console.warn(`content-extractor: exceeded ${maxBytes} bytes for ${url}`);
      return null;
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

// pdf-parse v1 uses module.exports directly (no default export).
const pdfParse: (dataBuffer: Buffer) => Promise<{
  text: string;
  numpages: number;
}> = require("pdf-parse");

async function extractFromPdf(buffer: Buffer): Promise<ExtractResult> {
  const data = await pdfParse(buffer);
  return {
    content: truncate(data.text),
    method: "pdf",
  };
}

async function extractFromDocument(buffer: Buffer): Promise<ExtractResult> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    if (result.value && result.value.trim().length > 0) {
      return {
        content: truncate(result.value),
        method: "document",
      };
    }
  } catch (err) {
    console.warn("content-extractor: mammoth failed, trying pdf fallback", err);
  }

  // Fallback: try treating the file as PDF
  return extractFromPdf(buffer);
}
