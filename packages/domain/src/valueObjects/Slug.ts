export class Slug {
  private static readonly REGEX = /^[A-Za-z0-9_-]{1,32}$/;
  private constructor(public readonly value: string) {}
  static create(raw: string): Slug {
    if (!this.REGEX.test(raw)) throw new Error('Invalid slug');
    return new Slug(raw);
  }
}
