import { nanoid } from 'nanoid';

export const WORKING_HOURS_AXIS_START = 6 * 60;
export const WORKING_HOURS_AXIS_END = 22 * 60;
export const WORKING_HOURS_TOTAL_MINUTES =
  WORKING_HOURS_AXIS_END - WORKING_HOURS_AXIS_START;
export const WORKING_HOURS_SNAP_MINUTES = 30;
export const WORKING_HOURS_MIN_BLOCK_MINUTES = 30;
export const WORKING_HOURS_SPLIT_GAP_MINUTES = 60;

export const WORKING_HOURS_DAYS = [
  { value: 1, labelKey: 'Monday' },
  { value: 2, labelKey: 'Tuesday' },
  { value: 3, labelKey: 'Wednesday' },
  { value: 4, labelKey: 'Thursday' },
  { value: 5, labelKey: 'Friday' },
  { value: 6, labelKey: 'Saturday' },
  { value: 7, labelKey: 'Sunday' },
] as const;

export interface WorkingHoursDraftBlock {
  id: string;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  sourceId?: string;
}

export type WorkingHoursDraftWeek = Record<number, WorkingHoursDraftBlock[]>;

export interface WorkingHoursSlotLike {
  id?: string;
  dayOfWeek: number;
  fromTime: string;
  tillTime: string;
}

export interface WorkingHoursTemplateDefinition {
  id: string;
  labelKey: string;
  descriptionKey: string;
  blocks: Array<Pick<WorkingHoursDraftBlock, 'dayOfWeek' | 'startMinutes' | 'endMinutes'>>;
}

export const WORKING_HOURS_TEMPLATES: WorkingHoursTemplateDefinition[] = [
  {
    id: 'mon_fri_9_17',
    labelKey: 'Mon-Fri 9-17',
    descriptionKey: 'Standard week',
    blocks: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      dayOfWeek,
      startMinutes: 9 * 60,
      endMinutes: 17 * 60,
    })),
  },
  {
    id: 'mon_fri_8_16',
    labelKey: 'Mon-Fri 8-16',
    descriptionKey: 'Early start',
    blocks: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      dayOfWeek,
      startMinutes: 8 * 60,
      endMinutes: 16 * 60,
    })),
  },
  {
    id: 'mon_fri_with_lunch',
    labelKey: 'Mon-Fri with lunch',
    descriptionKey: 'With lunch break',
    blocks: [1, 2, 3, 4, 5].flatMap((dayOfWeek) => [
      { dayOfWeek, startMinutes: 8 * 60, endMinutes: 12 * 60 },
      { dayOfWeek, startMinutes: 13 * 60, endMinutes: 17 * 60 },
    ]),
  },
];

function createBlockId() {
  return `wh_${nanoid(10)}`;
}

export function clampMinutes(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function snapMinutes(value: number, snap = WORKING_HOURS_SNAP_MINUTES) {
  return Math.round(value / snap) * snap;
}

export function formatMinutes(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatMinutesWithSeconds(value: number) {
  return `${formatMinutes(value)}:00`;
}

export function parseTimeToMinutes(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function formatDurationLabel(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

export function buildBlockLabel(block: WorkingHoursDraftBlock) {
  return `${formatMinutes(block.startMinutes)} - ${formatMinutes(block.endMinutes)} / ${formatDurationLabel(block.endMinutes - block.startMinutes)}`;
}

export function createEmptyDraftWeek(): WorkingHoursDraftWeek {
  return {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
  };
}

export function cloneDraftWeek(week: WorkingHoursDraftWeek): WorkingHoursDraftWeek {
  const next = createEmptyDraftWeek();
  for (const day of WORKING_HOURS_DAYS) {
    next[day.value] = [...(week[day.value] ?? [])]
      .map((block) => ({ ...block }))
      .sort(compareBlocks);
  }
  return next;
}

export function createDraftBlock(
  dayOfWeek: number,
  startMinutes: number,
  endMinutes: number,
  sourceId?: string
): WorkingHoursDraftBlock {
  return {
    id: createBlockId(),
    dayOfWeek,
    startMinutes,
    endMinutes,
    sourceId,
  };
}

export function buildDraftWeek(items: WorkingHoursSlotLike[]): WorkingHoursDraftWeek {
  const week = createEmptyDraftWeek();
  for (const item of items) {
    const startMinutes = parseTimeToMinutes(item.fromTime);
    const endMinutes = parseTimeToMinutes(item.tillTime);
    if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) {
      continue;
    }
    week[item.dayOfWeek] = sortBlocks([
      ...(week[item.dayOfWeek] ?? []),
      {
        id: item.id || createBlockId(),
        sourceId: item.id,
        dayOfWeek: item.dayOfWeek,
        startMinutes,
        endMinutes,
      },
    ]);
  }
  return week;
}

export function serializeDraftWeek(week: WorkingHoursDraftWeek) {
  return WORKING_HOURS_DAYS.flatMap((day) =>
    sortBlocks(week[day.value] ?? []).map((block) => ({
      dayOfWeek: day.value,
      fromTime: formatMinutesWithSeconds(block.startMinutes),
      tillTime: formatMinutesWithSeconds(block.endMinutes),
    }))
  );
}

export function getDraftWeekSignature(week: WorkingHoursDraftWeek) {
  return JSON.stringify(serializeDraftWeek(week));
}

export function getTotalMinutes(week: WorkingHoursDraftWeek) {
  return Object.values(week).flat().reduce((sum, block) => sum + block.endMinutes - block.startMinutes, 0);
}

export function getActiveDayCount(week: WorkingHoursDraftWeek) {
  return WORKING_HOURS_DAYS.filter((day) => (week[day.value] ?? []).length > 0).length;
}

export function sortBlocks(blocks: WorkingHoursDraftBlock[]) {
  return [...blocks].sort(compareBlocks);
}

export function compareBlocks(a: WorkingHoursDraftBlock, b: WorkingHoursDraftBlock) {
  if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
  return a.endMinutes - b.endMinutes;
}

export function findDraftBlock(week: WorkingHoursDraftWeek, blockId: string) {
  for (const day of WORKING_HOURS_DAYS) {
    const block = (week[day.value] ?? []).find((item) => item.id === blockId);
    if (block) {
      return { dayOfWeek: day.value, block };
    }
  }
  return null;
}

export function canPlaceRange(
  blocks: WorkingHoursDraftBlock[],
  startMinutes: number,
  endMinutes: number,
  ignoreId?: string
) {
  if (startMinutes < WORKING_HOURS_AXIS_START) return false;
  if (endMinutes > WORKING_HOURS_AXIS_END) return false;
  if (endMinutes - startMinutes < WORKING_HOURS_MIN_BLOCK_MINUTES) return false;
  return blocks.every((block) => {
    if (block.id === ignoreId) return true;
    return endMinutes <= block.startMinutes || startMinutes >= block.endMinutes;
  });
}

export function replaceDayBlocks(
  week: WorkingHoursDraftWeek,
  dayOfWeek: number,
  blocks: WorkingHoursDraftBlock[]
) {
  const next = cloneDraftWeek(week);
  next[dayOfWeek] = sortBlocks(blocks.map((block) => ({ ...block, dayOfWeek })));
  return next;
}

export function upsertDraftBlock(
  week: WorkingHoursDraftWeek,
  block: WorkingHoursDraftBlock
) {
  const next = cloneDraftWeek(week);
  next[block.dayOfWeek] = sortBlocks([
    ...(next[block.dayOfWeek] ?? []).filter((item) => item.id !== block.id),
    { ...block },
  ]);
  return next;
}

export function removeDraftBlock(week: WorkingHoursDraftWeek, blockId: string) {
  const located = findDraftBlock(week, blockId);
  if (!located) return week;
  return replaceDayBlocks(
    week,
    located.dayOfWeek,
    (week[located.dayOfWeek] ?? []).filter((block) => block.id !== blockId)
  );
}

export function resolveNearestAvailableStart(
  blocks: WorkingHoursDraftBlock[],
  desiredStart: number,
  duration: number,
  options?: { ignoreId?: string; step?: number }
) {
  const step = options?.step ?? WORKING_HOURS_SNAP_MINUTES;
  let bestStart: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (
    let start = WORKING_HOURS_AXIS_START;
    start + duration <= WORKING_HOURS_AXIS_END;
    start += step
  ) {
    const end = start + duration;
    if (!canPlaceRange(blocks, start, end, options?.ignoreId)) {
      continue;
    }
    const distance = Math.abs(start - desiredStart);
    if (distance < bestDistance || (distance === bestDistance && (bestStart == null || start < bestStart))) {
      bestStart = start;
      bestDistance = distance;
    }
  }

  return bestStart;
}

export function duplicateDraftBlock(
  week: WorkingHoursDraftWeek,
  blockId: string,
  step = WORKING_HOURS_SNAP_MINUTES
) {
  const located = findDraftBlock(week, blockId);
  if (!located) return null;

  const blocks = week[located.dayOfWeek] ?? [];
  const duration = located.block.endMinutes - located.block.startMinutes;
  for (
    let start = located.block.endMinutes;
    start + duration <= WORKING_HOURS_AXIS_END;
    start += step
  ) {
    const end = start + duration;
    if (!canPlaceRange(blocks, start, end)) {
      continue;
    }
    return upsertDraftBlock(
      week,
      createDraftBlock(located.dayOfWeek, start, end)
    );
  }

  return null;
}

export function splitDraftBlock(
  week: WorkingHoursDraftWeek,
  blockId: string,
  gapMinutes = WORKING_HOURS_SPLIT_GAP_MINUTES,
  snap = WORKING_HOURS_SNAP_MINUTES
) {
  const located = findDraftBlock(week, blockId);
  if (!located) return null;

  const duration = located.block.endMinutes - located.block.startMinutes;
  if (duration < WORKING_HOURS_MIN_BLOCK_MINUTES * 2 + gapMinutes) {
    return null;
  }

  const available = duration - gapMinutes;
  const firstDuration = Math.floor(available / 2 / snap) * snap;
  const secondDuration = available - firstDuration;
  if (
    firstDuration < WORKING_HOURS_MIN_BLOCK_MINUTES ||
    secondDuration < WORKING_HOURS_MIN_BLOCK_MINUTES
  ) {
    return null;
  }

  const first = createDraftBlock(
    located.dayOfWeek,
    located.block.startMinutes,
    located.block.startMinutes + firstDuration
  );
  const second = createDraftBlock(
    located.dayOfWeek,
    first.endMinutes + gapMinutes,
    located.block.endMinutes
  );

  return replaceDayBlocks(
    week,
    located.dayOfWeek,
    [...(week[located.dayOfWeek] ?? []).filter((block) => block.id !== blockId), first, second]
  );
}

export function moveDraftBlock(
  week: WorkingHoursDraftWeek,
  blockId: string,
  desiredStart: number,
  step = WORKING_HOURS_SNAP_MINUTES
) {
  const located = findDraftBlock(week, blockId);
  if (!located) return null;

  const duration = located.block.endMinutes - located.block.startMinutes;
  const resolvedStart = resolveNearestAvailableStart(
    week[located.dayOfWeek] ?? [],
    desiredStart,
    duration,
    { ignoreId: blockId, step }
  );
  if (resolvedStart == null) return null;

  return upsertDraftBlock(week, {
    ...located.block,
    startMinutes: resolvedStart,
    endMinutes: resolvedStart + duration,
  });
}

export function resizeDraftBlock(
  week: WorkingHoursDraftWeek,
  blockId: string,
  edge: 'left' | 'right',
  value: number
) {
  const located = findDraftBlock(week, blockId);
  if (!located) return null;

  const siblings = sortBlocks(
    (week[located.dayOfWeek] ?? []).filter((block) => block.id !== blockId)
  );

  if (edge === 'left') {
    const previous = [...siblings]
      .reverse()
      .find((block) => block.endMinutes <= located.block.endMinutes);
    const minStart = previous?.endMinutes ?? WORKING_HOURS_AXIS_START;
    const nextStart = clampMinutes(
      value,
      minStart,
      located.block.endMinutes - WORKING_HOURS_MIN_BLOCK_MINUTES
    );
    return upsertDraftBlock(week, {
      ...located.block,
      startMinutes: nextStart,
    });
  }

  const next = siblings.find((block) => block.startMinutes >= located.block.startMinutes);
  const maxEnd = next?.startMinutes ?? WORKING_HOURS_AXIS_END;
  const nextEnd = clampMinutes(
    value,
    located.block.startMinutes + WORKING_HOURS_MIN_BLOCK_MINUTES,
    maxEnd
  );
  return upsertDraftBlock(week, {
    ...located.block,
    endMinutes: nextEnd,
  });
}

export function replaceDayWithSource(
  week: WorkingHoursDraftWeek,
  sourceDay: number,
  targetDays: number[]
) {
  const next = cloneDraftWeek(week);
  const sourceBlocks = sortBlocks(week[sourceDay] ?? []);
  for (const day of targetDays) {
    next[day] = sourceBlocks.map((block) =>
      createDraftBlock(day, block.startMinutes, block.endMinutes)
    );
  }
  return next;
}

export function applyTemplateDraft(template: WorkingHoursTemplateDefinition) {
  const next = createEmptyDraftWeek();
  for (const block of template.blocks) {
    next[block.dayOfWeek] = sortBlocks([
      ...(next[block.dayOfWeek] ?? []),
      createDraftBlock(block.dayOfWeek, block.startMinutes, block.endMinutes),
    ]);
  }
  return next;
}
