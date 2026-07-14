#!/usr/bin/env node
'use strict';

/*
  StellarNest — APAC Hackathon Pitch Deck Generator
  Uses: pptxgenjs + react-icons + sharp
  Output: PITCH_DECK_STELLARNEST_APAC2026.pptx
*/

const path = require('path');
const { createRequire } = require('module');
const _require = createRequire(__filename);

const React = _require('react');
const ReactDOMServer = _require('react-dom/server');
const pptxgenjs = _require('pptxgenjs');
const {
  FaStar, FaRocket, FaGlobe, FaLock, FaChartLine, FaCreditCard,
  FaHandHoldingUsd, FaWallet, FaShieldAlt, FaBuilding,
  FaMobileAlt, FaLink, FaCheckCircle, FaExclamationTriangle,
  FaUsers, FaBriefcase, FaCoins, FaClock, FaDatabase,
  FaServer, FaCode, FaKey, FaChartBar, FaMoneyBillWave,
  FaArrowRight, FaArrowDown, FaQuoteLeft, FaQuoteRight,
  FaFileAlt, FaClipboardList, FaHandshake, FaExchangeAlt,
  FaUniversity, FaPaypal, FaGoogle, FaAmazon, FaCcVisa,
  FaTelegram, FaWhatsapp, FaEnvelope, FaSms,
  FaAngleRight, FaChevronRight, FaChevronDown,
} = _require('react-icons/fa');

// sharp — found in global modules
const GM = '/Users/macbook/Library/Application Support/QClaw/npm-global/lib/node_modules';
const _sharp = require(GM + '/sharp');
let _sharpBuf = null;
async function sharpToPngBuf(svgStr) {
  return await _sharp(Buffer.from(svgStr)).png().toBuffer();
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  navy:       '0A1628',  // deep dark blue
  navy2:      '0F2044',  // slightly lighter navy
  teal:       '0D9488',  // primary teal
  teal2:      '14B8A6',  // lighter teal
  mint:       '02C39A',  // mint accent
  white:      'FFFFFF',
  offwhite:   'F1F5F9',
  lightgray:  'E2E8F0',
  muted:      '94A3B8',
  darktext:   '1E293B',
  bodytext:   '334155',
  red:        'DC2626',
  orange:     'EA580C',
  green:      '16A34A',
  yellow:     'D97706',
  purple:     '7C3AED',
  cardbg:     'F8FAFC',
  cardborder: 'E2E8F0',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function mkIcon(IconComp, color = '#' + C.teal, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComp, { color, size: String(size) })
  );
  try {
    const buf = await sharpToPngBuf(svg);
    return 'image/png;base64,' + buf.toString('base64');
  } catch (err) {
    // Fallback: tiny teal PNG
    try {
      const tealPng = await sharpToPngBuf(
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
        '<rect width="32" height="32" rx="4" fill="#0D9488"/></svg>'
      );
      return 'image/png;base64,' + tealPng.toString('base64');
    } catch {
      return null;
    }
  }
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(0,2),16);
  const g = parseInt(hex.slice(2,4),16);
  const b = parseInt(hex.slice(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function addSlideNumBadge(slide, num, total) {
  // Bottom-right pill
  slide.addShape('rect', {
    x: 8.9, y: 5.05, w: 0.95, h: 0.38,
    fill: { color: C.teal, transparency: 15 },
    line: { color: C.teal, width: 0.5 },
  });
  slide.addText(`${num} / ${total}`, {
    x: 8.9, y: 5.05, w: 0.95, h: 0.38,
    fontSize: 8, color: C.teal, bold: true,
    align: 'center', valign: 'middle', margin: 0,
  });
}

function addFooter(slide, text) {
  slide.addText(text || 'StellarNest · APAC Stellar Hackathon 2026', {
    x: 0.3, y: 5.2, w: 7, h: 0.3,
    fontSize: 7, color: C.muted, margin: 0,
  });
}

function addAccentBar(slide, x, y, h, color) {
  slide.addShape('rect', { x, y, w: 0.06, h, fill: { color } });
}

function card(slide, pres, x, y, w, h, fillColor, opts = {}) {
  slide.addShape('rect', {
    x, y, w, h,
    fill: { color: fillColor || C.cardbg },
    line: { color: C.cardborder, width: opts.borderWidth || 0.5 },
    shadow: { type: 'outer', color: '000000', blur: 8, offset: 2, angle: 135, opacity: 0.08 },
    ...opts,
  });
}

function sectionTitle(slide, text, x, y, w, color) {
  slide.addText(text, {
    x, y, w, h: 0.45,
    fontSize: 22, bold: true, color: color || C.darktext,
    margin: 0, charSpacing: 0.5,
  });
}

function bulletList(slide, items, x, y, w, iconColor, fontSize = 12.5) {
  const lineH = 0.38;
  items.forEach((item, i) => {
    // Bullet dot
    slide.addShape('ellipse', {
      x: x, y: y + i * lineH + 0.08,
      w: 0.12, h: 0.12,
      fill: { color: iconColor },
    });
    slide.addText(item, {
      x: x + 0.22, y: y + i * lineH,
      w: w - 0.22, h: lineH,
      fontSize, color: C.darktext, valign: 'middle', margin: 0,
    });
  });
}

async function iconPng(IconComp, color, size = 256) {
  return mkIcon(IconComp, color, size);
}

// Sync wrapper — resolve already-cached icons synchronously
const _iconCache = new Map();
function iconPngCached(IconComp, color, size = 256) {
  const key = `${IconComp.name}_${color}_${size}`;
  if (!_iconCache.has(key)) {
    _iconCache.set(key, mkIcon(IconComp, color, size));
  }
  return _iconCache.get(key);
}

// ─── Preload Icons ────────────────────────────────────────────────────────────
async function preloadIcons() {
  const icons = await Promise.all([
    iconPng(FaStar,                   '#' + C.teal),
    iconPng(FaRocket,                 '#' + C.teal),
    iconPng(FaGlobe,                  '#' + C.teal),
    iconPng(FaLock,                   '#' + C.teal),
    iconPng(FaChartLine,              '#' + C.teal),
    iconPng(FaWallet,                 '#' + C.teal),
    iconPng(FaShieldAlt,              '#' + C.teal),
    iconPng(FaBuilding,               '#' + C.teal),
    iconPng(FaMobileAlt,              '#' + C.teal),
    iconPng(FaLink,                   '#' + C.teal),
    iconPng(FaCheckCircle,            '#' + C.green),
    iconPng(FaExclamationTriangle,   '#' + C.orange),
    iconPng(FaUsers,                  '#' + C.teal),
    iconPng(FaCoins,                  '#' + C.yellow),
    iconPng(FaClock,                 '#' + C.orange),
    iconPng(FaDatabase,              '#' + C.teal),
    iconPng(FaServer,                 '#' + C.teal),
    iconPng(FaCode,                   '#' + C.teal),
    iconPng(FaKey,                   '#' + C.mint),
    iconPng(FaChartBar,              '#' + C.teal),
    iconPng(FaMoneyBillWave,         '#' + C.green),
    iconPng(FaArrowRight,            '#' + C.teal),
    iconPng(FaArrowDown,             '#' + C.teal),
    iconPng(FaFileAlt,               '#' + C.teal),
    iconPng(FaClipboardList,        '#' + C.teal),
    iconPng(FaHandshake,             '#' + C.teal),
    iconPng(FaExchangeAlt,           '#' + C.teal),
    iconPng(FaCcVisa,                '#' + C.navy2),
    iconPng(FaWhatsapp,              '#' + C.green),
    iconPng(FaTelegram,              '#' + C.teal),
    iconPng(FaRocket,                '#' + C.mint),
    iconPng(FaHandHoldingUsd,        '#' + C.mint),
    iconPng(FaExchangeAlt,           '#' + C.purple),
    iconPng(FaBriefcase,             '#' + C.teal),
    iconPng(FaPaypal,                '#' + C.teal),
    iconPng(FaUniversity,           '#' + C.teal2),
    iconPng(FaCoins,                 '#' + C.teal2),
    iconPng(FaClock,                 '#' + C.orange),
    iconPng(FaEnvelope,              '#' + C.teal),
    iconPng(FaSms,                   '#' + C.orange),
    iconPng(FaCcVisa,                '#' + C.navy2),
  ]);
  return {
    iStar:     icons[0],
    iRocket:    icons[1],
    iGlobe:     icons[2],
    iLock:      icons[3],
    iChart:     icons[4],
    iWallet:    icons[5],
    iShield:    icons[6],
    iBuilding:  icons[7],
    iMobile:    icons[8],
    iLink:      icons[9],
    iCheck:     icons[10],
    iWarning:   icons[11],
    iUsers:     icons[12],
    iCoins:     icons[13],
    iClock:     icons[14],
    iDB:        icons[15],
    iServer:    icons[16],
    iCode:      icons[17],
    iKey:       icons[18],
    iChartBar:  icons[19],
    iMoney:     icons[20],
    iRight:     icons[21],
    iDown:      icons[22],
    iFile:      icons[23],
    iClipboard: icons[24],
    iHandshake: icons[25],
    iExchange:  icons[26],
    iCC:        icons[27],
    iWhatsapp:  icons[28],
    iTelegram:  icons[29],
    iSend:      icons[30],
    iReceive:   icons[31],
    iSplit:     icons[32],
    iBriefcase: icons[33],
    iPaypal:    icons[34],
    iBank:      icons[35],
    iCrypto:    icons[36],
    iCalendar:  icons[37],
    iEmail:     icons[38],
    iSms:       icons[39],
    iVisa:      icons[40],
  };
}

// ─── SLIDE 1: Title ──────────────────────────────────────────────────────────
async function slide1(pres, icons) {
  const slide = pres.addSlide();
  // Full dark background
  slide.background = { color: C.navy };

  // Decorative top-right circle
  slide.addShape('ellipse', {
    x: 7.5, y: -1.5, w: 4, h: 4,
    fill: { color: C.teal, transparency: 85 },
  });
  slide.addShape('ellipse', {
    x: 8.2, y: -0.8, w: 3, h: 3,
    fill: { color: C.mint, transparency: 88 },
  });

  // Bottom-left circle
  slide.addShape('ellipse', {
    x: -1, y: 3.5, w: 3.5, h: 3.5,
    fill: { color: C.teal, transparency: 90 },
  });

  // Left accent bar
  slide.addShape('rect', {
    x: 0, y: 0, w: 0.08, h: 5.625,
    fill: { color: C.teal },
  });

  // Stellar chain dots decoration
  for (let i = 0; i < 8; i++) {
    slide.addShape('ellipse', {
      x: 6.8 + (i % 3) * 0.45, y: 0.35 + Math.floor(i / 3) * 0.45,
      w: 0.2, h: 0.2,
      fill: { color: C.teal, transparency: 60 + i * 4 },
    });
  }

  // Logo mark — Stellar-like X pattern
  slide.addText('✦', {
    x: 0.4, y: 0.35, w: 0.6, h: 0.6,
    fontSize: 28, color: C.mint, margin: 0,
  });
  slide.addText('StellarNest', {
    x: 1.0, y: 0.4, w: 3, h: 0.5,
    fontSize: 18, bold: true, color: C.white, margin: 0,
  });

  // Main title
  slide.addText('StellarNest', {
    x: 0.5, y: 1.65, w: 9, h: 1.1,
    fontSize: 60, bold: true, color: C.white,
    align: 'left', margin: 0, charSpacing: -1,
  });

  // Subtitle accent bar
  slide.addShape('rect', {
    x: 0.5, y: 2.72, w: 0.6, h: 0.07,
    fill: { color: C.mint },
  });

  slide.addText('Borderless Payments for Every Worker', {
    x: 0.5, y: 2.82, w: 9, h: 0.7,
    fontSize: 26, color: C.teal2,
    align: 'left', margin: 0,
  });

  slide.addText('Powered by Stellar  ·  Built for ASEAN Migrant Workers & Freelancers', {
    x: 0.5, y: 3.52, w: 9, h: 0.45,
    fontSize: 14, color: C.muted, margin: 0,
  });

  // Three tag pills
  const tags = ['✦ Blockchain-Powered', '⚡ Instant Settlement', '🔐 AES-256 Encrypted'];
  tags.forEach((tag, i) => {
    const tx = 0.5 + i * 3.1;
    slide.addShape('rect', {
      x: tx, y: 4.25, w: 2.85, h: 0.38,
      fill: { color: C.teal, transparency: 80 },
      line: { color: C.teal2, width: 0.8 },
    });
    slide.addText(tag, {
      x: tx, y: 4.25, w: 2.85, h: 0.38,
      fontSize: 10, color: C.white, align: 'center', valign: 'middle', margin: 0,
    });
  });

  // Bottom badge
  slide.addShape('rect', {
    x: 0, y: 5.1, w: 10, h: 0.525,
    fill: { color: C.navy2 },
  });
  slide.addText('🏆  APAC Stellar Hackathon — Final Submission  |  July 2026', {
    x: 0.5, y: 5.12, w: 9, h: 0.48,
    fontSize: 11, color: C.muted, align: 'center', valign: 'middle', margin: 0,
  });

  addSlideNumBadge(slide, 1, 10);
}

// ─── SLIDE 2: The Problem ────────────────────────────────────────────────────
async function slide2(pres, icons) {
  const slide = pres.addSlide();
  slide.background = { color: C.offwhite };

  // Top accent bar
  slide.addShape('rect', { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.red } });
  slide.addShape('rect', { x: 0, y: 0, w: 10, h: 0.7, fill: { color: C.red, transparency: 92 } });

  // Header
  slide.addText('THE PROBLEM', {
    x: 0.5, y: 0.2, w: 4, h: 0.4,
    fontSize: 10, bold: true, color: C.red, margin: 0, charSpacing: 3,
  });
  slide.addText('The System Is Broken at Every Level', {
    x: 0.5, y: 0.5, w: 9, h: 0.55,
    fontSize: 24, bold: true, color: C.darktext, margin: 0,
  });

  // 5 problem cards — 3 on top row, 2 on bottom
  const problems = [
    { icon: icons.iCoins, title: 'Exorbitant Fees', body: 'Workers pay $12–$35 per transfer.\n5–7% of each payment lost to fees.', color: C.red, stat: '5–7%' },
    { icon: icons.iClock, title: '2–3 Day Settlement', body: 'Emergency money takes days.\nNo same-day remittance option.', color: C.orange, stat: '2–3 days' },
    { icon: icons.iUsers, title: '72M Unbanked in ASEAN', body: 'Recipients without a bank account\nsimply cannot receive transfers.', color: C.purple, stat: '72M' },
    { icon: icons.iChart, title: 'No Credit History', body: 'Informal remittances build no\nfinancial identity or credit profile.', color: C.yellow, stat: '0 record' },
    { icon: icons.iExchange, title: 'Fragmented Corridors', body: 'Every corridor (ID→PH, ID→VN)\nis a different fee, aggregator, delay.', color: C.navy2, stat: 'Many' },
  ];

  // Row 1: 3 cards
  const cw = 2.85, ch = 1.65, cy1 = 1.25, gap = 0.23;
  for (let i = 0; i < 3; i++) {
    const cx = 0.5 + i * (cw + gap);
    const p = problems[i];
    // Card
    slide.addShape('rect', {
      x: cx, y: cy1, w: cw, h: ch,
      fill: { color: C.white },
      line: { color: p.color, width: 1.5 },
      shadow: { type: 'outer', color: '000000', blur: 6, offset: 2, angle: 135, opacity: 0.07 },
    });
    // Left accent
    slide.addShape('rect', { x: cx, y: cy1, w: 0.06, h: ch, fill: { color: p.color } });
    // Icon
    slide.addImage({ data: p.icon, x: cx + 0.2, y: cy1 + 0.15, w: 0.38, h: 0.38 });
    // Stat
    slide.addText(p.stat, {
      x: cx + 0.65, y: cy1 + 0.12, w: 1.5, h: 0.45,
      fontSize: 20, bold: true, color: p.color, margin: 0,
    });
    // Title
    slide.addText(p.title, {
      x: cx + 0.15, y: cy1 + 0.58, w: cw - 0.3, h: 0.38,
      fontSize: 12, bold: true, color: C.darktext, margin: 0,
    });
    // Body
    slide.addText(p.body, {
      x: cx + 0.15, y: cy1 + 0.92, w: cw - 0.3, h: 0.65,
      fontSize: 10, color: C.bodytext, margin: 0,
    });
  }

  // Row 2: 2 centered cards
  const row2w = 4.2, row2h = 1.65, row2y = 3.1;
  for (let i = 0; i < 2; i++) {
    const cx = 0.5 + (i * (row2w + 0.4)) + (10 - 2 * row2w - 0.4) / 2 - 0.5;
    const p = problems[3 + i];
    slide.addShape('rect', {
      x: cx, y: row2y, w: row2w, h: row2h,
      fill: { color: C.white },
      line: { color: p.color, width: 1.5 },
      shadow: { type: 'outer', color: '000000', blur: 6, offset: 2, angle: 135, opacity: 0.07 },
    });
    slide.addShape('rect', { x: cx, y: row2y, w: 0.06, h: row2h, fill: { color: p.color } });
    slide.addImage({ data: p.icon, x: cx + 0.2, y: row2y + 0.15, w: 0.38, h: 0.38 });
    slide.addText(p.stat, {
      x: cx + 0.65, y: row2y + 0.12, w: 2, h: 0.45,
      fontSize: 20, bold: true, color: p.color, margin: 0,
    });
    slide.addText(p.title, {
      x: cx + 0.15, y: row2y + 0.58, w: row2w - 0.3, h: 0.38,
      fontSize: 12, bold: true, color: C.darktext, margin: 0,
    });
    slide.addText(p.body, {
      x: cx + 0.15, y: row2y + 0.92, w: row2w - 0.3, h: 0.65,
      fontSize: 10, color: C.bodytext, margin: 0,
    });
  }

  // Bottom bar
  slide.addShape('rect', { x: 0, y: 4.95, w: 10, h: 0.675, fill: { color: C.red, transparency: 95 } });
  slide.addText('💡 A $150B+ annual remittance market — where workers pay the highest fees and receive the least infrastructure.', {
    x: 0.5, y: 5.05, w: 9, h: 0.45,
    fontSize: 10, color: C.red, align: 'center', valign: 'middle', margin: 0,
  });

  addFooter(slide);
  addSlideNumBadge(slide, 2, 10);
}

// ─── SLIDE 3: The Solution ────────────────────────────────────────────────────
async function slide3(pres, icons) {
  const slide = pres.addSlide();
  slide.background = { color: C.navy };

  // Background decorative circles
  slide.addShape('ellipse', { x: -2, y: -1, w: 5, h: 5, fill: { color: C.teal, transparency: 90 } });
  slide.addShape('ellipse', { x: 8, y: 3, w: 4, h: 4, fill: { color: C.mint, transparency: 92 } });

  // Top left label
  slide.addText('THE SOLUTION', {
    x: 0.5, y: 0.25, w: 4, h: 0.3,
    fontSize: 10, bold: true, color: C.mint, margin: 0, charSpacing: 3,
  });
  slide.addText('Introducing StellarNest', {
    x: 0.5, y: 0.55, w: 9, h: 0.7,
    fontSize: 34, bold: true, color: C.white, margin: 0,
  });
  slide.addText('One link. Any bank. Zero crypto knowledge required.', {
    x: 0.5, y: 1.2, w: 9, h: 0.4,
    fontSize: 14, color: C.teal2, margin: 0,
  });

  // Three feature cards
  const features = [
    {
      icon: icons.iLink, title: 'Magic Claim Links',
      body: 'Shareable payment URLs via WhatsApp or SMS. Recipient claims with just a phone number — no app, no wallet, no onboarding.',
      accent: C.mint, x: 0.5,
    },
    {
      icon: icons.iSplit, title: 'Split-Routing',
      body: 'Every payment is automatically split: 70% to family, 30% to savings — enforced at the protocol level on the Stellar ledger.',
      accent: C.purple, x: 3.5,
    },
    {
      icon: icons.iBuilding, title: 'Multi-Currency Rails',
      body: 'BI-FAST, InstaPay, VietQR, PromptPay, DuitNow, PayNow — 6 ASEAN corridors with local settlement networks.',
      accent: C.teal2, x: 6.5,
    },
  ];

  const cw = 2.85, ch = 2.4, cy = 1.75;
  features.forEach((f, i) => {
    // Card bg
    slide.addShape('rect', {
      x: f.x, y: cy, w: cw, h: ch,
      fill: { color: C.white, transparency: 8 },
      line: { color: f.accent, width: 1 },
    });
    // Top accent bar
    slide.addShape('rect', { x: f.x, y: cy, w: cw, h: 0.08, fill: { color: f.accent } });
    // Icon circle bg
    slide.addShape('ellipse', {
      x: f.x + 0.2, y: cy + 0.25, w: 0.65, h: 0.65,
      fill: { color: f.accent, transparency: 20 },
    });
    // Icon
    slide.addImage({ data: f.icon, x: f.x + 0.28, y: cy + 0.33, w: 0.5, h: 0.5 });
    // Title
    slide.addText(f.title, {
      x: f.x + 0.15, y: cy + 1.0, w: cw - 0.3, h: 0.4,
      fontSize: 13, bold: true, color: C.white, margin: 0,
    });
    // Body — dark text for readability on light card bg
    slide.addText(f.body, {
      x: f.x + 0.15, y: cy + 1.38, w: cw - 0.3, h: 0.95,
      fontSize: 10, color: C.bodytext, margin: 0,
    });
  });

  // Bottom: security badge
  slide.addShape('rect', {
    x: 0.5, y: 4.38, w: 9, h: 0.55,
    fill: { color: C.mint, transparency: 88 },
    line: { color: C.mint, width: 0.8 },
  });
  slide.addImage({ data: icons.iShield, x: 0.65, y: 4.48, w: 0.35, h: 0.35 });
  slide.addText('🔐  Client-Side AES-256-GCM Encryption  ·  PBKDF2 (100,000 rounds)  ·  Secrets never touch a server', {
    x: 1.1, y: 4.38, w: 8.3, h: 0.55,
    fontSize: 10, color: C.white, valign: 'middle', margin: 0,
  });

  addFooter(slide);
  addSlideNumBadge(slide, 3, 10);
}

// ─── SLIDE 4: Sender Walkthrough ──────────────────────────────────────────────
async function slide4(pres, icons) {
  const slide = pres.addSlide();
  slide.background = { color: C.offwhite };

  // Header
  slide.addShape('rect', { x: 0, y: 0, w: 10, h: 0.85, fill: { color: C.navy } });
  slide.addText('PRODUCT WALKTHROUGH', {
    x: 0.5, y: 0.08, w: 4, h: 0.25,
    fontSize: 9, bold: true, color: C.mint, margin: 0, charSpacing: 3,
  });
  slide.addText('The Sender Experience', {
    x: 0.5, y: 0.3, w: 7, h: 0.5,
    fontSize: 22, bold: true, color: C.white, margin: 0,
  });

  // Phone mockup placeholder — left side
  const phoneX = 0.5, phoneY = 1.05, phoneW = 3.5, phoneH = 4.35;
  // Phone outer
  slide.addShape('rect', {
    x: phoneX, y: phoneY, w: phoneW, h: phoneH,
    fill: { color: C.navy2 },
    line: { color: C.navy2, width: 2 },
  });
  // Screen
  slide.addShape('rect', {
    x: phoneX + 0.12, y: phoneY + 0.18, w: phoneW - 0.24, h: phoneH - 0.3,
    fill: { color: C.navy },
  });
  // Notch
  slide.addShape('ellipse', {
    x: phoneX + phoneW / 2 - 0.25, y: phoneY + 0.08, w: 0.5, h: 0.18,
    fill: { color: C.navy2 },
  });
  // Screen content — app header
  slide.addText('Send', {
    x: phoneX + 0.2, y: phoneY + 0.35, w: 1.5, h: 0.4,
    fontSize: 18, bold: true, color: C.white, margin: 0,
  });
  slide.addShape('ellipse', {
    x: phoneX + phoneW - 0.55, y: phoneY + 0.35, w: 0.4, h: 0.4,
    fill: { color: C.teal, transparency: 30 },
  });
  slide.addText('👤', {
    x: phoneX + phoneW - 0.55, y: phoneY + 0.33, w: 0.4, h: 0.4,
    fontSize: 16, align: 'center', valign: 'middle', margin: 0,
  });

  // Amount field mock
  slide.addShape('rect', {
    x: phoneX + 0.2, y: phoneY + 0.85, w: phoneW - 0.4, h: 0.7,
    fill: { color: C.teal, transparency: 85 },
    line: { color: C.teal2, width: 1 },
  });
  slide.addText('$  100.00', {
    x: phoneX + 0.3, y: phoneY + 0.87, w: phoneW - 0.6, h: 0.45,
    fontSize: 22, bold: true, color: C.white, margin: 0,
  });
  slide.addText('≈ Rp 1,650,000', {
    x: phoneX + 0.3, y: phoneY + 1.28, w: phoneW - 0.6, h: 0.25,
    fontSize: 10, color: C.mint, margin: 0,
  });

  // Split routing mock
  slide.addText('SPLIT ROUTING', {
    x: phoneX + 0.2, y: phoneY + 1.68, w: 2, h: 0.25,
    fontSize: 8, bold: true, color: C.muted, margin: 0, charSpacing: 1,
  });
  // 70% bar
  slide.addShape('rect', {
    x: phoneX + 0.2, y: phoneY + 1.95, w: (phoneW - 0.4) * 0.7, h: 0.28,
    fill: { color: C.teal },
  });
  slide.addText('Family  70%', {
    x: phoneX + 0.25, y: phoneY + 1.95, w: 1.5, h: 0.28,
    fontSize: 8, bold: true, color: C.white, valign: 'middle', margin: 0,
  });
  // 30% bar
  slide.addShape('rect', {
    x: phoneX + 0.2 + (phoneW - 0.4) * 0.7, y: phoneY + 1.95,
    w: (phoneW - 0.4) * 0.3, h: 0.28,
    fill: { color: C.mint },
  });
  slide.addText('Savings 30%', {
    x: phoneX + 0.2 + (phoneW - 0.4) * 0.7 + 0.05, y: phoneY + 1.95,
    w: 1.2, h: 0.28,
    fontSize: 8, bold: true, color: C.white, valign: 'middle', margin: 0,
  });

  // Amounts
  slide.addText('$70.00 → Family     $30.00 → Savings', {
    x: phoneX + 0.2, y: phoneY + 2.28, w: phoneW - 0.4, h: 0.25,
    fontSize: 9, bold: true, color: C.white, margin: 0,
  });

  // Recipient
  slide.addShape('rect', {
    x: phoneX + 0.2, y: phoneY + 2.65, w: phoneW - 0.4, h: 0.55,
    fill: { color: C.navy2 },
    line: { color: C.lightgray, width: 0.5 },
  });
  slide.addText('🏠  Bayu Receiver  (🇮🇩 Indonesia)', {
    x: phoneX + 0.3, y: phoneY + 2.7, w: phoneW - 0.6, h: 0.45,
    fontSize: 10, color: C.white, valign: 'middle', margin: 0,
  });

  // CTA button
  slide.addShape('rect', {
    x: phoneX + 0.2, y: phoneY + 3.35, w: phoneW - 0.4, h: 0.55,
    fill: { color: C.mint },
  });
  slide.addText('⚡  Share Magic Link', {
    x: phoneX + 0.2, y: phoneY + 3.35, w: phoneW - 0.4, h: 0.55,
    fontSize: 12, bold: true, color: C.navy, align: 'center', valign: 'middle', margin: 0,
  });

  // Phone label
  slide.addText('[ Screenshot: src/pages/Send.tsx ]', {
    x: phoneX, y: phoneY + phoneH + 0.05, w: phoneW, h: 0.2,
    fontSize: 7, color: C.muted, align: 'center', margin: 0,
  });

  // Right side — steps
  const steps = [
    { num: '1', title: 'Enter Amount', body: 'Type any amount ($1–$10,000). Live conversion shows local currency equivalent using exchange rate.' },
    { num: '2', title: 'Set the Split', body: 'Drag the 70/30 slider. Family savings vs emergency fund — enforced on-chain in a single transaction.' },
    { num: '3', title: 'Recipient Details', body: 'Enter name + select country. Determines settlement rail and e-wallets shown to recipient.' },
    { num: '4', title: 'Generate & Share', body: 'Magic Link URL created and shared via WhatsApp, SMS, or email. One tap away.' },
    { num: '5', title: 'On-Chain', body: 'Single USDC transaction submitted to Stellar. Memo CLAIM:<id> links ledger to Firestore record.' },
  ];

  const rx = 4.3, rw = 5.2;
  const lineH = 0.72;
  steps.forEach((s, i) => {
    const ry = 1.0 + i * lineH;
    // Number circle
    slide.addShape('ellipse', {
      x: rx, y: ry + 0.05, w: 0.38, h: 0.38,
      fill: { color: C.teal },
    });
    slide.addText(s.num, {
      x: rx, y: ry + 0.05, w: 0.38, h: 0.38,
      fontSize: 12, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0,
    });
    // Connector line
    if (i < steps.length - 1) {
      slide.addShape('rect', {
        x: rx + 0.17, y: ry + 0.43, w: 0.04, h: lineH - 0.38,
        fill: { color: C.teal, transparency: 50 },
      });
    }
    // Title + body
    slide.addText(s.title, {
      x: rx + 0.52, y: ry, w: rw - 0.52, h: 0.32,
      fontSize: 12, bold: true, color: C.darktext, margin: 0,
    });
    slide.addText(s.body, {
      x: rx + 0.52, y: ry + 0.3, w: rw - 0.52, h: 0.4,
      fontSize: 9.5, color: C.bodytext, margin: 0,
    });
  });

  addFooter(slide);
  addSlideNumBadge(slide, 4, 10);
}

// ─── SLIDE 5: Recipient Walkthrough ─────────────────────────────────────────
async function slide5(pres, icons) {
  const slide = pres.addSlide();
  slide.background = { color: C.offwhite };

  // Header
  slide.addShape('rect', { x: 0, y: 0, w: 10, h: 0.85, fill: { color: C.navy } });
  slide.addText('PRODUCT WALKTHROUGH', {
    x: 0.5, y: 0.08, w: 4, h: 0.25,
    fontSize: 9, bold: true, color: C.mint, margin: 0, charSpacing: 3,
  });
  slide.addText('The Recipient Experience', {
    x: 0.5, y: 0.3, w: 7, h: 0.5,
    fontSize: 22, bold: true, color: C.white, margin: 0,
  });

  // Three phone mockups — Claim → Withdraw → Success
  const phones = [
    {
      label: 'Step 1: Claim Page',
      sublabel: 'src/pages/Claim.tsx',
      bg: C.navy,
      content: [
        { text: '💰  You have a payment!', color: C.mint, size: 13, bold: true },
        { text: '$100.00 USDC', color: C.white, size: 22, bold: true },
        { text: '≈ Rp 1,650,000', color: C.teal2, size: 11 },
        { text: ' ', size: 6 },
        { text: '🌏  Select your country:', color: C.lightgray, size: 10, bold: true },
        { text: '🇮🇩 ID  🇵🇭 PH  🇻🇳 VN', color: C.white, size: 10 },
        { text: '🇹🇭 TH  🇲🇾 MY  🇸🇬 SG', color: C.white, size: 10 },
      ],
      x: 0.4, cta: 'Continue  →', ctaColor: C.teal,
    },
    {
      label: 'Step 2: Withdraw',
      sublabel: 'src/pages/Withdraw.tsx',
      bg: C.navy2,
      content: [
        { text: '💸  Withdraw to Bank', color: C.white, size: 13, bold: true },
        { text: ' ', size: 6 },
        { text: '🇮🇩  Indonesia', color: C.mint, size: 10, bold: true },
        { text: 'Bank / E-Wallet:', color: C.lightgray, size: 9 },
        { text: '🔵 DANA  (selected)', color: C.teal2, size: 11, bold: true },
        { text: 'OVO  GoPay  LinkAja  BCA  BRI', color: C.muted, size: 9 },
        { text: ' ', size: 4 },
        { text: 'Account / Phone:', color: C.lightgray, size: 9 },
        { text: '0812-3456-7890', color: C.white, size: 11 },
      ],
      x: 3.5, cta: 'Withdraw Rp 1,650,000', ctaColor: C.mint,
    },
    {
      label: 'Step 3: Success!',
      sublabel: 'Withdraw.tsx — success state',
      bg: '0A2E1E',
      content: [
        { text: '✅  Funds Claimed!', color: C.green, size: 16, bold: true },
        { text: ' ', size: 8 },
        { text: 'Rp 1,650,000', color: C.white, size: 20, bold: true },
        { text: 'sent to your DANA account', color: C.lightgray, size: 10 },
        { text: ' ', size: 8 },
        { text: '⏱  Arrives in 1–3 business days', color: C.yellow, size: 10 },
        { text: ' ', size: 6 },
        { text: 'TX: CLAIM:claim_17836...XKQ', color: C.muted, size: 8 },
      ],
      x: 6.6, cta: '✓  Done', ctaColor: C.green,
    },
  ];

  phones.forEach((p) => {
    const pw = 2.9, ph = 3.6, py = 1.05;
    // Outer frame
    slide.addShape('rect', {
      x: p.x, y: py, w: pw, h: ph,
      fill: { color: C.navy2 },
      line: { color: C.navy2, width: 2 },
    });
    // Screen
    slide.addShape('rect', {
      x: p.x + 0.1, y: py + 0.15, w: pw - 0.2, h: ph - 0.25,
      fill: { color: p.bg },
    });
    // Notch
    slide.addShape('ellipse', {
      x: p.x + pw / 2 - 0.2, y: py + 0.07, w: 0.4, h: 0.15,
      fill: { color: C.navy2 },
    });

    let ty = py + 0.38;
    p.content.forEach((item) => {
      slide.addText(item.text, {
        x: p.x + 0.18, y: ty, w: pw - 0.36, h: item.size * 0.04 + 0.2,
        fontSize: item.size, color: item.color,
        bold: item.bold, margin: 0,
      });
      ty += item.size * 0.038 + 0.18;
    });

    // CTA
    slide.addShape('rect', {
      x: p.x + 0.1, y: py + ph - 0.65, w: pw - 0.2, h: 0.45,
      fill: { color: p.ctaColor },
    });
    slide.addText(p.cta, {
      x: p.x + 0.1, y: py + ph - 0.65, w: pw - 0.2, h: 0.45,
      fontSize: 10, bold: true, color: C.white,
      align: 'center', valign: 'middle', margin: 0,
    });

    // Labels below
    slide.addText(p.label, {
      x: p.x, y: py + ph + 0.05, w: pw, h: 0.22,
      fontSize: 9, bold: true, color: C.darktext, align: 'center', margin: 0,
    });
    slide.addText(p.sublabel, {
      x: p.x, y: py + ph + 0.25, w: pw, h: 0.18,
      fontSize: 7, color: C.muted, align: 'center', margin: 0,
    });
  });

  // Zero friction callout
  slide.addShape('rect', {
    x: 0.4, y: 4.82, w: 9.2, h: 0.6,
    fill: { color: C.green, transparency: 92 },
    line: { color: C.green, width: 1 },
  });
  slide.addImage({ data: icons.iCheck, x: 0.6, y: 4.92, w: 0.4, h: 0.4 });
  slide.addText('No wallet needed  ·  No app install  ·  No crypto knowledge required  ·  KYC handled by e-wallet partner', {
    x: 1.1, y: 4.82, w: 8.4, h: 0.6,
    fontSize: 10, color: C.darktext, valign: 'middle', margin: 0,
  });

  addFooter(slide);
  addSlideNumBadge(slide, 5, 10);
}

// ─── SLIDE 6: Financial Inclusion ───────────────────────────────────────────
async function slide6(pres, icons) {
  const slide = pres.addSlide();
  slide.background = { color: C.offwhite };

  // Header
  slide.addShape('rect', { x: 0, y: 0, w: 10, h: 0.85, fill: { color: C.navy } });
  slide.addText('FINANCIAL INCLUSION', {
    x: 0.5, y: 0.08, w: 5, h: 0.25,
    fontSize: 9, bold: true, color: C.mint, margin: 0, charSpacing: 3,
  });
  slide.addText('Building a Financial Identity on-Chain', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 22, bold: true, color: C.white, margin: 0,
  });

  // Left: Insights dashboard mock
  const dashX = 0.4, dashY = 1.0, dashW = 4.4, dashH = 3.7;
  slide.addShape('rect', {
    x: dashX, y: dashY, w: dashW, h: dashH,
    fill: { color: C.navy2 },
  });
  // Top bar
  slide.addShape('rect', { x: dashX, y: dashY, w: dashW, h: 0.5, fill: { color: C.navy } });
  slide.addText('📊  Insights', {
    x: dashX + 0.15, y: dashY + 0.08, w: 2, h: 0.35,
    fontSize: 13, bold: true, color: C.white, margin: 0,
  });

  // YTD card
  slide.addShape('rect', {
    x: dashX + 0.15, y: dashY + 0.62, w: dashW - 0.3, h: 0.85,
    fill: { color: C.teal, transparency: 20 },
    line: { color: C.teal, width: 0.8 },
  });
  slide.addText('YTD INCOME', {
    x: dashX + 0.25, y: dashY + 0.65, w: 2, h: 0.25,
    fontSize: 8, bold: true, color: C.mint, margin: 0, charSpacing: 1,
  });
  slide.addText('$2,650.00', {
    x: dashX + 0.25, y: dashY + 0.88, w: 2.5, h: 0.45,
    fontSize: 26, bold: true, color: C.white, margin: 0,
  });

  // Bar chart mock (6 bars)
  const barBase = dashY + 1.6;
  const barData = [55, 75, 60, 90, 50, 65];
  const barLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  barData.forEach((h, i) => {
    const bx = dashX + 0.25 + i * 0.65;
    const bh = h * 0.022;
    slide.addShape('rect', {
      x: bx, y: barBase - bh, w: 0.45, h: bh,
      fill: { color: i === 4 ? C.mint : C.teal, transparency: i === 4 ? 0 : 30 },
    });
    slide.addText(barLabels[i], {
      x: bx - 0.05, y: barBase + 0.02, w: 0.55, h: 0.2,
      fontSize: 7, color: C.muted, align: 'center', margin: 0,
    });
  });

  // Split breakdown
  slide.addShape('rect', {
    x: dashX + 0.15, y: dashY + 2.05, w: dashW - 0.3, h: 0.55,
    fill: { color: C.navy },
    line: { color: C.lightgray, width: 0.3 },
  });
  slide.addText('Family: $1,855  |  Savings: $795', {
    x: dashX + 0.25, y: dashY + 2.12, w: dashW - 0.5, h: 0.4,
    fontSize: 10, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0,
  });

  // Export button
  slide.addShape('rect', {
    x: dashX + 0.15, y: dashY + 2.72, w: dashW - 0.3, h: 0.42,
    fill: { color: C.mint },
  });
  slide.addText('📄  Export Proof of Income', {
    x: dashX + 0.15, y: dashY + 2.72, w: dashW - 0.3, h: 0.42,
    fontSize: 11, bold: true, color: C.navy, align: 'center', valign: 'middle', margin: 0,
  });
  slide.addText('[ Screenshot: src/pages/Insights.tsx ]', {
    x: dashX, y: dashY + dashH + 0.05, w: dashW, h: 0.18,
    fontSize: 7, color: C.muted, align: 'center', margin: 0,
  });

  // Right: Proof of Income + Credit Path
  const rx = 5.1, rw = 4.5;

  // Proof of income doc
  slide.addShape('rect', {
    x: rx, y: 1.0, w: rw, h: 1.75,
    fill: { color: C.white },
    line: { color: C.cardborder, width: 0.8 },
    shadow: { type: 'outer', color: '000000', blur: 6, offset: 2, angle: 135, opacity: 0.08 },
  });
  slide.addShape('rect', { x: rx, y: 1.0, w: rw, h: 0.35, fill: { color: C.teal } });
  slide.addText('📄  PROOF OF INCOME — StellarNest', {
    x: rx + 0.1, y: 1.02, w: rw - 0.2, h: 0.32,
    fontSize: 9, bold: true, color: C.white, valign: 'middle', margin: 0,
  });
  const docLines = [
    'Worker:   Asep Sender  |  Key: GDEMOACCOUNT...',
    'Period:   January 1 — July 14, 2026',
    '────────────────────────────────────',
    '  Jan 15   +$500.00  → Family',
    '  Mar 02   +$750.00  → Family',
    '  Apr 10   +$600.00  → Family',
    '  May 22   +$500.00  → Family',
    '  Jul 08   +$300.00  → Family',
    '────────────────────────────────────',
    '  TOTAL YTD:  $2,650.00',
  ];
  docLines.forEach((line, i) => {
    const isBold = line.startsWith('  TOTAL') || line.includes('──');
    slide.addText(line, {
      x: rx + 0.15, y: 1.38 + i * 0.135, w: rw - 0.3, h: 0.15,
      fontSize: 8, color: isBold ? C.darktext : C.bodytext,
      bold: isBold, margin: 0,
    });
  });

  // Credit path
  slide.addShape('rect', {
    x: rx, y: 2.9, w: rw, h: 0.38,
    fill: { color: C.green, transparency: 85 },
    line: { color: C.green, width: 0.8 },
  });
  slide.addText('💰  Path to Credit — verified on-chain income unlocks loans & mortgages', {
    x: rx + 0.1, y: 2.9, w: rw - 0.2, h: 0.38,
    fontSize: 9, color: C.darktext, valign: 'middle', margin: 0,
  });

  // Three credit milestones
  const milestones = [
    { icon: icons.iFile, title: 'Auto-Generated Statement', body: 'One-click PDF from on-chain data. Verifiable by any bank.' },
    { icon: icons.iClipboard, title: 'Credit Application', body: 'Bank queries on-chain income via read-only API key (worker consents).' },
    { icon: icons.iHandshake, title: 'Micro-Loan Approval', body: 'Consistent 6-month history = auto-approved loans up to $500.' },
  ];
  milestones.forEach((m, i) => {
    const my = 3.4 + i * 0.72;
    slide.addImage({ data: m.icon, x: rx, y: my, w: 0.3, h: 0.3 });
    slide.addText(m.title, {
      x: rx + 0.38, y: my, w: rw - 0.5, h: 0.28,
      fontSize: 10, bold: true, color: C.darktext, margin: 0,
    });
    slide.addText(m.body, {
      x: rx + 0.38, y: my + 0.26, w: rw - 0.5, h: 0.35,
      fontSize: 9, color: C.bodytext, margin: 0,
    });
  });

  addFooter(slide);
  addSlideNumBadge(slide, 6, 10);
}

// ─── SLIDE 7: Technical Architecture ─────────────────────────────────────────
async function slide7(pres, icons) {
  const slide = pres.addSlide();
  slide.background = { color: C.offwhite };

  // Header
  slide.addShape('rect', { x: 0, y: 0, w: 10, h: 0.85, fill: { color: C.navy } });
  slide.addText('TECHNICAL ARCHITECTURE', {
    x: 0.5, y: 0.08, w: 5, h: 0.25,
    fontSize: 9, bold: true, color: C.mint, margin: 0, charSpacing: 3,
  });
  slide.addText('Stack: React 19 · Firebase · Stellar SDK v16', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 22, bold: true, color: C.white, margin: 0,
  });

  // Architecture diagram — 3-tier boxes
  const tiers = [
    {
      label: 'FRONTEND',
      color: C.teal,
      items: [
        { icon: icons.iMobile, name: 'React 19 SPA', sub: '(Vite dev server)' },
        { icon: icons.iCode, name: 'AppContext + Services', sub: 'claim.service, stellar.ts' },
        { icon: icons.iChart, name: 'Insights / Dashboard', sub: 'YTD, charts, proof-of-income' },
      ],
      y: 1.05, h: 1.4,
    },
    {
      label: 'DATA & SYNC',
      color: C.mint,
      items: [
        { icon: icons.iDB, name: 'localStorage', sub: 'Offline-first, sync-first writes' },
        { icon: icons.iServer, name: 'Firebase Firestore', sub: 'Claims, profiles, async sync' },
        { icon: icons.iLock, name: 'AES-256-GCM Keys', sub: 'Encrypted secrets, PBKDF2' },
      ],
      y: 2.55, h: 1.25,
    },
    {
      label: 'STELLAR LAYER',
      color: C.purple,
      items: [
        { icon: icons.iCrypto, name: 'Stellar Testnet', sub: 'horizon-testnet.stellar.org' },
        { icon: icons.iCoins, name: 'USDC Issuer', sub: 'GBBD47IF6LWK7P7MDEVSCWR7...' },
        { icon: icons.iExchange, name: 'Memo: CLAIM:<id>', sub: 'Max 28 bytes (SDK v16)' },
      ],
      y: 3.9, h: 1.25,
    },
  ];

  tiers.forEach((tier) => {
    // Tier bg
    slide.addShape('rect', {
      x: 0.4, y: tier.y, w: 5.5, h: tier.h,
      fill: { color: C.white },
      line: { color: tier.color, width: 1 },
      shadow: { type: 'outer', color: '000000', blur: 5, offset: 1, angle: 135, opacity: 0.06 },
    });
    // Tier label
    slide.addShape('rect', { x: 0.4, y: tier.y, w: 1.5, h: 0.32, fill: { color: tier.color } });
    slide.addText(tier.label, {
      x: 0.45, y: tier.y, w: 1.4, h: 0.32,
      fontSize: 8, bold: true, color: C.white, valign: 'middle', margin: 0, charSpacing: 1,
    });

    // Items
    tier.items.forEach((item, i) => {
      const iy = tier.y + 0.42 + i * ((tier.h - 0.42) / tier.items.length);
      slide.addImage({ data: item.icon, x: 0.55, y: iy, w: 0.28, h: 0.28 });
      slide.addText(item.name, {
        x: 0.9, y: iy, w: 3.5, h: 0.25,
        fontSize: 10, bold: true, color: C.darktext, margin: 0,
      });
      slide.addText(item.sub, {
        x: 0.9, y: iy + 0.22, w: 4, h: 0.2,
        fontSize: 8, color: C.muted, margin: 0,
      });
    });
  });

  // Arrows between tiers
  [[1.05, 2.55], [2.55, 3.9]].forEach(([fy, ty]) => {
    slide.addText('↓', {
      x: 3.05, y: fy + 0.65, w: 0.4, h: 0.3,
      fontSize: 16, color: C.teal, align: 'center', margin: 0,
    });
  });

  // Right: Tech stack grid
  const rx = 6.15, rw = 3.45;
  slide.addShape('rect', {
    x: rx, y: 1.05, w: rw, h: 4.1,
    fill: { color: C.white },
    line: { color: C.cardborder, width: 0.8 },
    shadow: { type: 'outer', color: '000000', blur: 5, offset: 1, angle: 135, opacity: 0.06 },
  });
  slide.addShape('rect', { x: rx, y: 1.05, w: rw, h: 0.38, fill: { color: C.navy } });
  slide.addText('⚙️  Tech Stack', {
    x: rx + 0.1, y: 1.07, w: rw - 0.2, h: 0.35,
    fontSize: 11, bold: true, color: C.white, valign: 'middle', margin: 0,
  });

  const stackItems = [
    ['React 19', 'Frontend SPA'],
    ['React Router 7', 'Client routing'],
    ['Vite 8', 'Build & HMR'],
    ['Firebase 12', 'Auth + Firestore'],
    ['stellar-sdk 16', 'Horizon API'],
    ['Tailwind CSS 3.4', 'Design system'],
    ['Web Crypto API', 'AES-GCM crypto'],
    ['Playwright', 'E2E testing'],
  ];
  stackItems.forEach(([name, role], i) => {
    const sy = 1.5 + i * 0.43;
    const isOdd = i % 2 === 0;
    slide.addShape('rect', {
      x: rx + 0.1, y: sy, w: rw - 0.2, h: 0.4,
      fill: { color: isOdd ? C.offwhite : C.white },
    });
    slide.addText(name, {
      x: rx + 0.2, y: sy + 0.02, w: 1.6, h: 0.2,
      fontSize: 9, bold: true, color: C.darktext, margin: 0,
    });
    slide.addText(role, {
      x: rx + 0.2, y: sy + 0.2, w: rw - 0.4, h: 0.18,
      fontSize: 8, color: C.muted, margin: 0,
    });
  });

  // MOCK_MODE note
  slide.addShape('rect', {
    x: rx, y: 5.0, w: rw, h: 0.42,
    fill: { color: C.yellow, transparency: 85 },
    line: { color: C.yellow, width: 0.8 },
  });
  slide.addText('💡 MOCK_MODE=true (dev)  /  false (production)', {
    x: rx + 0.1, y: 5.0, w: rw - 0.2, h: 0.42,
    fontSize: 8, color: C.darktext, valign: 'middle', margin: 0,
  });

  addFooter(slide);
  addSlideNumBadge(slide, 7, 10);
}

// ─── SLIDE 8: Security Architecture ───────────────────────────────────────────
async function slide8(pres, icons) {
  const slide = pres.addSlide();
  slide.background = { color: C.navy };

  // Decorative circles
  slide.addShape('ellipse', { x: -1, y: -1, w: 4, h: 4, fill: { color: C.teal, transparency: 92 } });
  slide.addShape('ellipse', { x: 8, y: 3.5, w: 3, h: 3, fill: { color: C.mint, transparency: 93 } });

  // Header
  slide.addText('SECURITY ARCHITECTURE', {
    x: 0.5, y: 0.2, w: 5, h: 0.25,
    fontSize: 9, bold: true, color: C.mint, margin: 0, charSpacing: 3,
  });
  slide.addText('AES-256-GCM · PBKDF2 100K · Zero Server Exposure', {
    x: 0.5, y: 0.42, w: 9, h: 0.55,
    fontSize: 22, bold: true, color: C.white, margin: 0,
  });

  // Flow diagram — 5 steps
  const steps = [
    {
      num: '1', icon: icons.iEmail,
      title: 'Firebase UID', color: C.teal,
      body: 'Anonymous Auth gives each user a unique, stable UID.',
      sub: 'e.g. "abc123xyz"',
    },
    {
      num: '2', icon: icons.iKey,
      title: 'PBKDF2 Key Derivation', color: C.mint,
      body: 'UID + 100,000 rounds SHA-256 → 256-bit AES key.',
      sub: 'NIST SP 800-132',
    },
    {
      num: '3', icon: icons.iLock,
      title: 'AES-256-GCM Encrypt', color: C.teal2,
      body: 'Random IV per operation. Authenticated encryption.',
      sub: 'NIST SP 800-38D',
    },
    {
      num: '4', icon: icons.iDB,
      title: 'Store in Firestore', color: C.purple,
      body: 'base64(salt[16] || ct || iv[12]) stored as encryptedSecret.',
      sub: 'Unreadable without UID',
    },
    {
      num: '5', icon: icons.iShield,
      title: 'In-Memory Only', color: C.green,
      body: 'Decrypted secret lives in walletSecretRef (React useRef). Never serialized.',
      sub: 'Gone on sign-out',
    },
  ];

  const cw = 1.72, ch = 1.85, gap = 0.1;
  steps.forEach((s, i) => {
    const sx = 0.4 + i * (cw + gap);
    const sy = 1.1;
    // Card
    slide.addShape('rect', {
      x: sx, y: sy, w: cw, h: ch,
      fill: { color: C.white, transparency: 8 },
      line: { color: s.color, width: 1 },
    });
    // Top bar
    slide.addShape('rect', { x: sx, y: sy, w: cw, h: 0.06, fill: { color: s.color } });
    // Number badge
    slide.addShape('ellipse', {
      x: sx + cw / 2 - 0.18, y: sy + 0.14, w: 0.36, h: 0.36,
      fill: { color: s.color },
    });
    slide.addText(s.num, {
      x: sx + cw / 2 - 0.18, y: sy + 0.14, w: 0.36, h: 0.36,
      fontSize: 11, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0,
    });
    // Icon
    slide.addImage({ data: s.icon, x: sx + cw / 2 - 0.2, y: sy + 0.55, w: 0.4, h: 0.4 });
    // Title
    slide.addText(s.title, {
      x: sx + 0.1, y: sy + 0.98, w: cw - 0.2, h: 0.32,
      fontSize: 9, bold: true, color: C.white, align: 'center', margin: 0,
    });
    // Body
    slide.addText(s.body, {
      x: sx + 0.1, y: sy + 1.28, w: cw - 0.2, h: 0.35,
      fontSize: 8, color: C.offwhite, align: 'center', margin: 0,
    });
    // Sub
    slide.addText(s.sub, {
      x: sx + 0.1, y: sy + 1.62, w: cw - 0.2, h: 0.2,
      fontSize: 7, color: s.color, align: 'center', margin: 0,
    });
    // Arrow
    if (i < steps.length - 1) {
      slide.addText('→', {
        x: sx + cw, y: sy + 0.75, w: gap + 0.05, h: 0.35,
        fontSize: 14, color: C.muted, align: 'center', valign: 'middle', margin: 0,
      });
    }
  });

  // Spec table
  slide.addShape('rect', {
    x: 0.4, y: 3.1, w: 9.2, h: 1.95,
    fill: { color: C.white, transparency: 6 },
    line: { color: C.teal, width: 0.8 },
  });
  slide.addText('🔐  Security Specification', {
    x: 0.5, y: 3.15, w: 4, h: 0.32,
    fontSize: 10, bold: true, color: C.mint, margin: 0,
  });

  const specs = [
    ['Algorithm', 'AES-256-GCM', 'NIST SP 800-38D'],
    ['Key Derivation', 'PBKDF2-SHA256', 'NIST SP 800-132'],
    ['PBKDF2 Rounds', '100,000', 'OWASP 2023 recommendation'],
    ['Salt / IV', '128-bit / 96-bit', 'Unique per encryption'],
    ['Secret Storage', 'Firestore (encrypted)', 'Never in localStorage'],
    ['In-Memory', 'React useRef', 'Cleared on sign-out'],
  ];
  specs.forEach(([k, v, std], i) => {
    const sy = 3.5 + i * 0.26;
    const isOdd = i % 2 === 0;
    slide.addShape('rect', {
      x: 0.5, y: sy, w: 9, h: 0.25,
      fill: { color: C.navy, transparency: isOdd ? 0 : 30 },
    });
    slide.addText(k, {
      x: 0.6, y: sy, w: 1.8, h: 0.25,
      fontSize: 8.5, bold: true, color: C.mint, valign: 'middle', margin: 0,
    });
    slide.addText(v, {
      x: 2.5, y: sy, w: 2.5, h: 0.25,
      fontSize: 8.5, color: C.white, valign: 'middle', margin: 0,
    });
    slide.addText(std, {
      x: 5.1, y: sy, w: 4.3, h: 0.25,
      fontSize: 8, color: C.muted, valign: 'middle', margin: 0,
    });
  });

  addFooter(slide);
  addSlideNumBadge(slide, 8, 10);
}

// ─── SLIDE 9: Market & Business Model ────────────────────────────────────────
async function slide9(pres, icons) {
  const slide = pres.addSlide();
  slide.background = { color: C.offwhite };

  // Header
  slide.addShape('rect', { x: 0, y: 0, w: 10, h: 0.85, fill: { color: C.navy } });
  slide.addText('MARKET & BUSINESS MODEL', {
    x: 0.5, y: 0.08, w: 6, h: 0.25,
    fontSize: 9, bold: true, color: C.mint, margin: 0, charSpacing: 3,
  });
  slide.addText('$150B Market. One Percent Captured = $1.5B.', {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 20, bold: true, color: C.white, margin: 0,
  });

  // TAM visualization — horizontal bars
  const bars = [
    { label: 'Total ASEAN Remittances', val: 150, unit: '$B', pct: 100, color: C.navy },
    { label: 'Current fees paid (5–7%)', val: 10, unit: '$B', pct: 6.7, color: C.red },
    { label: 'StellarNest target (0.5%)', val: 0.75, unit: '$B', pct: 0.5, color: C.teal },
  ];
  const barMaxW = 5.5;
  bars.forEach((b, i) => {
    const by = 1.05 + i * 0.72;
    slide.addText(b.label, {
      x: 0.4, y: by, w: 3.2, h: 0.28,
      fontSize: 10, color: C.darktext, valign: 'middle', margin: 0,
    });
    slide.addShape('rect', {
      x: 3.7, y: by + 0.02, w: barMaxW, h: 0.28,
      fill: { color: C.lightgray },
    });
    slide.addShape('rect', {
      x: 3.7, y: by + 0.02, w: barMaxW * (b.pct / 100), h: 0.28,
      fill: { color: b.color },
    });
    slide.addText(`${b.val}${b.unit}`, {
      x: 3.7 + barMaxW * (b.pct / 100) + 0.1, y: by, w: 1, h: 0.28,
      fontSize: 10, bold: true, color: b.color, valign: 'middle', margin: 0,
    });
  });

  // Three revenue streams
  slide.addText('REVENUE STREAMS', {
    x: 0.4, y: 3.2, w: 4, h: 0.28,
    fontSize: 9, bold: true, color: C.muted, margin: 0, charSpacing: 2,
  });

  const streams = [
    {
      icon: icons.iMoney, title: 'Transaction Fee (0.5%)',
      body: 'Applied on sender side. Recipient receives full amount. $500 × 10 tx × 10K users = $250K/mo.',
      color: C.teal, tag: 'PRIMARY',
    },
    {
      icon: icons.iExchange, title: 'Anchor Corridor Fee',
      body: 'Stellar membrane partners (Flip, Sakto, VietinBank) pay per settled tx. StellarNest takes 30% revenue share.',
      color: C.purple, tag: 'B2B',
    },
    {
      icon: icons.iChartBar, title: 'Micro-Loan Origination',
      body: '3% fee on approved loans. On-chain income history drives 30-second auto-approval for ≤$500 loans.',
      color: C.green, tag: 'UPSELL',
    },
  ];

  const sw = 2.9, sh = 1.45, sy2 = 3.52;
  streams.forEach((s, i) => {
    const sx = 0.4 + i * (sw + 0.18);
    // Card
    slide.addShape('rect', {
      x: sx, y: sy2, w: sw, h: sh,
      fill: { color: C.white },
      line: { color: s.color, width: 1 },
      shadow: { type: 'outer', color: '000000', blur: 5, offset: 1, angle: 135, opacity: 0.07 },
    });
    // Tag
    slide.addShape('rect', {
      x: sx + sw - 0.7, y: sy2 + 0.08, w: 0.62, h: 0.22,
      fill: { color: s.color },
    });
    slide.addText(s.tag, {
      x: sx + sw - 0.7, y: sy2 + 0.08, w: 0.62, h: 0.22,
      fontSize: 7, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0,
    });
    // Icon
    slide.addImage({ data: s.icon, x: sx + 0.15, y: sy2 + 0.38, w: 0.4, h: 0.4 });
    // Title
    slide.addText(s.title, {
      x: sx + 0.6, y: sy2 + 0.38, w: sw - 0.75, h: 0.4,
      fontSize: 10, bold: true, color: C.darktext, margin: 0,
    });
    // Body
    slide.addText(s.body, {
      x: sx + 0.15, y: sy2 + 0.82, w: sw - 0.3, h: 0.55,
      fontSize: 8.5, color: C.bodytext, margin: 0,
    });
  });

  addFooter(slide);
  addSlideNumBadge(slide, 9, 10);
}

// ─── SLIDE 10: Vision & Roadmap ───────────────────────────────────────────────
async function slide10(pres, icons) {
  const slide = pres.addSlide();
  slide.background = { color: C.navy };

  // Background
  slide.addShape('ellipse', { x: -2, y: -2, w: 6, h: 6, fill: { color: C.teal, transparency: 93 } });
  slide.addShape('ellipse', { x: 7, y: 2, w: 5, h: 5, fill: { color: C.mint, transparency: 94 } });

  // Header
  slide.addText('THE VISION', {
    x: 0.5, y: 0.2, w: 4, h: 0.25,
    fontSize: 9, bold: true, color: C.mint, margin: 0, charSpacing: 3,
  });
  slide.addText('From Testnet MVP to ASEAN Infrastructure', {
    x: 0.5, y: 0.42, w: 9, h: 0.55,
    fontSize: 24, bold: true, color: C.white, margin: 0,
  });

  // Timeline
  const phases = [
    {
      phase: 'NOW', label: 'TESTNET MVP', color: C.green,
      items: ['✅ USDC testnet live', '✅ Magic Claim Links', '✅ 70/30 Split-Routing', '✅ 6 ASEAN corridors', '✅ Demo mode ($2,650 YTD)'],
      y: 1.05,
    },
    {
      phase: 'Q3 2026', label: 'MAINNET LAUNCH', color: C.teal,
      items: ['🏦 6 corridors live', '🏦 Flip, Sakto, VietinBank anchors', '📄 Proof of Income API', '🔐 Security audit (Trail of Bits)', '📱 React Native mobile app'],
      y: 1.05,
    },
    {
      phase: '2027', label: 'MICRO-LOAN BETA', color: C.mint,
      items: ['🤝 2 bank partners (BCA, BRI)', '💰 Loan origination beta', '🌏 Thailand + Malaysia live', '📊 Income API v2.0', '🏦 5 more bank partners'],
      y: 1.05,
    },
    {
      phase: '2028+', label: 'ASEAN SCALE', color: C.yellow,
      items: ['🌍 10+ countries, 20+ corridors', '💰 $5M+ ARR', '🏦 Central bank DSP integration', '🚀 1M+ active users', '💱 SEP-24/31 native support'],
      y: 1.05,
    },
  ];

  // Timeline axis
  slide.addShape('rect', {
    x: 0.55, y: 1.05, w: 0.04, h: 3.7,
    fill: { color: C.muted, transparency: 50 },
  });

  const pw = 2.15, ph = 3.7, gap = 0.1;
  phases.forEach((p, i) => {
    const px = 0.4 + i * (pw + gap);

    // Phase card
    slide.addShape('rect', {
      x: px, y: p.y, w: pw, h: ph,
      fill: { color: C.white, transparency: 8 },
      line: { color: p.color, width: 1 },
    });
    // Top bar
    slide.addShape('rect', { x: px, y: p.y, w: pw, h: 0.06, fill: { color: p.color } });
    // Phase badge
    slide.addShape('rect', {
      x: px + 0.1, y: p.y + 0.12, w: 0.9, h: 0.32,
      fill: { color: p.color },
    });
    slide.addText(p.phase, {
      x: px + 0.1, y: p.y + 0.12, w: 0.9, h: 0.32,
      fontSize: 8, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0,
    });
    slide.addText(p.label, {
      x: px + 1.05, y: p.y + 0.12, w: pw - 1.15, h: 0.32,
      fontSize: 8, bold: true, color: p.color, valign: 'middle', margin: 0,
    });

    // Items
    p.items.forEach((item, j) => {
      slide.addText('›', {
        x: px + 0.1, y: p.y + 0.55 + j * 0.6, w: 0.2, h: 0.35,
        fontSize: 12, color: p.color, margin: 0,
      });
      slide.addText(item, {
        x: px + 0.28, y: p.y + 0.55 + j * 0.6, w: pw - 0.38, h: 0.5,
        fontSize: 9, color: C.darktext, margin: 0,
      });
    });

    // Timeline dot
    slide.addShape('ellipse', {
      x: px + pw / 2 - 0.1, y: p.y + ph + 0.02, w: 0.2, h: 0.2,
      fill: { color: p.color },
    });
  });

  // CTA
  slide.addShape('rect', {
    x: 0, y: 4.85, w: 10, h: 0.775,
    fill: { color: C.navy2 },
  });
  slide.addText('StellarNest isn\'t just a payments app. It\'s a financial identity system built on the most efficient, most inclusive blockchain network in the world.', {
    x: 0.5, y: 4.88, w: 9, h: 0.38,
    fontSize: 10, color: C.lightgray, align: 'center', valign: 'middle', margin: 0,
  });
  slide.addText('🌏  github.com/seppam/stellarnest  |  stellarnest.vercel.app', {
    x: 0.5, y: 5.22, w: 9, h: 0.3,
    fontSize: 10, bold: true, color: C.mint, align: 'center', valign: 'middle', margin: 0,
  });

  addSlideNumBadge(slide, 10, 10);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('⏳ Preloading icons...');
  const icons = await preloadIcons();

  console.log('⏳ Creating presentation...');
  const pres = new pptxgenjs();
  pres.layout = 'LAYOUT_16x9';
  pres.title = 'StellarNest — APAC Stellar Hackathon 2026';
  pres.author = 'StellarNest Team';
  pres.subject = 'Pitch Deck';
  pres.company = 'StellarNest';

  await slide1(pres, icons);
  console.log('  ✓ Slide 1 — Title');
  await slide2(pres, icons);
  console.log('  ✓ Slide 2 — Problem');
  await slide3(pres, icons);
  console.log('  ✓ Slide 3 — Solution');
  await slide4(pres, icons);
  console.log('  ✓ Slide 4 — Sender Walkthrough');
  await slide5(pres, icons);
  console.log('  ✓ Slide 5 — Recipient Walkthrough');
  await slide6(pres, icons);
  console.log('  ✓ Slide 6 — Financial Inclusion');
  await slide7(pres, icons);
  console.log('  ✓ Slide 7 — Technical Architecture');
  await slide8(pres, icons);
  console.log('  ✓ Slide 8 — Security Architecture');
  await slide9(pres, icons);
  console.log('  ✓ Slide 9 — Market & Business');
  await slide10(pres, icons);
  console.log('  ✓ Slide 10 — Vision & Roadmap');

  const outPath = path.join(__dirname, '..', 'PITCH_DECK_STELLARNEST_APAC2026.pptx');
  await pres.writeFile({ fileName: outPath });
  console.log(`\n✅  Saved: ${outPath}`);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
