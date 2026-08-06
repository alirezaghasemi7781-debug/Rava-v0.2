import {
  Trip,
  TripActivityStatus,
  TripEvent,
  TripEventType,
  TripLifecycleStatus,
  CityMode,
} from '../types';

/** Normalize legacy upcoming/now → pending/active. */
export function normalizeActivityStatus(status?: string | null): TripActivityStatus {
  switch (status) {
    case 'now':
    case 'active':
      return 'active';
    case 'completed':
      return 'completed';
    case 'skipped':
    case 'cancelled':
      return 'skipped';
    case 'pending':
    case 'upcoming':
    default:
      return 'pending';
  }
}

export function isActivityOpen(status: TripActivityStatus): boolean {
  return status === 'pending' || status === 'upcoming' || status === 'active' || status === 'now';
}

export function isActivityDone(status: TripActivityStatus): boolean {
  return status === 'completed' || status === 'skipped';
}

function extractTime(isoOrTime?: string | null, fallback = '09:00'): string {
  if (!isoOrTime) return fallback;
  if (/^\d{2}:\d{2}/.test(isoOrTime)) return isoOrTime.slice(0, 5);
  const d = new Date(isoOrTime);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toISOString().slice(11, 16);
}

function extractDate(isoOrDate?: string | null, fallback?: string): string {
  if (!isoOrDate) return fallback || new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}/.test(isoOrDate)) return isoOrDate.slice(0, 10);
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return fallback || new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

/** Map trips table row → TripEvent (client). */
export function mapDbTripToEvent(row: any): TripEvent {
  const details = (row.details && typeof row.details === 'object' ? row.details : {}) as TripEvent['details'] & {
    time?: string;
    date?: string;
    coordinates?: [number, number];
  };

  const coords =
    details.coordinates ||
    (Array.isArray(row.coordinates) ? row.coordinates : undefined);

  return {
    id: row.id,
    type: (row.type || 'activity') as TripEventType,
    title: row.title || 'بدون عنوان',
    time: details.time || extractTime(row.start_time),
    date: details.date || extractDate(row.start_time, row.date),
    status: normalizeActivityStatus(row.status),
    sequence: typeof row.sequence_order === 'number' ? row.sequence_order : (row.sequence ?? 0),
    journeyId: row.journey_id || row.journeyId || undefined,
    placeId: row.place_id || details.placeId || undefined,
    placeName: row.place_name || details.placeName || row.title || undefined,
    coordinates: coords,
    start_time: row.start_time || undefined,
    end_time: row.end_time || undefined,
    details: {
      flightNo: details.flightNo,
      gate: details.gate,
      seat: details.seat,
      address: row.destination_address || details.address,
      reservationId: details.reservationId,
      notes: details.notes,
      price: details.price,
    },
  };
}

/** Map TripEvent → trips insert/update payload. */
export function mapEventToDbPayload(event: TripEvent, userId?: string) {
  const startIso =
    event.start_time ||
    (event.date && event.time ? `${event.date}T${event.time}:00` : null);

  return {
    id: event.id,
    ...(userId ? { user_id: userId } : {}),
    journey_id: event.journeyId || null,
    type: event.type,
    title: event.title,
    start_time: startIso,
    end_time: event.end_time || null,
    destination_address: event.details?.address || event.placeName || null,
    details: {
      ...event.details,
      time: event.time,
      date: event.date,
      placeId: event.placeId,
      placeName: event.placeName,
      coordinates: event.coordinates,
    },
    status: normalizeActivityStatus(event.status),
    sequence_order: event.sequence ?? 0,
    place_id: event.placeId || null,
    place_name: event.placeName || event.title,
  };
}

export function mapDbUserTrip(row: any): Trip {
  return {
    id: row.id,
    city: (row.city as CityMode) || null,
    title: row.title || 'سفر',
    status: (row.status || 'planning') as TripLifecycleStatus,
    startDate: row.start_date || row.startDate || new Date().toISOString().slice(0, 10),
    endDate: row.end_date || row.endDate || new Date().toISOString().slice(0, 10),
    budgetStyle: row.budget_style || row.budgetStyle || undefined,
    interests: Array.isArray(row.interests) ? row.interests : [],
    templateId: row.template_id ?? row.templateId ?? null,
    passportEntry: row.passport_entry ?? row.passportEntry ?? null,
    totalBudget: row.total_budget != null ? Number(row.total_budget) : undefined,
    dailyExpenses: row.daily_expenses != null ? Number(row.daily_expenses) : undefined,
    recordedExpenses: row.recorded_expenses != null ? Number(row.recorded_expenses) : undefined,
    estimatedCost: row.estimated_cost != null ? Number(row.estimated_cost) : undefined,
    currency: row.currency ?? 'IRT',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTripToDbPayload(trip: Trip, userId?: string) {
  return {
    id: trip.id,
    ...(userId ? { user_id: userId } : {}),
    city: trip.city,
    title: trip.title,
    status: trip.status,
    start_date: trip.startDate,
    end_date: trip.endDate,
    budget_style: trip.budgetStyle || null,
    interests: trip.interests || [],
    template_id: trip.templateId || null,
    passport_entry: trip.passportEntry || null,
    total_budget: trip.totalBudget ?? 0,
    daily_expenses: trip.dailyExpenses ?? 0,
    recorded_expenses: trip.recordedExpenses ?? 0,
    estimated_cost: trip.estimatedCost ?? 0,
    currency: trip.currency ?? 'IRT',
    updated_at: new Date().toISOString(),
  };
}

export function sortEvents(events: TripEvent[]): TripEvent[] {
  return [...events].sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    if (a.sequence !== b.sequence) return a.sequence - b.sequence;
    return a.time.localeCompare(b.time);
  });
}

export function todayIso(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function addDaysIso(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getTodaysEvents(events: TripEvent[], date = todayIso()): TripEvent[] {
  return sortEvents(events.filter((e) => e.date === date));
}

export function suggestNextActivity(
  events: TripEvent[],
  afterId: string,
  date = todayIso()
): TripEvent | null {
  const today = getTodaysEvents(events, date);
  const idx = today.findIndex((e) => e.id === afterId);
  const candidates = today.slice(idx + 1).filter((e) => isActivityOpen(e.status));
  return candidates[0] || today.find((e) => e.id !== afterId && isActivityOpen(e.status)) || null;
}
