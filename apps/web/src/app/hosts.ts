export function shortOrigin(): string {
  const { protocol, host } = window.location;
  const base = host.startsWith('admin.') ? host.slice(6) : host;
  return `${protocol}//${base}`;
}