import { onMounted, onUnmounted, watch, type Ref } from "vue";

export function useScrollSync(
  sourceRef: Ref<HTMLElement | undefined>,
  targetRef: Ref<HTMLElement | undefined>,
) {
  let syncing = false;
  const listeners: Array<{ el: HTMLElement; handler: () => void }> = [];

  function sync(source: HTMLElement, target: HTMLElement) {
    if (syncing) return;
    syncing = true;
    target.scrollTop = source.scrollTop;
    requestAnimationFrame(() => {
      syncing = false;
    });
  }

  function setup() {
    cleanup();
    const source = sourceRef.value;
    const target = targetRef.value;
    if (!source || !target) return;

    const h1 = () => sync(source, target);
    const h2 = () => sync(target, source);
    source.addEventListener("scroll", h1, { passive: true });
    target.addEventListener("scroll", h2, { passive: true });
    listeners.push({ el: source, handler: h1 }, { el: target, handler: h2 });
  }

  function cleanup() {
    for (const { el, handler } of listeners) {
      el.removeEventListener("scroll", handler);
    }
    listeners.length = 0;
  }

  onMounted(setup);
  onUnmounted(cleanup);

  // Re-setup if refs change (e.g. component ref resolves after mount)
  watch([sourceRef, targetRef], () => {
    if (sourceRef.value && targetRef.value) {
      setup();
    }
  });

  return { setup, cleanup };
}
