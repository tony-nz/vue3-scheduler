import { onUnmounted } from "vue";
import interact from "interactjs";

export interface InteractOptions {
  cellWidth: number;
  rowHeight: number;
  scale: number;
  snapX?: number;
  onDragMove?: (el: HTMLElement, dx: number, dy: number) => void;
  onDragEnd?: (el: HTMLElement, totalX: number, totalY: number) => void;
  onResizeMove?: (el: HTMLElement, width: number, edge: "left" | "right", deltaX: number) => void;
  onResizeEnd?: (el: HTMLElement, width: number, edge: "left" | "right") => void;
}

type InteractInstance = ReturnType<typeof interact>;

export function useInteract() {
  const activeInteractions: InteractInstance[] = [];

  function initDraggable(element: HTMLElement, opts: InteractOptions) {
    if (!element) return;

    let dragX = 0;
    let dragY = 0;

    const interactable = interact(element)
      .draggable({
        inertia: false,
        modifiers: [
          interact.modifiers.snap({
            targets: [
              interact.snappers.grid({
                x: opts.snapX ?? 10,
                y: opts.rowHeight,
              }),
            ],
            range: Infinity,
            relativePoints: [{ x: 0, y: 0 }],
          }),
          interact.modifiers.restrict({
            restriction: "parent",
            elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
            endOnly: false,
          }),
        ],
        listeners: {
          start() {
            dragX = 0;
            dragY = 0;
          },
          move(event) {
            dragX += event.dx;
            dragY += event.dy;

            // Visual feedback during drag
            element.style.transform = `translate(${dragX}px, ${dragY}px)`;
            element.style.zIndex = "50";

            opts.onDragMove?.(element, dragX, dragY);
          },
          end() {
            // Reset visual transform — parent will reposition via reactive data
            element.style.transform = "";
            element.style.zIndex = "";

            opts.onDragEnd?.(element, dragX, dragY);

            dragX = 0;
            dragY = 0;
          },
        },
      })
      .resizable({
        edges: {
          left: ".resize-handle-left",
          right: ".resize-handle-right",
          top: false,
          bottom: false,
        },
        modifiers: [
          interact.modifiers.restrictEdges({
            outer: "parent",
          }),
          interact.modifiers.restrictSize({
            min: { width: 50, height: opts.rowHeight },
          }),
        ],
        inertia: false,
        listeners: {
          move(event) {
            const width = event.rect.width;
            const edge = event.edges?.left ? "left" : "right";
            const deltaX = event.deltaRect?.left ?? 0;

            // Visual feedback: update width and shift left if resizing from left edge
            element.style.width = `${width}px`;
            if (edge === "left") {
              const currentLeft = parseFloat(element.style.left) || 0;
              element.style.left = `${currentLeft + deltaX}px`;
            }

            opts.onResizeMove?.(element, width, edge, deltaX);
          },
          end(event) {
            const width = event.rect.width;
            const edge = event.edges?.left ? "left" : "right";
            opts.onResizeEnd?.(element, width, edge);
          },
        },
      });

    activeInteractions.push(interactable);
    return interactable;
  }

  function cleanup() {
    for (const interactable of activeInteractions) {
      interactable.unset();
    }
    activeInteractions.length = 0;
  }

  onUnmounted(cleanup);

  return {
    initDraggable,
    cleanup,
  };
}
