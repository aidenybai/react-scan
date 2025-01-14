import type { JSX } from 'preact';
import { cn } from '~web/utils/helpers';

type ToggleProps = Omit<JSX.HTMLAttributes<HTMLInputElement>, 'className' | 'onChange'> & {
  checked: boolean;
  onChange: ((e: Event) => void);
};

export const Toggle = ({
  checked,
  onChange,
  class: className,
  ...props
}: ToggleProps) => {
  return (
    <div className={cn('react-scan-toggle', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        {...props}
      />
      <div />
    </div>
  );
};
