declare global {
 interface Window {
  __AETHER_STATIC__?: boolean;
 }
}

export function isStaticGame(): boolean {
 return typeof window !== 'undefined' && window.__AETHER_STATIC__ === true;
}

export function getStaticBaseUrl(): string {
 if (typeof document === 'undefined') return '/';
 const baseTag = document.querySelector('base');
 const rawBase = baseTag?.href || document.baseURI || (typeof window !== 'undefined' ? window.location.href : '/');
 try {
  const url = new URL(rawBase);
  url.pathname = url.pathname.replace(/\/play\/?$/i, '/').replace(/\/index\.html$/i, '/');
  if (!url.pathname.endsWith('/')) {
   url.pathname += '/';
  }
  return url.href;
 } catch {
  const cleaned = rawBase.replace(/\/play\/?$/i, '/').replace(/\/index\.html$/i, '/');
  return cleaned.endsWith('/') ? cleaned : cleaned + '/';
 }
}

export function normalizeAssetPath(path: string): string {
 if (!path) return '';
 if (/^(https?:|data:|blob:)/i.test(path)) return path;
 return path.replace(/^(\.\/|\/)+/, '').replace(/^public\//, '');
}

export function assetUrl(path: string): string {
 if (!path) return '';
 if (/^(https?:|data:|blob:)/i.test(path)) return path;
 const clean = normalizeAssetPath(path);
 if (!isStaticGame()) {
  return '/' + clean;
 }
 const base = getStaticBaseUrl();
 return new URL(clean, base).href;
}

export function gameHome(): string {
 if (!isStaticGame()) return '/';
 try {
  return new URL(getStaticBaseUrl()).pathname;
 } catch {
  return '/';
 }
}
