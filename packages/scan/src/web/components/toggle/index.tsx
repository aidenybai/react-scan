import type { JSX } from 'preact';
import { cn } from '~web/utils/helpers';

interface ToggleProps extends JSX.HTMLAttributes<HTMLInputElement> {
  checked: boolean;
  onChange: ((e: Event) => void);
  className?: string;
};

export const Toggle = ({
  className,
  ...props
}: ToggleProps) => {
  return (
    <div className={cn('react-scan-toggle', className)}>
      <input
        type="checkbox"
        {...props}
      />
      <div />
    </div>
  );
};
