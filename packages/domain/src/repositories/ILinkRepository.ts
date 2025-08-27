import { Link } from '../entities/Link';
export interface ListOptions { search?: string; owner?: string; active?: boolean; cursor?: string; limit?: number; }
export interface ILinkRepository {
  create(link: Link): Promise<void>;
  get(slug: string): Promise<Link | null>;
  update(link: Link): Promise<void>;
  toggle(slug: string, active: boolean): Promise<Link>;
  list(opts: ListOptions): Promise<{ items: Link[]; nextCursor?: string }>;
  incrementClick(slug: string): Promise<void>;
  touchLastAccess(slug: string, isoDate: string): Promise<void>;
}
