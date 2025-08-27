import { Link } from '../entities/Link';
import { TargetUrl } from '../valueObjects/TargetUrl';
import { ILinkRepository } from '../repositories/ILinkRepository';
export interface UpdateLinkInput { slug: string; targetUrl?: string; tags?: string[] }
export async function UpdateLink(repo: ILinkRepository, input: UpdateLinkInput): Promise<Link> {
  const current = await repo.get(input.slug);
  if (!current) throw new Error('Not found');
  const updated = new Link({
    ...current.props,
    targetUrl: input.targetUrl ? TargetUrl.create(input.targetUrl).value : current.props.targetUrl,
    tags: input.tags ?? current.props.tags,
    updatedAt: new Date().toISOString()
  });
  await repo.update(updated);
  return updated;
}
