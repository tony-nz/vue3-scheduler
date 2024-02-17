interface TimelineItem {
  row: number;
  background: string;
  text: string;
  start: string;
  end: string;
}

interface TimelineOptions {
  cellWidth: number;
  rowHeight: number;
  scale: number;
  start: string;
  end: string;
}

export type { TimelineItem, TimelineOptions };
