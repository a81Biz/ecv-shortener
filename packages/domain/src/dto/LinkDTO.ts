import { Link } from '../entities/Link';
export interface LinkDTO { slug: string; targetUrl: string; active: boolean; createdBy: string; createdAt: string; updatedAt: string; clickCount: number; lastAccessAt?: string; tags?: string[] }
export function toDTO(link: Link): LinkDTO { return { ...link.props }; }
