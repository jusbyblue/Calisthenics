/**
 * Returns the current calendar date in the local timezone formatted as YYYY-MM-DD.
 * This prevents timezone drift bugs when users log workouts in their local timezone.
 */
export function getLocalDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
