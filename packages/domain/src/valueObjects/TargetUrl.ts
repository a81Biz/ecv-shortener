export class TargetUrl {
  private constructor(public readonly value: string) {}
  static create(raw: string): TargetUrl {
    const normalized = raw.startsWith('http') ? raw : `https://${raw}`;
    try {
      const url = new URL(normalized);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw 0;
      return new TargetUrl(url.toString());
    } catch {
      throw new Error('Invalid URL');
    }
  }
}
