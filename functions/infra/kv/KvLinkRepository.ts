import { ILinkRepository } from '../../../packages/domain/src/repositories/ILinkRepository';
import { Link } from '../../../packages/domain/src/entities/Link';

export class KvLinkRepository implements ILinkRepository {
  constructor(private kv: KVNamespace) {}

  async create(link: Link): Promise<void> {
    const key = `link:${link.props.slug}`;
    const exists = await this.kv.get(key);
    if (exists) throw new Error('Slug already exists');
    await this.kv.put(key, JSON.stringify(link.props));
  }

  async get(slug: string): Promise<Link | null> {
    const raw = await this.kv.get(`link:${slug}`);
    return raw ? new Link(JSON.parse(raw)) : null;
  }

  async update(link: Link): Promise<void> {
    await this.kv.put(`link:${link.props.slug}`, JSON.stringify(link.props));
  }

  async toggle(slug: string, active: boolean): Promise<Link> {
    const current = await this.get(slug);
    if (!current) throw new Error('Not found');
    const updated = new Link({ ...current.props, active, updatedAt: new Date().toISOString() });
    await this.update(updated);
    return updated;
  }

  async list(opts: { search?: string; owner?: string; active?: boolean; cursor?: string; limit?: number; }): Promise<{ items: Link[]; nextCursor?: string }> {
    const MAX = opts.limit ?? 50;
    const list = await this.kv.list({ prefix: 'link:' });
    const items: Link[] = [];
    for (const k of list.keys) {
      const slug = k.name.replace('link:', '');
      const link = await this.get(slug);
      if (!link) continue;
      if (opts.active !== undefined && link.props.active !== opts.active) continue;
      if (opts.search && !link.props.slug.includes(opts.search) && !link.props.targetUrl.includes(opts.search)) continue;
      if (opts.owner && link.props.createdBy !== opts.owner) continue;
      items.push(link);
      if (items.length >= MAX) break;
    }
    return { items };
  }

  async incrementClick(slug: string): Promise<void> {
    const l = await this.get(slug);
    if (!l) return;
    l.props.clickCount += 1;
    await this.update(l);
  }

  async touchLastAccess(slug: string, isoDate: string): Promise<void> {
    const l = await this.get(slug);
    if (!l) return;
    l.props.lastAccessAt = isoDate;
    await this.update(l);
  }
}
