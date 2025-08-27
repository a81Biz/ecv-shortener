@"
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs", () => {
    expect(true).toBe(true);
  });
});
"@ | Set-Content -Encoding UTF8 functions\smoke.test.ts
