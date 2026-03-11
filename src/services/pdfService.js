/**
 * ============================================
 * ENTERPRISE PDF RENDERING SERVICE
 * ============================================
 * Backend PDF generation using Puppeteer
 * Used for bulk certificate generation
 */

const puppeteer = require("puppeteer");

// Certificate dimensions - Using same template as frontend (1235x1600)
const CERT_TEMPLATE = {
  width: 1235,
  height: 1600,
  slots: {
    kpm: { x: 110, y: 610, w: 260, h: 45, align: "left", fontSize: 26 },
    name: { x: 617, y: 880, w: 490, h: 65, align: "center", fontSize: 52 },
    semester: { x: 350, y: 960, w: 175, h: 55, align: "center", fontSize: 34 },
    department: { x: 617, y: 960, w: 290, h: 55, align: "center", fontSize: 34 },
    competition: { x: 615, y: 1050, w: 215, h: 55, align: "left", fontSize: 28 },
    year: { x: 985, y: 1140, w: 155, h: 55, align: "center", fontSize: 34 },
    position: { x: 617, y: 1200, w: 175, h: 55, align: "center", fontSize: 34 },
  },
};

const CERT_WIDTH = CERT_TEMPLATE.width;
const CERT_HEIGHT = CERT_TEMPLATE.height;
const DEFAULT_FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

let browserInstance = null;

const closeBrowser = async () => {
  if (!browserInstance) return;
  try {
    await browserInstance.close();
  } catch (error) {
    console.error("Failed to close Puppeteer browser:", error);
  } finally {
    browserInstance = null;
  }
};

async function getBrowser() {
  if (browserInstance) return browserInstance;
  browserInstance = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  return browserInstance;
}

process.once("SIGINT", closeBrowser);
process.once("SIGTERM", closeBrowser);
process.once("beforeExit", closeBrowser);

const pxToIn = (px) => `${Number(px) / 96}in`;

const resolveAbsoluteUrl = (url) => {
  const value = String(url || "").trim();
  if (!value) return `${DEFAULT_FRONTEND_URL}/certificate-template.jpeg`;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${DEFAULT_FRONTEND_URL}${value}`;
  return `${DEFAULT_FRONTEND_URL}/${value}`;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

/**
 * Generate PDF from HTML using Puppeteer
 * @param {string} html - HTML content to render
 * @param {object} options - PDF generation options
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generatePDF(html, options = {}) {
  const {
    width = CERT_WIDTH,
    height = CERT_HEIGHT,
  } = options;

  let page = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // Set viewport to match certificate size
    await page.setViewport({
      width: Math.floor(width),
      height: Math.floor(height),
      deviceScaleFactor: 1,
    });

    // Set the HTML content
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    // Wait for any fonts to load
    await page.evaluateHandle("document.fonts.ready");

    // Generate PDF
    const pdfBuffer = await page.pdf({
      width: pxToIn(width),
      height: pxToIn(height),
      scale: 1,
      printBackground: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    });

    return pdfBuffer;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  } finally {
    if (page && !page.isClosed()) await page.close();
  }
}

/**
 * Generate certificate PDF with data
 * @param {object} certificateData - Certificate data
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateCertificatePDF(certificateData) {
  const {
    name,
    kpmNo,
    semester,
    department,
    competition,
    position,
    year,
    certificateId,
    qrImage,
    backgroundUrl,
  } = certificateData;

  // Build HTML for certificate
  const html = buildCertificateHTML({
    name,
    kpmNo,
    semester,
    department,
    competition,
    position,
    year,
    certificateId,
    qrImage,
    backgroundUrl,
  });

  return generatePDF(html);
}

/**
 * Build certificate HTML
 */
function buildCertificateHTML(data) {
  const { name, kpmNo, semester, department, competition, position, year, qrImage, backgroundUrl } = data;
  const safeBackgroundUrl = resolveAbsoluteUrl(backgroundUrl);
  const slotDebug = String(process.env.CERTIFICATE_SLOT_DEBUG || "").toLowerCase() === "true";
  const configuredFontUrl = String(process.env.CERTIFICATE_FONT_URL || "").trim();
  const fontUrl = configuredFontUrl ? resolveAbsoluteUrl(configuredFontUrl) : "";
  const fontFaceCss = fontUrl
    ? `
        @font-face {
          font-family: "TimesNewRomanLocal";
          src: url('${fontUrl}') format("truetype");
          font-style: normal;
          font-weight: 400 700;
        }
      `
    : "";

  const slots = CERT_TEMPLATE.slots;

  const fieldCss = (slot) => `
    left: ${slot.x}px;
    top: ${slot.y}px;
    width: ${slot.w}px;
    height: ${slot.h}px;
    font-size: ${slot.fontSize || 34}px;
    justify-content: ${slot.align === "left" ? "flex-start" : "center"};
    text-align: ${slot.align};
    ${slotDebug ? "outline: 1px dashed rgba(255,0,0,.6);" : ""}
    ${slotDebug ? "background: rgba(255,0,0,.06);" : ""}
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        ${fontFaceCss}

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          width: ${CERT_WIDTH}px;
          height: ${CERT_HEIGHT}px;
          overflow: hidden;
          font-family: ${fontUrl ? '"TimesNewRomanLocal", ' : ""}"Times New Roman", serif;
        }

        .certificate {
          position: relative;
          width: ${CERT_WIDTH}px;
          height: ${CERT_HEIGHT}px;
          background-image: url('${safeBackgroundUrl}');
          background-repeat: no-repeat;
          background-position: 0 0;
          background-size: 100% 100%;
        }

        .field {
          position: absolute;
          color: #243a8c;
          font-weight: 700;
          white-space: nowrap;
          display: flex;
          align-items: center;
          line-height: 1;
          overflow: hidden;
        }

        .kpm { ${fieldCss(slots.kpm)} }
        .name { ${fieldCss(slots.name)} }
        .semester { ${fieldCss(slots.semester)} }
        .department { ${fieldCss(slots.department)} }
        .competition { ${fieldCss(slots.competition)} }
        .year { ${fieldCss(slots.year)} }
        .position { ${fieldCss(slots.position)} }

        .qr-code {
          position: absolute;
          bottom: 130px;
          right: 220px;
          width: 170px;
          height: 170px;
          border: 4px solid #ffffff;
          border-radius: 6px;
          box-shadow: 0 8px 24px rgba(10, 20, 65, 0.25);
          background: #fff;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="field kpm">${escapeHtml(kpmNo)}</div>
        <div class="field name">${escapeHtml(name)}</div>
        <div class="field semester">${escapeHtml(semester)}</div>
        <div class="field department">${escapeHtml(department)}</div>
        <div class="field competition">${escapeHtml(competition)}</div>
        <div class="field year">${escapeHtml(year)}</div>
        <div class="field position">${escapeHtml(position)}</div>
        ${qrImage ? `<img class="qr-code" src="${escapeHtml(qrImage)}" alt="QR Code" />` : ""}
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  generatePDF,
  generateCertificatePDF,
  buildCertificateHTML,
  CERT_WIDTH,
  CERT_HEIGHT,
};
