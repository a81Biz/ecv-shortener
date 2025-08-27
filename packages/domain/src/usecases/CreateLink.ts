import { Link } from '../entities/Link';
import { Slug } from '../valueObjects/Slug';
import { TargetUrl } from '../valueObjects/TargetUrl';
import { ILinkRepository } from '../repositories/ILinkRepository';

export interface CreateLinkInput { slug?: string; targetUrl: string; createdBy: string; tags?: string[] }

export async function CreateLink(repo: ILinkRepository, input: CreateLinkInput): Promise<Link> {
  const slug = Slug.create(input.slug ?? generateShortSlug());
  const target = TargetUrl.create(input.targetUrl);
  const now = new Date().toISOString();
  const link = new Link({
    slug: slug.value,
    targetUrl: target.value,
    active: true,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
    clickCount: 0,
    tags: input.tags ?? []
  });
  await repo.create(link);
  return link;
}

function generateShortSlug(): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const len = 3; // recomendado 1–3
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
