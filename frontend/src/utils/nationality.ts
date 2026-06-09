// Maps 3-letter football/FIFA prefixes and non-standard codes to ISO 3166-1 alpha-2
const TO_ISO2: Record<string, string> = {
  // UK home nations (no individual ISO-2, map to GB)
  eng: 'GB', sco: 'GB', wal: 'GB', nir: 'GB',
  sct: 'GB', wls: 'GB',

  // Europe — 3-letter football prefixes
  esp: 'ES', fra: 'FR', ger: 'DE', ita: 'IT', por: 'PT',
  ned: 'NL', bel: 'BE', aut: 'AT', sui: 'CH', swe: 'SE',
  nor: 'NO', den: 'DK', dnk: 'DK', fin: 'FI', pol: 'PL',
  cze: 'CZ', svk: 'SK', hun: 'HU', rom: 'RO', rou: 'RO',
  gre: 'GR', tur: 'TR', cro: 'HR', hrv: 'HR', srb: 'RS',
  ukr: 'UA', rus: 'RU', bul: 'BG', bgr: 'BG', svn: 'SI',
  mne: 'ME', bih: 'BA', alb: 'AL', mkd: 'MK', geo: 'GE',
  arm: 'AM', aze: 'AZ', isl: 'IS', irl: 'IE', lux: 'LU',
  mlt: 'MT', cyp: 'CY', est: 'EE', lva: 'LV', ltu: 'LT',
  blr: 'BY', mda: 'MD', kos: 'XK', kvx: 'XK', xk: 'XK',

  // Americas — 3-letter prefixes
  arg: 'AR', bra: 'BR', uru: 'UY', ury: 'UY', col: 'CO',
  chl: 'CL', mex: 'MX', usa: 'US', can: 'CA', ecu: 'EC',
  per: 'PE', bol: 'BO', ven: 'VE', par: 'PY', crc: 'CR',
  pan: 'PA', jam: 'JM', tri: 'TT',

  // Africa — 3-letter prefixes
  mor: 'MA', mar: 'MA', egy: 'EG', nga: 'NG', sen: 'SN',
  civ: 'CI', cmr: 'CM', gha: 'GH', tun: 'TN', alg: 'DZ',
  dza: 'DZ', rsa: 'ZA', zaf: 'ZA', ang: 'AO', ago: 'AO',
  moz: 'MZ', zim: 'ZW', ken: 'KE', eth: 'ET', uga: 'UG',
  tza: 'TZ', cod: 'CD', lby: 'LY', sud: 'SD', sdn: 'SD',
  mli: 'ML', bfa: 'BF', gui: 'GN', gnb: 'GW', gam: 'GM',
  gmb: 'GM', sle: 'SL', lbr: 'LR', tgo: 'TG', ben: 'BJ',
  ner: 'NE', nig: 'NE', zmb: 'ZM', zam: 'ZM', bot: 'BW',
  bwa: 'BW', nam: 'NA', swz: 'SZ', lso: 'LS', som: 'SO',
  eri: 'ER', dji: 'DJ', com: 'KM', gab: 'GA', cgo: 'CG',
  cta: 'CF', eqg: 'GQ', tan: 'TZ', mad: 'MG',
  mtn: 'MR', cap: 'CV', cpv: 'CV',

  // Asia — 3-letter prefixes
  jpn: 'JP', kor: 'KR', chn: 'CN', ind: 'IN', nep: 'NP',
  irn: 'IR', iri: 'IR', irq: 'IQ', ksa: 'SA', sau: 'SA',
  qat: 'QA', uae: 'AE', kuw: 'KW', kwt: 'KW', omn: 'OM',
  bhr: 'BH', yem: 'YE', jor: 'JO', lbn: 'LB', syr: 'SY',
  isr: 'IL', pal: 'PS', afg: 'AF', pak: 'PK', ban: 'BD',
  bgd: 'BD', sri: 'LK', lka: 'LK', btn: 'BT', mya: 'MM',
  mmr: 'MM', tha: 'TH', vnm: 'VN', phi: 'PH', phl: 'PH',
  mas: 'MY', mys: 'MY', sgp: 'SG', idn: 'ID', uzb: 'UZ',
  kgz: 'KG', tjk: 'TJ', tkm: 'TM', mng: 'MN', kaz: 'KZ',

  // Oceania
  aus: 'AU', nzl: 'NZ',
};

export function getCountryDisplay(nationality?: string): { flag: string; code: string } {
  if (!nationality) return { flag: '🌍', code: '—' };

  const lower = nationality.toLowerCase().trim();
  if (lower === 'nepali' || lower === 'nepal' || lower === 'npl') {
    return { flag: '🇳🇵', code: 'NPL' };
  }

  // Format: "us USA" / "eng ENG" / "esp ESP"
  const m = nationality.trim().match(/^([a-z]{2,4})\s+([A-Z]{2,4})$/i);
  if (m) {
    const prefix = m[1].toLowerCase();
    const threeCode = m[2].toUpperCase();

    // Try 3-letter (or non-standard) map first, then fall back to treating prefix as ISO-2
    const iso2 = TO_ISO2[prefix] ?? (prefix.length === 2 ? prefix.toUpperCase() : null);

    if (iso2 && iso2.length === 2) {
      const flag = [...iso2].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
      return { flag, code: threeCode };
    }
    return { flag: '🌍', code: threeCode };
  }

  return { flag: '🌍', code: nationality.slice(0, 3).toUpperCase() };
}
