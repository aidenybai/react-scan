import type { InputHTMLAttributes } from 'react';
import { cn } from '~web/utils/helpers';

interface ToggleProps extends InputHTMLAttributes<HTMLInputElement> {
  checked: boolean;
  onChange: ((e: React.ChangeEvent<HTMLInputElement>) => void);
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
