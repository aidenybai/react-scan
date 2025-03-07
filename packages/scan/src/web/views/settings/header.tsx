import { signalIsSettingsOpen } from '~web/state';
import { cn } from '~web/utils/helpers';

export const HeaderSettings = () => {
  const isSettingsOpen = signalIsSettingsOpen.value;
  return (
    <span
      data-text="Settings"
      className={cn(
        'absolute inset-0 flex items-center',
        'with-data-text',
        'transition-transform duration-300',
        isSettingsOpen ? 'translate-y-0' : '-translate-y-[200%]',
      )}
    />
  );
};
