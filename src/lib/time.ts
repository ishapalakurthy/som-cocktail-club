// All event times are entered and shown in New Haven time.
export const TIME_ZONE = "America/New_York";

export function formatDateTime(d: Date | string | number) {
  return new Date(d).toLocaleString("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(d: Date | string | number) {
  return new Date(d).toLocaleString("en-US", {
    timeZone: TIME_ZONE,
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Minutes that TIME_ZONE is ahead of UTC at the given instant (negative in the US).
function tzOffsetMinutes(at: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUtc - at.getTime()) / 60000);
}

// "2026-10-28T19:00" (New Haven wall-clock time from <input type="datetime-local">) -> Date
export function fromLocalInput(value: string): Date {
  const [date, time] = value.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const wallAsUtc = Date.UTC(y, m - 1, d, hh, mm);
  let guess = new Date(wallAsUtc - tzOffsetMinutes(new Date(wallAsUtc)) * 60000);
  guess = new Date(wallAsUtc - tzOffsetMinutes(guess) * 60000);
  return guess;
}

// Date -> "2026-10-28T19:00" in New Haven time, for <input type="datetime-local">
export function toLocalInput(d: Date): string {
  const shifted = new Date(d.getTime() + tzOffsetMinutes(d) * 60000);
  return shifted.toISOString().slice(0, 16);
}

export function formatDuration(ms: number) {
  const totalMin = Math.round(Math.abs(ms) / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Current time, for server components (which render once per request).
export function requestTime() {
  return Date.now();
}

export const PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000;
