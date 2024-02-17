interface TimelineItem {
  row: number;
  background: string;
  text: string;
  start: string;
  end: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: any;
}

interface TimelineRow {
  height: number;
  marginTop: number;
}

interface TimelineOptions {
  cellWidth: number;
  row: TimelineRow;
  scale: number;
  start: string;
  end: string;
}

export type { TimelineItem, TimelineOptions };
