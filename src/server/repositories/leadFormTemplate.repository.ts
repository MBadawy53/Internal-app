import { prisma } from "@/lib/prisma";
import { readFields, type LeadFormField } from "@/lib/leadForm/types";

export interface LeadFormTemplateSummary {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  fieldCount: number;
  updatedAt: Date;
}

export const leadFormTemplateRepository = {
  list: async (): Promise<LeadFormTemplateSummary[]> => {
    const rows = await prisma.leadFormTemplate.findMany({
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      isDefault: r.isDefault,
      isActive: r.isActive,
      fieldCount: readFields(r.fields).length,
      updatedAt: r.updatedAt,
    }));
  },

  findById: async (id: string) => {
    const row = await prisma.leadFormTemplate.findUnique({ where: { id } });
    if (!row) return null;
    return { ...row, fields: readFields(row.fields) };
  },

  findDefault: async (): Promise<{ id: string; fields: LeadFormField[] } | null> => {
    const row = await prisma.leadFormTemplate.findFirst({
      where: { isDefault: true, isActive: true },
    });
    if (!row) return null;
    return { id: row.id, fields: readFields(row.fields) };
  },

  /** Lightweight list of active templates for admin pickers. */
  listActive: async (): Promise<{ id: string; name: string; isDefault: boolean }[]> => {
    const rows = await prisma.leadFormTemplate.findMany({
      where: { isActive: true },
      select: { id: true, name: true, isDefault: true },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
    return rows;
  },
};
