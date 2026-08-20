import { describe, expect, it } from "vitest";
import { contentFormatSchema, contentStatusSchema, CONTENT_STATUSES } from "@shared/editoria";

describe("contratos editoriais", () => {
  it("aceita exclusivamente os três formatos de conteúdo definidos", () => {
    expect(contentFormatSchema.safeParse("story").success).toBe(true);
    expect(contentFormatSchema.safeParse("reel").success).toBe(true);
    expect(contentFormatSchema.safeParse("carrossel").success).toBe(true);
    expect(contentFormatSchema.safeParse("post").success).toBe(false);
  });

  it("preserva exatamente os quatro status solicitados", () => {
    expect(CONTENT_STATUSES).toEqual(["ideia", "em produção", "pronto", "publicado"]);
    expect(contentStatusSchema.safeParse("em produção").success).toBe(true);
    expect(contentStatusSchema.safeParse("rascunho").success).toBe(false);
  });
});
