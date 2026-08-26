import { prisma } from "../config/prisma.js";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getMonthlyVisits(month?: string) {
  const target = month ?? currentMonth();

  const rows = await prisma.visitStat.findMany({
    where: { month: target },
    orderBy: { day: "asc" },
    select: { month: true, day: true, visits: true },
  });

  return {
    month: target,
    days: rows.map((row) => ({ day: row.day, visits: row.visits })),
  };
}
