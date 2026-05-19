function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return { date: new Date(`${text}T00:00:00`), hasTime: false };
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return { date, hasTime: true };
}

export function formatDate(value: string | null | undefined) {
  const parsed = parseDate(value);
  if (!parsed) return "";

  const month = parsed.date.toLocaleString(undefined, { month: "long" });
  return `${month} ${parsed.date.getDate()} ${parsed.date.getFullYear()}`;
}

export function formatDateTime(value: string | null | undefined) {
  const parsed = parseDate(value);
  if (!parsed) return "";
  if (!parsed.hasTime) return formatDate(value);

  const month = parsed.date.toLocaleString(undefined, { month: "long" });
  const day = parsed.date.getDate();
  const year = parsed.date.getFullYear();
  const hours = parsed.date.getHours();
  const minutes = String(parsed.date.getMinutes()).padStart(2, "0");
  const hour12 = hours % 12 || 12;
  const suffix = hours >= 12 ? "pm" : "am";
  return `${month} ${day} ${year} ${hour12}:${minutes}${suffix}`;
}

export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined
) {
  const startText = formatDate(start);
  const endText = formatDate(end);
  if (!startText && !endText) return "";
  if (!startText) return endText;
  if (!endText) return startText;
  return `${startText} to ${endText}`;
}
