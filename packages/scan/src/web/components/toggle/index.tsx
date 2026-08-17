import { splitProps, type JSX } from "solid-js";
import { cn } from "../../utils/helpers";

interface ToggleProps extends JSX.HTMLAttributes<HTMLInputElement> {
  checked: boolean;
  onChange: (event: Event) => void;
  class?: string;
}

export const Toggle = (props: ToggleProps) => {
  const [localProps, inputProps] = splitProps(props, ["class"]);

  return (
    <div class={cn("react-scan-toggle", localProps.class)}>
      <input type="checkbox" {...inputProps} />
      <div />
    </div>
  );
};
