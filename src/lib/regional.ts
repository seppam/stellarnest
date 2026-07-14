/**
 * Regional Configuration — StellarNest ASEAN
 *
 * Maps ASEAN countries to their payment rails, currencies,
 * and display conventions. Single source of truth for
 * all country-specific UI logic.
 */

import type { CountryCode } from '../types';

// ─── Country Config ────────────────────────────────────────────
export interface PaymentRail {
  id: string;           // internal key, e.g. 'bca', 'gcash'
  label: string;        // display name, e.g. 'GCash', 'MoMo'
  type: 'bank' | 'ewallet' | 'mobile_money';
  accountHint?: string; // placeholder text, e.g. '09xxxxxxxxx'
  maxDigits?: number;   // optional validation hint
}

export interface CountryConfig {
  code: CountryCode;
  name: string;                 // display name
  flag: string;                // emoji flag
  currency: {
    code: string;               // ISO 4217, e.g. 'IDR', 'PHP'
    symbol: string;             // e.g. 'Rp', '₱'
    name: string;               // e.g. 'Indonesian Rupiah'
    decimals: number;           // decimal places (IDR/VND = 0, USD/PHP = 2)
    locale: string;             // Intl.NumberFormat locale, e.g. 'id-ID'
  };
  paymentRails: PaymentRail[];
  settlementRails: string[];    // e.g. ['BI-FAST', 'InstaPay', 'VietQR']
  exampleAmount: string;        // display example, e.g. 'Rp 1.000.000'
}

const COUNTRIES: Record<CountryCode, CountryConfig> = {
  ID: {
    code: 'ID',
    name: 'Indonesia',
    flag: '🇮🇩',
    currency: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', decimals: 0, locale: 'id-ID' },
    paymentRails: [
      { id: 'gopay',   label: 'GoPay',       type: 'ewallet' },
      { id: 'ovo',     label: 'OVO',         type: 'ewallet' },
      { id: 'dana',    label: 'DANA',        type: 'ewallet' },
      { id: 'linkaja', label: 'LinkAja',     type: 'ewallet' },
      { id: 'bca',     label: 'Bank BCA',    type: 'bank', accountHint: '1234567890' },
      { id: 'bni',     label: 'Bank BNI',    type: 'bank', accountHint: '1234567890' },
      { id: 'mandiri', label: 'Bank Mandiri',type: 'bank', accountHint: '1300012345678' },
      { id: 'bri',     label: 'Bank BRI',    type: 'bank', accountHint: '0001012345678' },
      { id: 'bsi',     label: 'Bank BSI',    type: 'bank', accountHint: '1234567890' },
    ],
    settlementRails: ['BI-FAST', 'Giro', 'RTGS'],
    exampleAmount: 'Rp 1.500.000',
  },

  PH: {
    code: 'PH',
    name: 'Philippines',
    flag: '🇵🇭',
    currency: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', decimals: 2, locale: 'en-PH' },
    paymentRails: [
      { id: 'gcash',   label: 'GCash',        type: 'ewallet', accountHint: '09xxxxxxxxx' },
      { id: 'maya',    label: 'Maya',         type: 'ewallet', accountHint: '09xxxxxxxxx' },
      { id: 'bdo',     label: 'BDO',          type: 'bank', accountHint: '1234567890' },
      { id: 'bpi',     label: 'BPI',          type: 'bank', accountHint: '1234567890' },
      { id: 'unionbank', label: 'UnionBank', type: 'bank', accountHint: '1234567890' },
      { id: 'megalink', label: 'MegaLink',   type: 'mobile_money' },
    ],
    settlementRails: ['InstaPay', 'PESONet', 'Express'],
    exampleAmount: '₱ 25,000',
  },

  VN: {
    code: 'VN',
    name: 'Vietnam',
    flag: '🇻🇳',
    currency: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', decimals: 0, locale: 'vi-VN' },
    paymentRails: [
      { id: 'momo',    label: 'MoMo',         type: 'ewallet', accountHint: '0xxxxxxxxx' },
      { id: 'zalo',    label: 'ZaloPay',      type: 'ewallet', accountHint: '0xxxxxxxxx' },
      { id: 'vietinbank', label: 'VietinBank',type: 'bank' },
      { id: 'vietcombank', label: 'VCB',     type: 'bank' },
      { id: 'bidv',    label: 'BIDV',         type: 'bank' },
      { id: 'tpbank',  label: 'TPBank',       type: 'bank' },
    ],
    settlementRails: ['VietQR', 'Napas 247', 'FAST'],
    exampleAmount: '₫ 15.000.000',
  },

  TH: {
    code: 'TH',
    name: 'Thailand',
    flag: '🇹🇭',
    currency: { code: 'THB', symbol: '฿', name: 'Thai Baht', decimals: 2, locale: 'th-TH' },
    paymentRails: [
      { id: 'truemoney', label: 'TrueMoney',    type: 'ewallet', accountHint: '0xxxxxxxxx' },
      { id: 'linepay',   label: 'LINE Pay',     type: 'ewallet' },
      { id: 'scb',       label: 'SCB',           type: 'bank', accountHint: '0xxxxxxxxx' },
      { id: 'krungsri',  label: 'Krungsri',      type: 'bank' },
      { id: 'kbank',     label: 'Kasikorn (K+)', type: 'bank' },
      { id: 'bbl',       label: 'Bangkok Bank',  type: 'bank' },
    ],
    settlementRails: ['PromptPay', 'mBanking', 'IBanking'],
    exampleAmount: '฿ 15,000.00',
  },

  MY: {
    code: 'MY',
    name: 'Malaysia',
    flag: '🇲🇾',
    currency: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', decimals: 2, locale: 'ms-MY' },
    paymentRails: [
      { id: 'touchngo',  label: 'Touch \'n Go',    type: 'ewallet' },
      { id: 'grabpay',   label: 'GrabPay',          type: 'ewallet' },
      { id: 'maybank',   label: 'Maybank',          type: 'bank' },
      { id: 'cimb',      label: 'CIMB',              type: 'bank' },
      { id: 'publicbank',label: 'Public Bank',      type: 'bank' },
      { id: 'rhb',       label: 'RHB',               type: 'bank' },
    ],
    settlementRails: ['DuitNow', 'FPX', 'IBG', 'RENTAS'],
    exampleAmount: 'RM 2,000.00',
  },

  SG: {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    currency: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2, locale: 'en-SG' },
    paymentRails: [
      { id: 'paynow',   label: 'PayNow',           type: 'ewallet' },
      { id: 'paylah',   label: 'DBS PayLah!',       type: 'ewallet' },
      { id: 'grabpay_sg', label: 'GrabPay SG',     type: 'ewallet' },
      { id: 'dbs',      label: 'DBS / POSB',        type: 'bank' },
      { id: 'ocbc',     label: 'OCBC',               type: 'bank' },
      { id: 'uob',      label: 'UOB',               type: 'bank' },
    ],
    settlementRails: ['PayNow', 'FAST', 'MEPS'],
    exampleAmount: 'S$ 1,000.00',
  },
};

export const COUNTRY_CODES = Object.keys(COUNTRIES) as CountryCode[];

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Returns the config for a country code. Defaults to Indonesia.
 */
export function getCountryConfig(code: CountryCode): CountryConfig {
  return COUNTRIES[code] ?? COUNTRIES.ID;
}

/**
 * Format an amount in a country's local currency.
 * Amount is always stored internally in USD; this converts for display.
 *
 * For demo purposes, uses a fixed mock rate.
 * In production, fetch live rates from an exchange API.
 */
const MOCK_RATES: Record<string, number> = {
  ID: 16500,   // 1 USD = Rp 16,500
  PH: 58,
  VND: 24500,
  TH: 35,
  MY: 4.7,
  SGD: 1.35,
};

export function formatLocal(amountUSD: number, code: CountryCode): string {
  const cfg = getCountryConfig(code);
  const rate = MOCK_RATES[code] ?? 1;
  const local = amountUSD * rate;
  return new Intl.NumberFormat(cfg.currency.locale, {
    style: 'currency',
    currency: cfg.currency.code,
    minimumFractionDigits: cfg.currency.decimals,
    maximumFractionDigits: cfg.currency.decimals,
  }).format(local);
}

/**
 * Convert a local currency amount back to USD.
 * Returns null if the input is invalid.
 */
export function toUSD(localAmount: number, code: CountryCode): number | null {
  const rate = MOCK_RATES[code];
  if (!rate) return null;
  return Math.round((localAmount / rate) * 100) / 100;
}

/**
 * Get the "you receive" amount in local currency.
 * In production this would subtract fees; demo shows gross amount.
 */
export function receivedLocal(amountUSD: number, code: CountryCode): string {
  return formatLocal(amountUSD, code);
}
