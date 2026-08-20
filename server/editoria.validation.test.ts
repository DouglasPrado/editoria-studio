import { describe, expect, it } from "vitest";
import { contentFormatSchema, contentStatusSchema, CONTENT_STATUSES, statusForCompletion } from "@shared/editoria";
import { contentInputSchema } from "./routers";

describe("contratos editoriais", () => {
  it("aceita exclusivamente os quatro formatos de conteúdo definidos", () => {
    expect(contentFormatSchema.safeParse("stories").success).toBe(true);
    expect(contentFormatSchema.safeParse("reels 7s").success).toBe(true);
    expect(contentFormatSchema.safeParse("reels longo").success).toBe(true);
    expect(contentFormatSchema.safeParse("carrossel").success).toBe(true);
    expect(contentFormatSchema.safeParse("reel").success).toBe(false);
  });

  it("preserva exatamente os quatro status solicitados", () => {
    expect(CONTENT_STATUSES).toEqual(["ideia", "em produção", "pronto", "publicado"]);
    expect(contentStatusSchema.safeParse("em produção").success).toBe(true);
    expect(contentStatusSchema.safeParse("rascunho").success).toBe(false);
  });

  it("aceita roteiro completo, data e referências visuais em uma nova peça", () => {
    const result = contentInputSchema.safeParse({
      projectId: 1,
      title: "Como organizar o caixa em uma semana",
      format: "reels longo",
      status: "ideia",
      scheduledFor: Date.UTC(2026, 7, 25),
      script: "Gancho: abra o extrato. Cena 2: separe o essencial. CTA: salve para rever.",
      caption: "Um processo possível para começar com clareza.",
      hashtags: "#organizaçã financeira #planejamento",
      visualReference: "Extrato aberto, calendário e uma mesa clara.",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita roteiros acima do limite e formatos não previstos", () => {
    const base = { projectId: 1, title: "Teste", format: "stories", status: "ideia" };
    expect(contentInputSchema.safeParse({ ...base, script: "a".repeat(20_001) }).success).toBe(false);
    expect(contentInputSchema.safeParse({ ...base, format: "reel" }).success).toBe(false);
  });

  it("mapeia a conclusão de publicação para os status corretos", () => {
    expect(statusForCompletion(true)).toBe("publicado");
    expect(statusForCompletion(false)).toBe("pronto");
  });
});
