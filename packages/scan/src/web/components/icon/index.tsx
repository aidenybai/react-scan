import type { JSX } from "solid-js";

export interface SVGIconProps {
  size?: number | Array<number>;
  name: string;
  fill?: string;
  stroke?: string;
  class?: string;
  externalURL?: string;
  style?: JSX.CSSProperties;
}

export const Icon = (props: SVGIconProps) => {
  const dimensions = () => {
    const size = props.size ?? 15;
    if (Array.isArray(size)) {
      return {
        width: size[0],
        height: size[1] || size[0],
      };
    }
    return { width: size, height: size };
  };
  const path = () => `${props.externalURL ?? ""}#${props.name}`;

  return (
    <svg
      width={`${dimensions().width}px`}
      height={`${dimensions().height}px`}
      fill={props.fill ?? "currentColor"}
      stroke={props.stroke ?? "currentColor"}
      class={props.class}
      aria-hidden="true"
      style={{
        ...props.style,
        "min-width": `${dimensions().width}px`,
        "max-width": `${dimensions().width}px`,
        "min-height": `${dimensions().height}px`,
        "max-height": `${dimensions().height}px`,
      }}
    >
      <use href={path()} />
    </svg>
  );
};
