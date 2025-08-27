import { http, HttpResponse } from 'msw';

// Fixtures para contratos (solo tests de UI/contratos)
export const handlers = [
  http.post('*/admin/api/create', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      slug: body.slug ?? 'auto123',
      targetUrl: body.targetUrl,
      active: true,
      clicks: 0,
      createdAt: new Date().toISOString()
    }, { status: 200 });
  }),
  http.get('*/admin/api/links', () =>
    HttpResponse.json({ items: [
      { slug: 'auto123', targetUrl: 'https://example.org', active: true, clicks: 1 }
    ]})
  ),
];
