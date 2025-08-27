export const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers || {}) },
    status: init.status ?? 200,
  });

export const notFound = () => new Response('Not Found', { status: 404 });

export const redirectNoCache = (url: string, status: 301 | 302 = 302) =>
  new Response(null, {
    status,
    headers: {
      Location: url,
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
