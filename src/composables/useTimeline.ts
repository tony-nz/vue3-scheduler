import { computed, ref, type Ref } from "vue";
import { DEFAULT_OPTIONS, type GanttOptions, type GanttTimelineLevel, type ScaleUnit } from "../types/gantt";

export interface TimelineSlot {
  id: number;
  date: Date;
  formattedDate: string;
  formattedTime: string;
}

export interface TimelineLevelCell {
  label: string;
  span: number;
  date: Date;
}

export function useTimeline(
  start: Ref<Date>,
  end: Ref<Date>,
  options: Ref<GanttOptions>,
) {
  const cellWidth = computed(
    () => options.value.cellWidth ?? DEFAULT_OPTIONS.cellWidth,
  );
  const rowHeight = computed(
    () => options.value.rowHeight ?? DEFAULT_OPTIONS.rowHeight,
  );
  const scale = ref(options.value.scale ?? DEFAULT_OPTIONS.scale);
  const scaleIncrement = ref(scale.value);

  const scrollUpCount = ref(0);
  const scrollDownCount = ref(0);
  const scrollSpeed = computed(
    () => options.value.scrollSpeed ?? DEFAULT_OPTIONS.scrollSpeed,
  );

  // --- Set initial scale from options ---
  function initScale() {
    if (options.value.scale) {
      scale.value = options.value.scale;
      scaleIncrement.value = options.value.scale;
      return;
    }

    const unit = options.value.scaleUnit ?? "hours";
    const map: Record<ScaleUnit, number> = {
      minutes: 0.25,
      hours: 1,
      days: 24,
      weeks: 168,
      months: 720,
    };
    scale.value = map[unit];
    scaleIncrement.value = map[unit];
  }

  initScale();

  // --- Timeline generation ---
  const timeline = computed<TimelineSlot[]>(() => {
    const slots: TimelineSlot[] = [];
    const s = new Date(start.value);
    const e = new Date(end.value);
    const intervalMinutes = scale.value * 60;

    const current = new Date(s);
    while (current < e) {
      slots.push({
        id: current.getTime(),
        date: new Date(current),
        formattedDate: `${current.getDate()}/${current.getMonth() + 1}`,
        formattedTime: current.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      });
      current.setMinutes(current.getMinutes() + intervalMinutes);
    }

    return slots;
  });

  // --- Pixel math ---
  function dateToPixel(date: Date): number {
    const diffMs = date.getTime() - start.value.getTime();
    const diffMinutes = diffMs / 60000;
    return (diffMinutes / 60 / scale.value) * cellWidth.value;
  }

  function pixelToDate(px: number): Date {
    const minutes = (px / cellWidth.value) * scale.value * 60;
    return new Date(start.value.getTime() + minutes * 60000);
  }

  function durationToPixel(eventStart: Date, eventEnd: Date): number {
    const diffMs = eventEnd.getTime() - eventStart.getTime();
    const diffMinutes = diffMs / 60000;
    return (diffMinutes / 60 / scale.value) * cellWidth.value;
  }

  function rowToPixel(rowIndex: number): number {
    return rowIndex * rowHeight.value;
  }

  function pixelToRow(px: number): number {
    return Math.floor(px / rowHeight.value);
  }

  // --- Current time ---
  function getCurrentTimePixel(): number {
    return dateToPixel(new Date());
  }

  // --- Zoom via mouse wheel ---
  function onWheel(event: WheelEvent) {
    if (event.deltaY < 0) {
      scrollUpCount.value++;
      if (scrollUpCount.value >= scrollSpeed.value) {
        scale.value = Math.min(scale.value + scaleIncrement.value, 720);
        scrollUpCount.value = 0;
      }
    } else if (event.deltaY > 0) {
      scrollDownCount.value++;
      if (scrollDownCount.value >= scrollSpeed.value) {
        scale.value = Math.max(
          scale.value - scaleIncrement.value,
          scaleIncrement.value,
        );
        scrollDownCount.value = 0;
      }
    }
  }

  // --- Multi-level timeline header ---
  function formatLevelCell(date: Date, unit: ScaleUnit, format?: string): string {
    if (format) {
      return format
        .replace("YYYY", String(date.getFullYear()))
        .replace("MMM", date.toLocaleString("en-US", { month: "short" }))
        .replace("MM", String(date.getMonth() + 1).padStart(2, "0"))
        .replace("DD", String(date.getDate()).padStart(2, "0"))
        .replace("dd", date.toLocaleString("en-US", { weekday: "short" }))
        .replace("HH", String(date.getHours()).padStart(2, "0"))
        .replace("mm", String(date.getMinutes()).padStart(2, "0"));
    }
    switch (unit) {
      case "months": return date.toLocaleString("en-US", { month: "short", year: "numeric" });
      case "weeks": return `W${getWeekNumber(date)}`;
      case "days": return `${date.toLocaleString("en-US", { weekday: "short" })} ${date.getDate()}`;
      case "hours": return `${date.getHours()}:00`;
      case "minutes": return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
    }
  }

  function getWeekNumber(d: Date): number {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  function getLevelKey(date: Date, unit: ScaleUnit): string {
    switch (unit) {
      case "months": return `${date.getFullYear()}-${date.getMonth()}`;
      case "weeks": return `${date.getFullYear()}-W${getWeekNumber(date)}`;
      case "days": return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      case "hours": return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
      case "minutes": return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
    }
  }

  function generateTimelineLevel(level: GanttTimelineLevel): TimelineLevelCell[] {
    const cells: TimelineLevelCell[] = [];
    const slots = timeline.value;
    if (slots.length === 0) return cells;

    let currentKey = "";
    let currentCell: TimelineLevelCell | null = null;

    for (const slot of slots) {
      const key = getLevelKey(slot.date, level.unit);
      if (key !== currentKey) {
        if (currentCell) cells.push(currentCell);
        currentKey = key;
        currentCell = {
          label: formatLevelCell(slot.date, level.unit, level.format),
          span: 1,
          date: new Date(slot.date),
        };
      } else if (currentCell) {
        currentCell.span++;
      }
    }
    if (currentCell) cells.push(currentCell);

    return cells;
  }

  const timelineLevels = computed(() => {
    const levels = options.value.timelineLevels;
    if (!levels || levels.length === 0) return [];
    return levels.map((level) => generateTimelineLevel(level));
  });

  return {
    cellWidth,
    rowHeight,
    scale,
    timeline,
    timelineLevels,
    dateToPixel,
    pixelToDate,
    durationToPixel,
    rowToPixel,
    pixelToRow,
    getCurrentTimePixel,
    onWheel,
  };
}
