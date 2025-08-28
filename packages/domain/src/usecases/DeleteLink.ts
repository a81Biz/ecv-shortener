import { ILinkRepository } from '../repositories/ILinkRepository';

export async function DeleteLink(repo: ILinkRepository, slug: string) {
  if (!slug || !/^[a-zA-Z0-9-_]+$/.test(slug)) {
    throw new Error('Invalid slug');
  }
  const deleted = await repo.delete(slug);
  return { ok: true as const, deleted };
}
