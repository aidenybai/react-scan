import { getReport } from '../index';

const styles = {
  header: 'font-size: 14px; font-weight: bold;',
  componentName: 'font-weight: bold',
  label: 'color: #7f8c8d',
  value: 'color: #2980b9; font-weight: bold',
  warning: 'color: #e74c3c; font-weight: bold',
} as const;

interface RenderData {
  trigger: boolean;
  time: number;
}

export function printReport(componentNames: string[]) {
  const report = getReport();

  if (!report) {
    // eslint-disable-next-line no-console
    console.warn('❌ No performance report available');
    return;
  }

  if (componentNames.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ No components specified for reporting');
    return;
  }

  // eslint-disable-next-line no-console
  console.log('\n📊 %cPerformance Report', styles.header);

  componentNames.forEach((componentName) => {
    const componentReport =
      report[componentName as keyof typeof report.components];

    if (!componentReport) {
      // eslint-disable-next-line no-console
      console.warn(`⚠️ No data found for ${componentName}`);
      return;
    }

    const avgRenderTime = componentReport.time / componentReport.count;

    const badRenderPercentage =
      (componentReport.badRenders.length / componentReport.count) * 100;
    const cascadingRenders = componentReport.badRenders.filter(
      (render: RenderData) => !render.trigger,
    ).length;

    // eslint-disable-next-line no-console
    console.group(`%c⏱️ ${componentName}`, styles.componentName);
    // eslint-disable-next-line no-console
    console.log(
      '%c   Renders:%c %d',
      styles.label,
      styles.value,
      componentReport.count,
    );
    // eslint-disable-next-line no-console
    console.log(
      '%c   Total render time:%c %fms',
      styles.label,
      styles.value,
      Number(componentReport.time.toFixed(3)),
    );
    // eslint-disable-next-line no-console
    console.log(
      '%c   Avg render time:%c %fms',
      styles.label,
      styles.value,
      Number(avgRenderTime.toFixed(3)),
    );
    // eslint-disable-next-line no-console
    console.log(
      '%c   Cascading renders:%c %d (%d%%)',
      styles.label,
      styles.warning,
      cascadingRenders,
      Number(((cascadingRenders / componentReport.count) * 100).toFixed(1)),
    );
    // eslint-disable-next-line no-console
    console.log(
      '%c   Total renders:%c %d (%d%%)',
      styles.label,
      styles.warning,
      componentReport.badRenders.length,
      Number(badRenderPercentage.toFixed(1)),
    );
    // eslint-disable-next-line no-console
    console.groupEnd();
  });
}
