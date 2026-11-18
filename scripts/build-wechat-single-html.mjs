import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

const htmlRaw = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');
const cssRaw = fs.readFileSync(path.join(publicDir, 'styles.css'), 'utf-8');
const dataRaw = fs.readFileSync(path.join(publicDir, 'universities-data.js'), 'utf-8');
const qrRaw = fs.readFileSync(path.join(publicDir, 'qr-mini.js'), 'utf-8');
let appRaw = fs.readFileSync(path.join(publicDir, 'app.js'), 'utf-8');

// Add Canvas roundRect polyfill for older mobile/WeChat WebViews & long-press save hint
const polyfillJs = `
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
    let r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? radii[0] : 8);
    r = Math.min(r, w / 2, h / 2);
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}
`;

// Enhance poster modal with WeChat long-press hint
appRaw = appRaw.replace(
  '下载高清日历图片 (PNG)</a>',
  '下载图片</a><span style="font-size:0.76rem;color:#0284c7;font-weight:600;">微信/手机端可直接「长按下方图片」保存或转发</span>'
);

// Extra mobile / WeChat WebView responsive polish
const wechatExtraCss = `
/* WeChat & Mobile WebView Optimizations */
html {
  -webkit-text-size-adjust: 100%;
  -webkit-tap-highlight-color: transparent;
}
@media (max-width: 640px) {
  .site-header {
    padding: 0.6rem 0.9rem;
  }
  .header-inner {
    gap: 0.6rem;
  }
  .brand-logo {
    width: 36px;
    height: 36px;
  }
  .brand-title {
    font-size: 1.08rem;
  }
  .last-updated-tag {
    font-size: 0.64rem;
  }
  .nav-segmented {
    width: 100%;
    justify-content: center;
    order: 3;
  }
  .nav-seg-btn {
    flex: 1;
    justify-content: center;
    padding: 0.38rem 0.5rem;
  }
  .main-container {
    padding: 0 0.85rem;
    margin-top: 0.85rem;
  }
  .control-console {
    padding: 0.95rem 1rem;
  }
  .console-label {
    min-width: 100%;
    margin-bottom: -0.25rem;
  }
  .uni-grid {
    grid-template-columns: 1fr;
  }
  .detail-hero-section {
    padding: 1.35rem 1.25rem;
  }
  .detail-title-zh {
    font-size: 1.4rem;
  }
  .detail-block {
    padding: 1.1rem 1.15rem;
  }
}
`;

const singleHtml = htmlRaw
  .replace(
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />\n  <meta name="format-detection" content="telephone=no" />'
  )
  .replace('<link rel="stylesheet" href="./styles.css" />', () => `<style>\n${cssRaw}\n${wechatExtraCss}\n</style>`)
  .replace(
    '<script src="./universities-data.js"></script>\n  <script src="./qr-mini.js"></script>\n  <script src="./app.js"></script>',
    () => `<script>\n${polyfillJs}\n${dataRaw}\n${qrRaw}\n${appRaw}\n</script>`
  );

const outRoot = path.join(rootDir, '扬帆海本.html');
const outPublic = path.join(publicDir, '扬帆海本.html');

fs.writeFileSync(outRoot, singleHtml, 'utf-8');
fs.writeFileSync(outPublic, singleHtml, 'utf-8');

const sizeKb = (Buffer.byteLength(singleHtml, 'utf-8') / 1024).toFixed(1);
console.log(`✅ Built standalone WeChat-ready HTML: ${outRoot} (${sizeKb} KB)`);
