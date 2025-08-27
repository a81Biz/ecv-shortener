export interface LinkProps {
  slug: string;
  targetUrl: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  clickCount: number;
  lastAccessAt?: string;
  tags?: string[];
}
export class Link { constructor(public props: LinkProps) {} }
