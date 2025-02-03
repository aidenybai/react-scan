import { useSignal, useSignalEffect } from '@preact/signals';
import { memo } from 'preact/compat';
import { useCallback, useRef } from 'preact/hooks';
import { cn } from '~web/utils/helpers';
import { Icon } from '../icon';

interface CopyToClipboardProps {
  text: string;
  children?: (props: {
    ClipboardIcon: JSX.Element;
    onClick: (e: MouseEvent) => void;
  }) => JSX.Element;
  onCopy?: (success: boolean, text: string) => void;
  className?: string;
  iconSize?: number;
}

export const CopyToClipboard = memo(
  ({
    text,
    children,
    onCopy,
    className,
    iconSize = 14,
  }: CopyToClipboardProps): JSX.Element => {
    const refTimeout = useRef<TTimer>();

    const isCopied = useSignal(false);

    useSignalEffect(() => {
      if (isCopied.value) {
        refTimeout.current = setTimeout(() => {
          isCopied.value = false;
        }, 600);
        return () => {
          clearTimeout(refTimeout.current);
        };
      }
    });

    // TODO(Alexis): remove hook when fine-grained reactivity is implemented.
    const copyToClipboard = useCallback(
      (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        navigator.clipboard.writeText(text).then(
          () => {
            isCopied.value = true;
            onCopy?.(true, text);
          },
          () => {
            onCopy?.(false, text);
          },
        );
      },
      [text, onCopy, isCopied],
    );

    const ClipboardIcon = (
      <button
        onClick={copyToClipboard}
        type="button"
        className={cn(
          'z-10',
          'flex items-center justify-center',
          'hover:text-dev-pink-400',
          'transition-colors duration-200 ease-in-out',
          'cursor-pointer',
          `size-[${iconSize}px]`,
          className,
        )}
      >
        <Icon
          name={`icon-${isCopied ? 'check' : 'copy'}`}
          size={[iconSize]}
          className={cn({
            'text-green-500': isCopied,
          })}
        />
      </button>
    );

    if (!children) {
      return ClipboardIcon;
    }

    return children({
      ClipboardIcon,
      onClick: copyToClipboard,
    });
  },
);
