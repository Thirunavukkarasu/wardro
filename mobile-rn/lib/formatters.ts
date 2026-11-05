const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** `12 Mar 2026` */
export function formatShortDate(date: Date): string {
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

/** `Wed, Mar 12, 2026` */
export function formatLongDate(date: Date): string {
  const weekday = weekdays[(date.getDay() + 6) % 7];
  return `${weekday}, ${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** `YYYY-MM-DD`, the value used by the web date input. */
export function formatInputDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseInputDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `1,500` / `12,50,000` (Indian grouping), with a rupee prefix. */
export function formatPrice(value: number): string {
  const rounded = Math.round(value);
  const digits = Math.abs(rounded).toString();
  let grouped = digits;

  if (digits.length > 3) {
    const head = digits.slice(0, digits.length - 3);
    const tail = digits.slice(digits.length - 3);
    const groups: string[] = [];
    let end = head.length;
    while (end > 0) {
      const start = Math.max(0, end - 2);
      groups.unshift(head.slice(start, end));
      end = start;
    }
    grouped = `${groups.join(",")},${tail}`;
  }

  return `₹${rounded < 0 ? "-" : ""}${grouped}`;
}

/** Human label for the backend's `state` column. */
export function stateLabel(state: string): string {
  switch (state) {
    case "newly_purchased":
      return "New";
    case "in_use":
      return "In use";
    case "faded":
      return "Faded";
    case "expired":
      return "Expired";
    case "archived":
      return "Archived";
    default:
      return state.replace(/_/g, " ");
  }
}

export function stateColor(state: string): string {
  switch (state) {
    case "in_use":
      return "#16A34A";
    case "faded":
      return "#D97706";
    case "expired":
      return "#DC2626";
    case "archived":
      return "#94A3B8";
    default:
      return "#4F46E5";
  }
}
