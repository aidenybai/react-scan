import { memo } from 'preact/compat';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';
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
  (props: CopyToClipboardProps): JSX.Element => {
    const { text, children, onCopy, className, iconSize = 14 } = props;

    const refTimeout = useRef<TTimer>();
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
      if (isCopied) {
        refTimeout.current = setTimeout(() => setIsCopied(false), 600);
        return () => {
          clearTimeout(refTimeout?.current);
        };
      }
    }, [isCopied]);

    const copyToClipboard = useCallback(
      (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        navigator.clipboard.writeText(text).then(
          () => {
            setIsCopied(true);
            onCopy?.(true, text);
          },
          () => {
            onCopy?.(false, text);
          },
        );
      },
      [text, onCopy],
    );

    const ClipboardIcon = useMemo(
      (): JSX.Element => (
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
      ),
      [className, copyToClipboard, iconSize, isCopied],
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
