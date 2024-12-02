let totalTime = 0;

export const getMainThreadTaskTime = () => totalTime;

export const createPerfObserver = () => {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    let time = 0;
    for (let i = 0, len = entries.length; i < len; i++) {
      const entry = entries[i];
      time += entry.duration;
    }
    totalTime = time;
  });

  observer.observe({ entryTypes: ['longtask'] });

  return observer;
};
