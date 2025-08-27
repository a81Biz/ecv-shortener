import { ILinkRepository } from '../repositories/ILinkRepository';
import { Link } from '../entities/Link';
export async function ToggleLink(repo: ILinkRepository, slug: string, active: boolean): Promise<Link> {
  const link = await repo.toggle(slug, active);
  return link;
}
