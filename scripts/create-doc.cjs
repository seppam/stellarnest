/**
 * StellarNest — Project Documentation DOCX Generator
 * Run: NODE_PATH=$(npm root -g) node scripts/create-doc.cjs
 */
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
        ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
        UnderlineType } = require('docx');
const fs = require('fs');
const path = require('path');

// ─── Colours & constants ────────────────────────────────────────
const NAVY    = '1A3A5C';
const TEAL    = '0D7377';
const GOLD    = 'C9A84C';
const LIGHT   = 'EEF4F8';
const MID     = 'D0E4F0';
const WHITE   = 'FFFFFF';
const DARK    = '1E2A3A';
const GREY    = '555555';
const GREEN   = '1A7A4A';
const RED     = 'C0392B';

const PAGE_W  = 12240;  // US Letter, DXA
const PAGE_H  = 15840;
const MARGIN  = 1080;   // 0.75 inch
const CONTENT = PAGE_W - MARGIN * 2;  // 10080

// ─── Helpers ───────────────────────────────────────────────────
function spacer(pt = 6) {
  return new Paragraph({ children: [new TextRun('')], spacing: { before: 0, after: pt * 20 } });
}

function divider(color = MID) {
  return new Paragraph({
    children: [new TextRun('')],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color } },
    spacing: { before: 60, after: 60 },
  });
}

const border = { style: BorderStyle.SINGLE, size: 4, color: MID };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function cell(children, widthDxa, opts = {}) {
  const { fill = WHITE, bold = false, align = AlignmentType.LEFT, vAlign = VerticalAlign.TOP, colspan = 1 } = opts;
  return new TableCell({
    borders: opts.noBorder ? noBorders : borders,
    width: { size: widthDxa, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: vAlign,
    columnSpan: colspan,
    children: Array.isArray(children) ? children : [
      new Paragraph({
        alignment: align,
        children: [new TextRun({ text: children, bold, font: 'Arial', size: 18, color: DARK })],
      }),
    ],
  });
}

function headerCell(text, widthDxa, fill = NAVY) {
  return new TableCell({
    borders,
    width: { size: widthDxa, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, font: 'Arial', size: 18, color: WHITE })],
    })],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: 'Arial', size: 36, bold: true, color: NAVY })],
    spacing: { before: 320, after: 160 },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: 'Arial', size: 26, bold: true, color: TEAL })],
    spacing: { before: 240, after: 120 },
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, font: 'Arial', size: 22, bold: true, color: DARK })],
    spacing: { before: 180, after: 80 },
  });
}

function p(text, opts = {}) {
  const { bold = false, color = GREY, size = 20, spacing = { before: 60, after: 100 }, align = AlignmentType.LEFT, italic = false } = opts;
  return new Paragraph({
    alignment: align,
    spacing,
    children: [new TextRun({ text, font: 'Arial', size, bold, italic, color })],
  });
}

function bullet(text, level = 0, color = GREY) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: 'Arial', size: 20, color })],
  });
}

function badge(text, fillColor = TEAL) {
  return new TextRun({ text: `  ${text}  `, font: 'Arial', size: 18, bold: true, color: WHITE,
    shading: { type: ShadingType.CLEAR, fill: fillColor } });
}

// ─── Cover block ────────────────────────────────────────────────
function coverSection() {
  return [
    // Top colour band
    new Table({
      width: { size: CONTENT, type: WidthType.DXA },
      columnWidths: [CONTENT],
      rows: [new TableRow({ children: [
        new TableCell({
          borders: noBorders,
          width: { size: CONTENT, type: WidthType.DXA },
          shading: { fill: NAVY, type: ShadingType.CLEAR },
          margins: { top: 600, bottom: 400, left: 400, right: 400 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 },
              children: [new TextRun({ text: 'STELLARNEST', font: 'Arial', size: 52, bold: true, color: WHITE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 },
              children: [new TextRun({ text: 'Borderless Payments for the APAC Workforce', font: 'Arial', size: 26, color: GOLD })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 },
              children: [new TextRun({ text: 'Powered by Stellar Blockchain', font: 'Arial', size: 20, italics: true, color: MID })] }),
          ],
        }),
      ]})],
    }),
    spacer(12),
    // Meta bar
    new Table({
      width: { size: CONTENT, type: WidthType.DXA },
      columnWidths: [CONTENT],
      rows: [new TableRow({ children: [
        new TableCell({
          borders: noBorders,
          width: { size: CONTENT, type: WidthType.DXA },
          shading: { fill: LIGHT, type: ShadingType.CLEAR },
          margins: { top: 200, bottom: 200, left: 400, right: 400 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 },
              children: [
                new TextRun({ text: 'APAC Stellar Hackathon Submission  |  July 2026', font: 'Arial', size: 20, color: TEAL, bold: true }),
              ] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 },
              children: [
                new TextRun({ text: 'Team: StellarNest  |  Project ID: stellarnest-hackathon  |  Network: Stellar Testnet', font: 'Arial', size: 18, color: GREY }),
              ] }),
          ],
        }),
      ]})],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ─── Competitor table ───────────────────────────────────────────
function competitorTable() {
  const cols = [2400, 1600, 1600, 1600, 1680, 1200];
  const headers = ['Feature', 'StellarNest', 'Wise', 'Remitly', 'Western Union', 'Traditional Bank'];
  const rows = [
    ['Cross-border payment', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Blockchain-powered (Stellar)', 'Yes', 'No', 'No', 'No', 'No'],
    ['Magic Claim Links', 'Yes', 'No', 'No', 'No', 'No'],
    ['Split-Routing (Family + Savings)', 'Yes', 'No', 'Partial', 'No', 'No'],
    ['Built-in Proof of Income', 'Yes', 'No', 'No', 'No', 'No'],
    ['Insights Dashboard', 'Yes', 'Partial', 'No', 'No', 'No'],
    ['No bank account needed (recipient)', 'Yes', 'No', 'No', 'No', 'No'],
    ['AES-GCM encrypted secrets', 'Yes', 'N/A', 'N/A', 'N/A', 'N/A'],
    ['Designed for Indonesian WF/wokers', 'Yes', 'No', 'No', 'No', 'Partial'],
    ['Crypto/on-chain settlement', 'Yes', 'No', 'No', 'No', 'No'],
    ['Transaction speed', '<5 seconds', '1-2 days', 'Minutes-Hours', '1-5 days', '2-5 days'],
    ['Target fee structure', 'Low (<1%)', 'Low-Med', 'Medium', 'High', 'High'],
    ['Demo/Local-first (no KYC)', 'Yes', 'No', 'No', 'No', 'No'],
  ];

  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: cols,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => headerCell(h, cols[i])),
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((text, i) => {
          const isOurs = i === 1;
          const isYes = text === 'Yes';
          const isNo = text === 'No';
          const isGood = ['<5 seconds', 'Low (<1%)', 'Yes'].includes(text);
          const isBad = ['1-5 days', '2-5 days', 'High', 'No, partial'].some(t => text.includes(t.split(' ')[0]));
          let fill = WHITE;
          if (isOurs && isYes) fill = 'E8F5E9';
          else if (!isOurs && isYes) fill = 'F5F5F5';
          else if (!isOurs && !isYes && text !== 'Yes' && text !== 'No') fill = WHITE;
          else if (!isOurs && isNo) fill = 'FAFAFA';
          let color = DARK;
          if (isYes && isOurs) color = GREEN;
          if (isNo && !isOurs) color = '999999';
          return cell(text, cols[i], { fill: isOurs ? 'EAF4FB' : fill, bold: isOurs && i === 1, color, align: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER });
        }),
      })),
    ],
  });
}

// ─── Tech stack table ─────────────────────────────────────────
function techStackTable() {
  const cols = [2200, 2600, 5280];
  const rows = [
    ['Frontend', 'React 18 + TypeScript', 'Component-based UI with hooks and context. HashRouter for navigation.'],
    ['Build Tool', 'Vite 8', 'Fast HMR, env var injection (VITE_ prefix), tree-shaking.'],
    ['Styling', 'Tailwind CSS', 'Custom design tokens, responsive mobile-first layout.'],
    ['Blockchain', '@stellar/stellar-sdk v16', 'Horizon API, payment transactions, trustline management.'],
    ['Backend', 'Firebase (Firestore + Auth)', 'Real-time database, email/password auth, composite indexes.'],
    ['Encryption', 'Web Crypto API (AES-GCM)', 'PBKDF2 key derivation, client-side only, Firebase UID as key.'],
    ['Icons', 'Lucide React', 'Open-source icon set, tree-shakeable.'],
    ['Dev Port', 'Vite dev server :5173', 'BrowserRouter; routes: /, /auth, /dashboard, /send, /claim, /insights, /profile, /history'],
  ];
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: cols,
    rows: [
      new TableRow({ tableHeader: true, children: [
        headerCell('Layer', cols[0]), headerCell('Technology', cols[1]), headerCell('Notes', cols[2]),
      ]}),
      ...rows.map(([layer, tech, note]) => new TableRow({ children: [
        cell(layer, cols[0], { fill: LIGHT, bold: true }),
        cell(tech, cols[1], { fill: WHITE, bold: true, color: NAVY }),
        cell(note, cols[2]),
      ]})),
    ],
  });
}

// ─── Feature table ─────────────────────────────────────────────
function featureTable() {
  const cols = [2400, 5040, 2640];
  const rows = [
    ['Magic Claim Links', 'Sender creates a claim → generates shareable URL → recipient opens link and claims funds without needing a bank account or app install.', 'claimId-based routing, 24h expiry, Stellar payment channel.'],
    ['Split-Routing', 'Every transfer is auto-split: configurable % to family (default 70%) and % to savings/emergency fund (default 30%).', 'Stored in claim record, credited to emergencyFundBalanceUSD on claim creation.'],
    ['Proof of Income', 'Dashboard aggregates all received transactions and generates a verifiable income summary for bank loan applications.', 'Pulls from Firestore transaction ledger, displays YTD income + per-transaction breakdown.'],
    ['Insights Dashboard', 'Visual analytics: total sent/received, family vs. savings breakdown, monthly trends, year-to-date income.', 'Categorizes transactions by type (sent/received), computes % distributions.'],
    ['Stellar USDC Faucet', 'Treasury account on testnet self-mints USDC and acts as faucet for onboarding new users.', 'Trustline establishment, self-mint via PaymentOperation, 1,000 USDC initial supply.'],
    ['Encrypted Secret Storage', 'Stellar secret keys are encrypted client-side with AES-GCM before any Firestore write. Key = Firebase UID.', 'PBKDF2 100k iterations, salt=16B, IV=12B, no third-party crypto deps.'],
  ];
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: cols,
    rows: [
      new TableRow({ tableHeader: true, children: [
        headerCell('Feature', cols[0]), headerCell('Description', cols[1]), headerCell('Implementation', cols[2]),
      ]}),
      ...rows.map(([feat, desc, impl]) => new TableRow({ children: [
        cell(feat, cols[0], { fill: LIGHT, bold: true, color: NAVY }),
        cell(desc, cols[1]),
        cell(impl, cols[2], { fill: 'F0F8FF', color: TEAL }),
      ]})),
    ],
  });
}

// ─── USPs ──────────────────────────────────────────────────────
function uspTable() {
  const cols = [CONTENT];
  const usps = [
    { icon: '1', title: 'Purpose-Built for APAC', body: 'Unlike Western-centric incumbents, StellarNest is designed around the specific workflows of Indonesian gig workers, freelancers, and migrant laborers — people who send money home regularly, split income between family and savings, and need verifiable income records for formal banking.' },
    { icon: '2', title: 'No Bank Account Required to Receive', body: 'Traditional remittance requires a bank account. StellarNest\'s Magic Claim Links let recipients with just a phone number and an internet connection claim funds directly. This dramatically lowers the barrier to entry for rural Indonesia.' },
    { icon: '3', title: 'Automated Split-Routing', body: 'No other remittance app automates the 70/30 family-to-savings split at the protocol level. StellarNest encodes this logic into every payment, building financial discipline into every transaction automatically.' },
    { icon: '4', title: 'On-Chain Transparency & Speed', body: 'Settlements happen in under 5 seconds on the Stellar testnet with near-zero fees. Every transaction is publicly verifiable on-chain — unlike SWIFT-based systems where tracing a payment requires bank investigator intervention.' },
    { icon: '5', title: 'Client-Side Encryption First', body: 'Stellar secrets never leave the user\'s device unencrypted. Even in the worst-case scenario (Firestore breach), the encrypted blobs are cryptographically protected by the user\'s Firebase UID — no third-party HSM or KMS required.' },
    { icon: '6', title: 'Built-In Proof of Income', body: 'For Indonesian workers seeking bank loans, car loans, or apartment rentals, proof of income is a major friction point. StellarNest\'s Insights dashboard generates a verifiable, timestamped income record directly from on-chain + Firestore data.' },
  ];
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: cols,
    rows: usps.map(({ icon, title, body }) => new TableRow({ children: [
      new TableCell({
        borders,
        width: { size: CONTENT, type: WidthType.DXA },
        margins: { top: 160, bottom: 160, left: 200, right: 200 },
        children: [
          new Paragraph({ spacing: { before: 0, after: 80 }, children: [
            new TextRun({ text: `${icon}.  `, font: 'Arial', size: 22, bold: true, color: TEAL }),
            new TextRun({ text: title, font: 'Arial', size: 22, bold: true, color: NAVY }),
          ]}),
          new Paragraph({ spacing: { before: 0, after: 0 }, children: [
            new TextRun({ text: body, font: 'Arial', size: 20, color: GREY }),
          ]}),
        ],
      }),
    ]})),
  });
}

// ─── Document assembly ────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022',
          alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 560, hanging: 280 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '\u25E6',
          alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 280 } } } }] },
      { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.',
          alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 20, color: GREY } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: NAVY },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: TEAL },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, font: 'Arial', color: DARK },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_W, height: PAGE_H },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: MID } },
          spacing: { before: 0, after: 120 },
          children: [
            new TextRun({ text: 'StellarNest — Project Documentation', font: 'Arial', size: 16, color: '999999', italics: true }),
          ],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: MID } },
          spacing: { before: 120, after: 0 },
          children: [
            new TextRun({ text: 'APAC Stellar Hackathon 2026  |  Page ', font: 'Arial', size: 16, color: '999999' }),
            new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: '999999' }),
            new TextRun({ text: ' of ', font: 'Arial', size: 16, color: '999999' }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 16, color: '999999' }),
          ],
        })],
      }),
    },
    children: [
      // ── Cover ──────────────────────────────────────────────
      ...coverSection(),

      // ── Executive Summary ──────────────────────────────────
      h1('1. Executive Summary'),
      p('StellarNest is a cross-border payment application built on the Stellar blockchain, designed specifically for Indonesian migrant workers, freelancers, and remote employees in the APAC region. The platform solves three critical pain points in international remittance: prohibitively high fees, the requirement for recipients to have a bank account, and the lack of verifiable income records for formal financial services.'),
      spacer(4),
      p('At its core, StellarNest enables users to send money home via shareable "Magic Claim Links" — URL-based payment tokens that recipients can claim without installing an app or holding a bank account. Every transfer is automatically split between family support and an emergency savings fund, instilling financial discipline at the protocol level. The app also provides an Insights dashboard that generates timestamped income reports, helping workers build the credit histories needed to access bank loans, vehicle financing, or rental agreements in Indonesia.'),
      spacer(4),
      p('The application is submitted to the APAC Stellar Hackathon (July 2026), with Demo Day on July 18 and the Grand Finale on July 24.'),
      spacer(8),

      // ── Problem Statement ──────────────────────────────────
      h1('2. Problem Statement'),
      h2('2.1 The Remittance Reality for APAC Workers'),
      p('Indonesian migrant workers and freelancers face a broken remittance system:'),
      bullet('Average remittance fee globally: 6.2% of transaction value (World Bank, 2024) — for a \$500 monthly send, that is \$31 lost per transaction, \$372 per year.'),
      bullet('Settlement times with traditional banks: 2-5 business days, causing cash-flow stress for families waiting on school fees, medical bills, or rent.'),
      bullet('Recipients in rural Indonesia often lack bank accounts — the remittance becomes inaccessible and requires a secondary trip to an agent location.'),
      bullet('No credit history: Workers sending money for 12+ months cannot produce a verifiable income statement for bank loans, car financing, or landlord references.'),
      bullet('No savings mechanism: Without automation, 100% of remittances go to immediate consumption; nothing is systematically set aside for emergencies.'),
      spacer(4),

      h2('2.2 Target Users'),
      bullet('Primary: Indonesian migrant domestic workers in Hong Kong, Singapore, Malaysia, and the Middle East'),
      bullet('Secondary: Indonesian freelancers and remote workers paid in USD/stablecoins via Upwork, Fiverr, or direct clients'),
      bullet('Tertiary: Indonesian gig economy workers (Gojek drivers, Tokopedia sellers) receiving cross-border payments'),
      spacer(8),

      // ── Solution ───────────────────────────────────────────
      h1('3. Solution Overview'),
      h2('3.1 Core Product: Magic Claim Links'),
      p('Instead of requiring the recipient to have a bank account or crypto wallet, StellarNest generates a unique, time-limited URL (e.g., stellarnest.com/claim/abc123). The sender shares this link via WhatsApp, SMS, or email. The recipient opens the link, enters their bank details once, and claims the funds. The entire flow takes under 2 minutes on the recipient\'s first claim.'),
      spacer(4),
      p('This is fundamentally different from P2P apps like Wise, which require both sender and recipient to have accounts. StellarNest\'s model mirrors cash-in-hand but with on-chain provability and automatic splitting.'),
      spacer(4),

      h2('3.2 Split-Routing: 70/30 by Default'),
      p('Every Magic Claim Link embeds a configurable split ratio (default: 70% to family, 30% to emergency savings). When the recipient claims the funds, the smart contract equivalent on Stellar automatically allocates the correct amounts. The savings portion accumulates in the sender\'s on-platform emergency fund balance, visible in the Insights dashboard.'),
      spacer(4),

      h2('3.3 Proof of Income Engine'),
      p('The Insights dashboard aggregates all received transactions with timestamps, counterparty names, and amounts. Workers can export a formatted income summary — useful for bank loan applications, visa renewals, or rental agreements in Indonesia.'),
      spacer(8),

      // ── Market & Business Model ─────────────────────────────
      h1('4. Market Opportunity & Business Model'),
      h2('4.1 Market Size'),
      bullet('Indonesian overseas workers: ~4.5 million (BNP2TKI, 2024)'),
      bullet('Indonesian freelancers & gig workers: ~24 million (BPS, 2024)'),
      bullet('Annual personal remittances to Indonesia: ~\$16.5 billion (World Bank)'),
      bullet('Average fee paid on Indonesia remittances: 4.8% — representing a \$792M annual fee pool'),
      spacer(4),

      h2('4.2 Revenue Model'),
      bullet('Transaction fee: 0.5% per Magic Claim Link settled (vs. 4-6% industry average)'),
      bullet('Premium tier (\$2.99/month): Unlimited claims, priority support, PDF proof-of-income exports'),
      bullet('B2B: HR departments and recruitment agencies pay a platform fee to onboard workers at scale'),
      bullet('FX spread: Small margin on USDC/IDR conversion (estimated 0.2-0.3% additional)'),
      spacer(8),

      // ── Competitive Landscape ───────────────────────────────
      h1('5. Competitive Landscape'),
      p('The table below compares StellarNest against leading remittance services and traditional banks across key dimensions relevant to the APAC migrant worker use case:'),
      spacer(6),
      competitorTable(),
      p('Source: Market research, provider feature pages. Competitive assessment as of July 2026.', { color: '999999', size: 16 }),
      spacer(8),

      // ── Technical Architecture ─────────────────────────────
      h1('6. Technical Architecture'),
      h2('6.1 System Overview'),
      p('StellarNest follows a client-heavy architecture: all financial logic (encryption, transaction building, balance computation) runs in the browser. Firebase Firestore serves as the real-time backend for user profiles, claims metadata, and transaction history. The Stellar blockchain handles all value settlement.'),
      spacer(4),
      techStackTable(),
      spacer(8),

      h1('7. Key Technical Features'),
      featureTable(),
      spacer(8),

      // ── Security ──────────────────────────────────────────
      h1('8. Security Architecture'),
      h2('8.1 Secret Key Protection'),
      p('Stellar secrets are never transmitted or stored in plaintext. The encryption pipeline works as follows:'),
      bullet('On sign-up: a new Stellar KeyPair is generated client-side via @stellar/stellar-sdk'),
      bullet('The secret seed is encrypted using AES-GCM (Web Crypto API) with a key derived from the user\'s Firebase UID via PBKDF2 (100,000 iterations, SHA-256)'),
      bullet('The encrypted blob (base64 string) is stored in Firestore under the user\'s document — readable only by that user\'s auth token'),
      bullet('On subsequent logins: the encrypted blob is fetched from Firestore and decrypted in-memory. The plaintext secret never touches localStorage, Firestore in plaintext, or any server'),
      bullet('Result: Even a complete Firestore breach exposes only encrypted blobs. Without the Firebase UID (which requires valid auth credentials), decryption is computationally infeasible'),
      spacer(4),

      h2('8.2 Firestore Security Rules'),
      bullet('users collection: Only the document matching the authenticated user\'s UID is readable/writable by that user'),
      bullet('claims collection: Claim documents are readable by all authenticated users; only the sender can update the isClaimed flag'),
      bullet('transactions collection: Only the owning user\'s transactions are readable'),
      spacer(8),

      // ── Deployment ─────────────────────────────────────────
      h1('9. Deployment & Infrastructure'),
      h2('9.1 Project Structure'),
      new Table({
        width: { size: CONTENT, type: WidthType.DXA },
        columnWidths: [3200, 6880],
        rows: [
          new TableRow({ tableHeader: true, children: [headerCell('Path', 3200), headerCell('Purpose', 6880)] }),
          ...[
            ['src/lib/firebase.ts', 'Firebase singleton (lazy init, env var validation)'],
            ['src/lib/stellar.ts', 'Stellar SDK server, trustline, account creation helpers'],
            ['src/lib/crypto.ts', 'AES-GCM encrypt/decrypt using Web Crypto API + PBKDF2'],
            ['src/lib/storage.ts', 'localStorage read/write (offline-first cache)'],
            ['src/lib/services/*.ts', 'Business logic: auth, user, claim, transaction services'],
            ['src/contexts/AppContext.tsx', 'Central state: auth, wallet secret, claims, transactions'],
            ['src/hooks/useAuth.ts', 'Firebase onAuthStateChanged listener wrapper'],
            ['src/pages/*.tsx', 'Route pages: Landing, Auth, Dashboard, Send, Claim, Insights, Profile, History'],
            ['scripts/setup-treasury.ts', 'Treasury bootstrap: Friendbot fund, USDC trustline, self-mint'],
            ['.env.local', 'VITE_FIREBASE_*, VITE_STELLAR_*, VITE_MOCK_MODE (never committed)'],
          ].map(([path, purpose]) => new TableRow({ children: [
            cell(path, 3200, { fill: LIGHT, bold: true, color: NAVY, font: 'Courier New' }),
            cell(purpose, 6880),
          ]})),
        ],
      }),
      spacer(8),

      // ── What Makes Different ────────────────────────────────
      h1('10. What Makes StellarNest Different'),
      p('StellarNest is not simply "crypto for remittance." The combination of its feature stack, target demographic, and technical approach creates a differentiated offering:'),
      spacer(6),
      uspTable(),
      spacer(8),

      // ── Roadmap ─────────────────────────────────────────────
      h1('11. Roadmap'),
      new Table({
        width: { size: CONTENT, type: WidthType.DXA },
        columnWidths: [1800, 3000, 5280],
        rows: [
          new TableRow({ tableHeader: true, children: [
            headerCell('Phase', 1800), headerCell('Timeline', 3000), headerCell('Deliverables', 5280),
          ]}),
          ...[
            ['MVP (Current)', 'Hackathon (Jul 2026)', 'Magic Claim Links, Split-Routing, Insights, Firebase Auth, AES-GCM encryption, testnet USDC faucet'],
            ['Beta Launch', 'Aug 2026', 'Real USDC on Stellar public network, IDR off-ramp via partner bank/VASP, WhatsApp bot for claim notifications'],
            ['V1.0', 'Q4 2026', 'iOS/Android native apps, recurring payment scheduling, group splits (split with multiple recipients), prepaid card integration'],
            ['Scale', '2027', 'B2B HR platform for recruitment agencies, micro-loans against on-chain income history, NFT savings bonds'],
          ].map(([phase, timeline, deliverables], i) => new TableRow({ children: [
            cell(phase, 1800, { fill: i === 0 ? 'EAF4FB' : WHITE, bold: true, color: NAVY }),
            cell(timeline, 3000, { fill: i === 0 ? 'EAF4FB' : WHITE }),
            cell(deliverables, 5280),
          ]})),
        ],
      }),
      spacer(8),

      // ── Conclusion ─────────────────────────────────────────
      h1('12. Conclusion'),
      p('StellarNest demonstrates that blockchain can solve real problems for real people — not just traders and speculators. By building on Stellar\'s fast, low-cost network and wrapping it in an interface designed for Indonesian gig workers, StellarNest removes the three biggest friction points in remittance: cost, complexity, and access.'),
      spacer(4),
      p('The Magic Claim Link is a genuinely novel primitive — no incumbent offers URL-based, no-account-required cross-border payments. Combined with automatic split-routing and built-in proof of income, StellarNest is the most complete financial tool for APAC migrant workers available today.'),
      spacer(4),
      p('We invite the judges to try the live demo at the links below and experience the full flow: sign up, generate a Magic Claim Link, and see the split-routing and Insights dashboard in action.', { bold: false, color: TEAL }),
      spacer(16),

      // ── Contact ────────────────────────────────────────────
      new Table({
        width: { size: CONTENT, type: WidthType.DXA },
        columnWidths: [CONTENT],
        rows: [new TableRow({ children: [
          new TableCell({
            borders: noBorders,
            width: { size: CONTENT, type: WidthType.DXA },
            shading: { fill: NAVY, type: ShadingType.CLEAR },
            margins: { top: 300, bottom: 300, left: 400, right: 400 },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 },
                children: [new TextRun({ text: 'Ready to deploy. Ready to serve.', font: 'Arial', size: 28, bold: true, color: WHITE })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 },
                children: [new TextRun({ text: 'StellarNest — Borderless Payments for Every Worker', font: 'Arial', size: 22, color: GOLD })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: 'stellarnest-hackathon.web.app  |  github.com/seppam/stellarnest', font: 'Arial', size: 18, color: MID, italics: true })] }),
            ],
          }),
        ]})],
      }),
    ],
  }],
});

const OUTPUT = path.join(__dirname, '../StellarNest_Project_Documentation.docx');
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUTPUT, buf);
  console.log('✅ Written:', OUTPUT);
}).catch(e => { console.error('Error:', e.message); process.exit(1); });
