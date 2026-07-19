import { createSignal, onCleanup, type JSX } from "solid-js";
import { COPY_FEEDBACK_DURATION_MS } from "../../constants";
import { cn } from "../../utils/helpers";
import { Icon } from "../icon";

interface CopyToClipboardProps {
  text: string;
  children?: (props: {
    ClipboardIcon: JSX.Element;
    onClick: (event: MouseEvent) => void;
  }) => JSX.Element;
  onCopy?: (success: boolean, text: string) => void;
  class?: string;
  iconSize?: number;
}

export const CopyToClipboard = (props: CopyToClipboardProps): JSX.Element => {
  const [isCopied, setIsCopied] = createSignal(false);
  let resetTimeoutId: ReturnType<typeof setTimeout> | undefined;

  const copyToClipboard = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    navigator.clipboard.writeText(props.text).then(
      () => {
        setIsCopied(true);
        props.onCopy?.(true, props.text);
        clearTimeout(resetTimeoutId);
        resetTimeoutId = setTimeout(() => setIsCopied(false), COPY_FEEDBACK_DURATION_MS);
      },
      () => {
        props.onCopy?.(false, props.text);
      },
    );
  };

  onCleanup(() => {
    clearTimeout(resetTimeoutId);
  });

  const clipboardIcon = () => {
    const iconSize = props.iconSize ?? 14;
    return (
      <button
        onClick={copyToClipboard}
        type="button"
        class={cn(
          "z-10 flex items-center justify-center hover:text-dev-pink-400",
          "transition-colors duration-200 ease-in-out cursor-pointer",
          props.class,
        )}
        style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
      >
        <Icon
          name={`icon-${isCopied() ? "check" : "copy"}`}
          size={iconSize}
          class={cn(isCopied() && "text-green-500")}
        />
      </button>
    );
  };

  if (!props.children) {
    return clipboardIcon();
  }

  return props.children({
    ClipboardIcon: clipboardIcon(),
    onClick: copyToClipboard,
  });
};
