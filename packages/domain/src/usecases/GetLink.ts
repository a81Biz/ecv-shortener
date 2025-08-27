import { ILinkRepository } from '../repositories/ILinkRepository';
import { Link } from '../entities/Link';
export async function GetLink(repo: ILinkRepository, slug: string): Promise<Link | null> {
  return repo.get(slug);
}
