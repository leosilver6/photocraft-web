// Opens the published site in headless browsers and reports what happens while it loads.
import { chromium, webkit } from 'playwright';
const base = 'https://leosilver6.github.io/photocraft-web/';
for (const [name, type] of [['webkit', webkit], ['chromium', chromium]]) {
  for (const q of ['', '?webgl']) {
    const browser = await type.launch();
    const page = await browser.newPage();
    const log = [];
    page.on('console', m => log.push(`console.${m.type()}: ${m.text()}`));
    page.on('pageerror', e => log.push(`pageerror: ${e.message}`));
    page.on('requestfailed', r => log.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
    page.on('response', r => log.push(`response: ${r.status()} ${r.url()} ${r.headers()['content-type'] ?? ''} ${r.headers()['content-encoding'] ?? ''}`));
    const t0 = Date.now();
    await page.goto(base + q, { waitUntil: 'load', timeout: 60000 }).catch(e => log.push(`goto: ${e.message}`));
    let state = 'still loading after 120s';
    for (let i = 0; i < 120; i++) {
      const s = await page.evaluate(() => {
        const l = document.getElementById('photocraft_loading');
        const st = document.getElementById('photocraft_stopped');
        if (st && !st.hidden) return 'STOPPED: ' + st.innerText;
        if (!l) return 'STARTED';
        return null;
      }).catch(e => 'eval error: ' + e.message);
      if (s) { state = `${s} after ${((Date.now() - t0) / 1000).toFixed(1)}s`; break; }
      await page.waitForTimeout(1000);
    }
    const text = await page.evaluate(() => document.getElementById('photocraft_loading')?.innerText ?? '').catch(() => '');
    console.log(`\n===== ${name} ${q || '(default)'}: ${state}`);
    if (text) console.log('loading text: ' + text.replace(/\s+/g, ' '));
    for (const l of log) console.log('  ' + l.slice(0, 400));
    await page.screenshot({ path: `shot-${name}${q ? '-webgl' : ''}.png` }).catch(() => {});
    await browser.close();
  }
}
