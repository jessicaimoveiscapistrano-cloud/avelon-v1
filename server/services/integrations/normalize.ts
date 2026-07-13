import { PropertyPurpose } from "@prisma/client";

export function normalizePurpose(value: unknown): PropertyPurpose | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  if (["sale", "venda", "comprar", "compra"].includes(v)) return "SALE";
  if (["rent", "aluguel", "alugar", "locação", "locacao"].includes(v)) return "RENT";
  return null;
}
