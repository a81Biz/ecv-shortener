/**
 * tests/unit/contracts.spec.ts
 * Contratos API con Zod (mínimos).
 * Asegura que el contrato de creación y la entidad Link cumplen requisitos.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

const CreateBody = z.object({
  slug: z.string().min(1).optional(),
  targetUrl: z.string().url(),
  tags: z.array(z.string()).optional()
});

const LinkDTO = z.object({
  slug: z.string().min(1),
  targetUrl: z.string().url(),
  createdAt: z.number().int().nonnegative(),
  createdBy: z.string().email().or(z.string().min(1)),
  clickCount: z.number().int().nonnegative(),
  active: z.boolean(),
  tags: z.array(z.string()).optional()
});

describe("Contratos API", () => {
  it("valida creación mínima (slug opcional)", () => {
    const parsed = CreateBody.parse({ targetUrl: "https://example.com" });
    expect(parsed.targetUrl).toBe("https://example.com");
    expect(parsed.slug).toBeUndefined();
  });

  it("valida respuesta de Link", () => {
    const now = Date.now();
    const link = LinkDTO.parse({
      slug: "ex",
      targetUrl: "https://example.com",
      createdAt: now,
      createdBy: "dev@local",
      clickCount: 0,
      active: true,
      tags: ["foo"]
    });
    expect(link.slug).toBe("ex");
    expect(link.active).toBe(true);
  });
});
