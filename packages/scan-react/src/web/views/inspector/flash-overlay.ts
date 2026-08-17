interface FlashEntry {
  element: HTMLElement;
  overlay: HTMLElement;
  scrollCleanup?: () => void;
}

const fadeOutTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

const trackElementPosition = (
  element: Element,
  callback: (element: Element) => void,
): (() => void) => {
  const handleScroll = callback.bind(null, element);

  document.addEventListener('scroll', handleScroll, {
    passive: true,
    capture: true,
  });

  return () => {
    document.removeEventListener('scroll', handleScroll, { capture: true });
  };
};

export const flashManager = {
  activeFlashes: new Map<HTMLElement, FlashEntry>(),

  create(container: HTMLElement) {
    const existingOverlay = container.querySelector(
      '.react-scan-flash-overlay',
    );

    const overlay =
      existingOverlay instanceof HTMLElement
        ? existingOverlay
        : (() => {
            const newOverlay = document.createElement('div');
            newOverlay.className = 'react-scan-flash-overlay';
            container.appendChild(newOverlay);

            const scrollCleanup = trackElementPosition(container, () => {
              if (container.querySelector('.react-scan-flash-overlay')) {
                this.create(container);
              }
            });

            this.activeFlashes.set(container, {
              element: container,
              overlay: newOverlay,
              scrollCleanup,
            });

            return newOverlay;
          })();

    const existingTimer = fadeOutTimers.get(overlay);
    if (existingTimer) {
      clearTimeout(existingTimer);
      fadeOutTimers.delete(overlay);
    }

    requestAnimationFrame(() => {
      overlay.style.transition = 'none';
      overlay.style.opacity = '0.9';

      const timerId = setTimeout(() => {
        overlay.style.transition = 'opacity 150ms ease-out';
        overlay.style.opacity = '0';

        const cleanupTimer = setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
          const entry = this.activeFlashes.get(container);
          if (entry?.scrollCleanup) {
            entry.scrollCleanup();
          }
          this.activeFlashes.delete(container);
          fadeOutTimers.delete(overlay);
        }, 150);

        fadeOutTimers.set(overlay, cleanupTimer);
      }, 300);

      fadeOutTimers.set(overlay, timerId);
    });
  },

  cleanup(container: HTMLElement) {
    const entry = this.activeFlashes.get(container);
    if (entry) {
      const existingTimer = fadeOutTimers.get(entry.overlay);
      if (existingTimer) {
        clearTimeout(existingTimer);
        fadeOutTimers.delete(entry.overlay);
      }
      if (entry.overlay.parentNode) {
        entry.overlay.parentNode.removeChild(entry.overlay);
      }
      if (entry.scrollCleanup) {
        entry.scrollCleanup();
      }
      this.activeFlashes.delete(container);
    }
  },

  cleanupAll() {
    for (const [, entry] of this.activeFlashes) {
      this.cleanup(entry.element);
    }
  },
};
