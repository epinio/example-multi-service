const express = require('express');
const puppeteer = require('puppeteer');
const { reportCardHtml } = require('./template');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/render', async (req, res) => {
  const { student, marks, summary } = req.body || {};
  if (!student || !marks || !summary) {
    return res.status(400).json({ error: 'student, marks and summary are required' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      // The custom builder installs Chromium's runtime libraries into
      // the run image; PUPPETEER_EXECUTABLE_PATH (set in epinio.yml)
      // points at that binary instead of Puppeteer's bundled download.
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(reportCardHtml({ student, marks, summary }), { waitUntil: 'networkidle0' });
    // page.pdf() returns a Uint8Array, not a Node Buffer; res.send() only
    // writes raw bytes for an actual Buffer; otherwise it JSON-serializes
    // the typed array (one numeric key per byte), which is not what's
    // wanted for a PDF download.
    const pdf = Buffer.from(await page.pdf({ format: 'A4', printBackground: true }));

    res.set('Content-Type', 'application/pdf');
    res.send(pdf);
  } catch (err) {
    console.error('Failed to render report card:', err);
    res.status(500).json({ error: 'Failed to render report card' });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`examresults-report-service listening on port ${PORT}`);
});
