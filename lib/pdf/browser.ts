import type { Browser } from "puppeteer-core"
import fs from "fs"

let _cachedBrowser: Browser | null = null

/**
 * Common system Chrome paths across OSes for local development fallback
 */
const SYSTEM_CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
]

function findSystemChromePath(): string | null {
  for (const p of SYSTEM_CHROME_PATHS) {
    if (fs.existsSync(p)) {
      return p
    }
  }
  return null
}

export async function launchBrowser(): Promise<Browser> {
  if (_cachedBrowser && _cachedBrowser.connected) {
    return _cachedBrowser
  }

  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL

  if (isProduction) {
    // Production / Vercel — use @sparticuz/chromium-min
    const puppeteerCore = await import("puppeteer-core")
    const chromiumMin = await import("@sparticuz/chromium-min")

    const browser = await puppeteerCore.default.launch({
      args: chromiumMin.default.args,
      defaultViewport: chromiumMin.default.defaultViewport,
      executablePath: await chromiumMin.default.executablePath(),
      headless: true,
    })

    _cachedBrowser = browser
    return browser
  } else {
    // Local development — try system Chrome first, then puppeteer default
    const puppeteerCore = await import("puppeteer-core")
    const systemChromePath = findSystemChromePath()

    if (systemChromePath) {
      const browser = await puppeteerCore.default.launch({
        executablePath: systemChromePath,
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })
      _cachedBrowser = browser
      return browser
    }

    // Fallback to standard puppeteer
    const puppeteer = await import("puppeteer")
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    _cachedBrowser = browser as unknown as Browser
    return _cachedBrowser
  }
}

export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const browser = await launchBrowser()
  const page = await browser.newPage()

  try {
    await page.setContent(html, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm",
      },
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await page.close()
  }
}
