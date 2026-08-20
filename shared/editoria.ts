import { z } from "zod";

export const CONTENT_FORMATS = ["stories", "reels 7s", "reels longo", "carrossel"] as const;
export const CONTENT_STATUSES = ["ideia", "em produção", "pronto", "publicado"] as const;

export const contentFormatSchema = z.enum(CONTENT_FORMATS);
export const contentStatusSchema = z.enum(CONTENT_STATUSES);
export type ContentFormat = z.infer<typeof contentFormatSchema>;
export type ContentStatus = z.infer<typeof contentStatusSchema>;

export function statusForCompletion(completed: boolean): ContentStatus {
  return completed ? "publicado" : "pronto";
}

export const CONTENT_STATUS_META = {
  "ideia": { label: "Ideia", className: "bg-[#EAE5FF] text-[#6654B6]" },
  "em produção": { label: "Em produção", className: "bg-[#FBE8C8] text-[#9B5C13]" },
  "pronto": { label: "Pronto", className: "bg-[#D9EFE6] text-[#24795C]" },
  "publicado": { label: "Publicado", className: "bg-[#E7E5E2] text-[#514E49]" },
} as const;
