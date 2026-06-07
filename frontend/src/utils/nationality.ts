// Maps non-standard football nation prefixes to ISO 3166-1 alpha-2 codes
const NON_STANDARD_TO_ISO2: Record<string, string> = {
  eng: 'GB', sco: 'GB', wal: 'GB', nir: 'GB',
  xk: 'XK', // Kosovo (CLDR provisional)
};

export function getCountryDisplay(nationality?: string): { flag: string; code: string } {
  if (!nationality) return { flag: '🌍', code: '—' };

  const lower = nationality.toLowerCase().trim();
  if (lower === 'nepali' || lower === 'nepal' || lower === 'npl') {
    return { flag: '🇳🇵', code: 'NPL' };
  }

  // European dataset format: "us USA" / "eng ENG" / "fr FRA"
  const m = nationality.trim().match(/^([a-z]{2,3})\s+([A-Z]{2,4})$/i);
  if (m) {
    const prefix = m[1].toLowerCase();
    const threeCode = m[2].toUpperCase();
    const iso2 = NON_STANDARD_TO_ISO2[prefix] ?? (prefix.length === 2 ? prefix.toUpperCase() : null);
    if (iso2 && iso2.length === 2) {
      const flag = [...iso2].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
      return { flag, code: threeCode };
    }
    return { flag: '🌍', code: threeCode };
  }

  return { flag: '🌍', code: nationality.slice(0, 3).toUpperCase() };
}
