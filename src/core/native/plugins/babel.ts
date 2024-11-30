import path from 'path';

export const withReactScanTreeShake = ({ ...config }: any) => {
  config = config ?? {}
  return function (api: { cache: (_: boolean) => void }) {
    api.cache(true);

    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      if (!config.plugins) {
        config.plugins = [];
      }

      const transformerPath = path.join(__dirname, './transformer.js');
      config.plugins.push(transformerPath);
    }
    if (!config.presets) {
      config.presets = [];
    }

    const hasBabelPresetExp = config.presets.some(
      (preset) =>
        preset === 'babel-preset-expo' ||
        (Array.isArray(preset) && preset.at(0) === 'babel-preset-expo'),
    );
    if (!hasBabelPresetExp) {
      config.presets.push('babel-preset-expo');
    }
    return {
      ...config,
      presets: config.presets,
      plugins: config.plugins,
    };
  };
};
