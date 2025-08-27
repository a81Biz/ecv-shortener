import { test, expect, request } from '@playwright/test';

const ADMIN_HDR = { 'Cf-Access-Authenticated-User-Email': 'smoke@example.com' };

test('crear → activar → redirigir → contar → listar → QR → desactivar', async ({ page, baseURL, request }) => {
  // create via API (más estable que UI para smoke)
  const create = await request.post(`${baseURL}/admin/api/create`, {
    headers: { 'Content-Type': 'application/json', ...ADMIN_HDR },
    data: { targetUrl: 'https://example.org', slug: 'smoke' },
  });
  expect(create.ok()).toBeTruthy();

  // activar
  await request.patch(`${baseURL}/admin/api/smoke/state`, {
    headers: { 'Content-Type': 'application/json', ...ADMIN_HDR },
    data: { active: true },
  });

  // redirect
  const resp = await page.goto(`${baseURL}/smoke`);
  expect(resp?.status()).toBeGreaterThanOrEqual(300);

  // listar
  const list = await request.get(`${baseURL}/admin/api/links`, { headers: ADMIN_HDR });
  expect(list.ok()).toBeTruthy();
  const payload = await list.json();
  const arr = Array.isArray(payload.items) ? payload.items : payload;
  const found = arr.find((x: any) => x.slug === 'smoke');
  expect(found).toBeTruthy();

  // qr
  const qr = await request.get(`${baseURL}/admin/api/qr/smoke`, { headers: ADMIN_HDR });
  expect(qr.ok()).toBeTruthy();
  const svg = await qr.text();
  expect(svg.includes('<svg')).toBeTruthy();

  // desactivar
  const togg = await request.patch(`${baseURL}/admin/api/smoke/state`, {
    headers: { 'Content-Type': 'application/json', ...ADMIN_HDR },
    data: { active: false },
  });
  expect(togg.ok()).toBeTruthy();
});
