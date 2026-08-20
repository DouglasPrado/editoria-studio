import { z } from "zod";
import { contentFormatSchema, contentStatusSchema } from "@shared/editoria";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "@shared/const";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";

const projectInput = z.object({
  name: z.string().trim().min(2).max(140),
  description: z.string().trim().max(2000).optional(),
  brandTone: z.string().trim().max(1000).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  project: router({
    list: protectedProcedure.query(({ ctx }) => db.listProjects(ctx.user.id)),
    create: protectedProcedure.input(projectInput).mutation(({ ctx, input }) => db.createProject(ctx.user.id, input)),
    updateBrand: protectedProcedure.input(z.object({
      projectId: z.number().int().positive(),
      description: z.string().trim().max(2000).optional(),
      brandTone: z.string().trim().max(1000).optional(),
      colorPrimary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      colorAccent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      fontHeading: z.string().trim().min(2).max(100),
      fontBody: z.string().trim().min(2).max(100),
    })).mutation(({ ctx, input }) => {
      const { projectId, ...brand } = input;
      return db.updateProjectBrand(ctx.user.id, projectId, brand);
    }),
  }),
  editorial: router({
    list: protectedProcedure.query(({ ctx }) => db.listPillars(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      projectId: z.number().int().positive(), name: z.string().trim().min(2).max(120), theme: z.string().trim().min(2).max(160),
      description: z.string().trim().max(1500).optional(), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    })).mutation(({ ctx, input }) => db.createPillar(ctx.user.id, input)),
  }),
  content: router({
    list: protectedProcedure.query(({ ctx }) => db.listContent(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      projectId: z.number().int().positive(), pillarId: z.number().int().positive().nullable().optional(), title: z.string().trim().min(2).max(180),
      format: contentFormatSchema, status: contentStatusSchema, scheduledFor: z.number().int().positive().nullable().optional(),
      caption: z.string().trim().max(5000).optional(), hashtags: z.string().trim().max(1200).optional(), visualReference: z.string().trim().max(3000).optional(),
    })).mutation(({ ctx, input }) => db.createContent(ctx.user.id, { ...input, scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null })),
    updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: contentStatusSchema }))
      .mutation(({ ctx, input }) => db.updateContentStatus(ctx.user.id, input.id, input.status)),
  }),
  moodboard: router({
    list: protectedProcedure.query(({ ctx }) => db.listMoodboards(ctx.user.id)),
    upload: protectedProcedure.input(z.object({
      projectId: z.number().int().positive(), campaign: z.string().trim().min(2).max(140), title: z.string().trim().min(2).max(160),
      imageData: z.string().startsWith("data:image/").max(7_000_000),
    })).mutation(async ({ ctx, input }) => {
      const match = input.imageData.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/);
      if (!match) throw new Error("Envie uma imagem PNG, JPG, WEBP ou GIF válida.");
      const extension = match[1] === "image/jpeg" ? "jpg" : match[1].split("/")[1];
      const key = `editoria/${ctx.user.id}/moodboards/${crypto.randomUUID()}.${extension}`;
      const stored = await storagePut(key, Buffer.from(match[2], "base64"), match[1]);
      return db.createMoodboardItem(ctx.user.id, { projectId: input.projectId, campaign: input.campaign, title: input.title, imageKey: stored.key, imageUrl: stored.url });
    }),
  }),
  assistant: router({
    generate: protectedProcedure.input(z.object({
      theme: z.string().trim().min(2).max(300), pillar: z.string().trim().min(2).max(160), request: z.enum(["ideias", "legenda", "hashtags"]),
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: "Você é uma estrategista editorial brasileira. Escreva em português do Brasil, com repertório criativo, clareza e acabamento premium. Nunca invente métricas, resultados ou depoimentos. Estruture a resposta em Markdown curto e acionável." },
          { role: "user", content: `Contexto editorial:\nTema: ${input.theme}\nPilar editorial: ${input.pillar}\nPedido: ${input.request}\n\nGere uma sugestão alinhada exatamente a esse contexto. Para ideias, ofereça 5 conceitos distintos com gancho e formato recomendado. Para legenda, escreva uma única legenda em tom sofisticado com CTA sutil. Para hashtags, sugira 12 hashtags relevantes, mesclando alcance e especificidade.` },
        ],
        maxTokens: 900,
      });
      const generated = response.choices[0]?.message.content;
      return { content: typeof generated === "string" ? generated.trim() : "Não foi possível gerar uma sugestão agora." };
    }),
  }),
});

export type AppRouter = typeof appRouter;
