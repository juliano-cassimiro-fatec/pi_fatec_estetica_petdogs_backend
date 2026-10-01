import { badRequest } from "../errors/app-error.js";

export function parseCalendarDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw badRequest("Data inválida");
  }

  return date;
}

export function formatCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeWorkingDays(days: number[]): number[] {
  if (days.some((day) => !Number.isInteger(day) || day < 0 || day > 7)) {
    throw badRequest("Dias de trabalho devem usar 0-6 ou 7 para domingo");
  }

  return [...new Set(days.map((day) => (day === 7 ? 0 : day)))];
}
