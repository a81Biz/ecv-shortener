import { ILinkRepository } from '../repositories/ILinkRepository';
import { Link } from '../entities/Link';
export async function ListLinks(repo: ILinkRepository, opts: Parameters<ILinkRepository['list']>[0]): Promise<{ items: Link[]; nextCursor?: string }> {
  return repo.list(opts);
}
