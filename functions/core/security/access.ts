export function getAuthenticatedEmail(req: Request): string | null {
  const email = req.headers.get('Cf-Access-Authenticated-User-Email');
  return email && email.length > 0 ? email : null;
}
export function requireAccess(req: Request): string {
  const email = getAuthenticatedEmail(req);
  if (!email) throw new Response('Unauthorized', { status: 401 });
  return email;
}
