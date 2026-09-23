/**
 * Human-friendly formatting + icon/text labels.
 * Every status label pairs an icon with text so meaning never depends on colour.
 */
import type { Availability, Condition, FacilityType, Issue, OpenStatus, Priority, TicketStatus } from '../../shared/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "23 Sep 2026, 4:30 PM" — the exact freshness format required by the brief. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

/** "Due 24 Sep 2026, 4:30 PM" style deadline from createdAt + slaHours. */
export function dueDate(iso: string, slaHours: number): string {
  const d = new Date(iso);
  d.setTime(d.getTime() + slaHours * 3600 * 1000);
  return formatDate(d.toISOString());
}

export function daysAgo(iso: string): number {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return 0;
  return Math.floor((Date.now() - d) / 86_400_000);
}

interface Labeled {
  glyph: string;
  text: string;
}

export const conditionLabel = (c: Condition): Labeled =>
  ({
    clean: { glyph: '🧼', text: 'Clean' },
    usable: { glyph: '👍', text: 'Usable' },
    broken: { glyph: '⚠️', text: 'Broken' },
    locked: { glyph: '🔒', text: 'Locked' },
    no_water: { glyph: '🚱', text: 'No water' },
  })[c];

export const issueLabel = (i: Issue): Labeled =>
  i === 'other' ? { glyph: 'ℹ️', text: 'Other issue' } : conditionLabel(i);

export const availabilityLabel = (a: Availability): Labeled =>
  a === 'available' ? { glyph: '✔', text: 'Available' } : { glyph: '✘', text: 'Unavailable' };

export const facilityTypeLabel = (t: FacilityType): Labeled =>
  t === 'toilet' ? { glyph: '🚻', text: 'Public toilet' } : { glyph: '💧', text: 'Drinking water' };

export const openStatusLabel = (s: OpenStatus): Labeled =>
  ({
    open: { glyph: '🟢', text: 'Open' },
    closed: { glyph: '⛔', text: 'Closed' },
    unknown: { glyph: '❔', text: 'Hours unknown' },
  })[s];

export const statusLabel = (s: TicketStatus): Labeled =>
  ({
    submitted: { glyph: '📤', text: 'Submitted' },
    assigned: { glyph: '👷', text: 'Assigned' },
    in_progress: { glyph: '🛠️', text: 'In progress' },
    resolved: { glyph: '✅', text: 'Resolved' },
  })[s];

export const priorityLabel = (p: Priority): Labeled =>
  ({
    high: { glyph: '▲', text: 'High priority' },
    medium: { glyph: '◆', text: 'Medium priority' },
    low: { glyph: '▽', text: 'Low priority' },
  })[p];

/** Tone class for badges — always combined with icon + text above. */
export function badgeTone(
  kind: 'condition' | 'availability' | 'status' | 'priority',
  value: string,
): string {
  if (kind === 'condition') {
    if (value === 'clean' || value === 'usable') return 'ok';
    if (value === 'broken' || value === 'no_water') return 'bad';
    return 'warn';
  }
  if (kind === 'availability') return value === 'available' ? 'ok' : 'bad';
  if (kind === 'status') {
    if (value === 'resolved') return 'ok';
    if (value === 'in_progress') return 'info';
    if (value === 'assigned') return 'info';
    return 'warn';
  }
  if (value === 'high') return 'bad';
  if (value === 'medium') return 'warn';
  return 'muted';
}
