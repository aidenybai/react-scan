const remToPx = (options = {}) => {
  const baseValue = options.baseValue || 16;

  const remRegex = /(?<![-\w])(-)?((?:\d*\.)?\d+)rem\b/g;

  const convertRemToPx = (value) => {
    // Handle all cases: calc(), min(), max(), clamp(), and regular values
    return value.replace(remRegex, (_match, negative, num) => {
      const pixels = Number.parseFloat(num) * baseValue;
      return `${negative ? '-' : ''}${pixels}px`;
    });
  };

  return {
    postcssPlugin: 'postcss-rem-to-px',
    prepare() {
      return {
        Once(root) {
          root.walkDecls((decl) => {
            if (decl.value?.includes('rem')) {
              decl.value = convertRemToPx(decl.value);
            }
          });
        },
        Declaration(decl) {
          if (decl.value?.includes('rem')) {
            decl.value = convertRemToPx(decl.value);
          }
        },
        AtRule: {
          media: (atRule) => {
            if (atRule.params?.includes('rem')) {
              atRule.params = convertRemToPx(atRule.params);
            }
          },
        },
      };
    },
  };
};

remToPx.postcss = true;

export default remToPx;
