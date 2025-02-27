import type { JSX } from 'preact';
import { type ForwardedRef, forwardRef } from 'preact/compat';

export interface SVGIconProps {
  size?: number | Array<number>;
  name: string;
  fill?: string;
  stroke?: string;
  className?: string;
  externalURL?: string;
  style?: JSX.CSSProperties;
}

export const Icon = /* @__PURE__ */ forwardRef(
  (
    {
      size = 15,
      name,
      fill = 'currentColor',
      stroke = 'currentColor',
      className,
      externalURL = '',
      style,
    }: SVGIconProps,
    ref: ForwardedRef<SVGSVGElement>,
  ) => {
    const width = Array.isArray(size) ? size[0] : size;
    const height = Array.isArray(size) ? size[1] || size[0] : size;

    const path = `${externalURL}#${name}`;

    return (
      <svg
        ref={ref}
        width={`${width}px`}
        height={`${height}px`}
        fill={fill}
        stroke={stroke}
        className={className}
        style={{
          ...style,
          minWidth: `${width}px`,
          maxWidth: `${width}px`,
          minHeight: `${height}px`,
          maxHeight: `${height}px`,
        }}
      >
        <title>{name}</title>
        <use href={path} />
      </svg>
    );
  },
);
