export const isValidUrl = (raw: string) => {
  try { const normalized = raw.startsWith('http') ? raw : `https://${raw}`; const u = new URL(normalized); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
};
