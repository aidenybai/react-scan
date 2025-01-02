import type { JSX } from 'preact';
import {
  type ForwardedRef,
  forwardRef,
} from 'preact/compat';

export interface SVGIconProps {
  size?: number | Array<number>;
  name: string;
  fill?: string;
  stroke?: string;
  className?: string;
  externalURL?: string;
  style?: JSX.CSSProperties;
}

export const Icon = forwardRef((props: SVGIconProps, ref: ForwardedRef<SVGSVGElement>) => {
  const {
    size = 15,
    name,
    fill = 'currentColor',
    stroke = 'currentColor',
    className,
    externalURL = '',
    style,
  } = props;

  const width = Array.isArray(size) ? size[0] : size;
  const height = Array.isArray(size) ? size[1] || size[0] : size;

  const attributes = {
    width: `${width}px`,
    height: `${height}px`,
    fill,
    stroke,
    className,
    style,
  };

  const path = `${externalURL}#${name}`;

  return (
    <svg
      ref={ref}
      {...attributes}
    >
      <use href={path} />
    </svg>
  );
});
