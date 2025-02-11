import { signalIsSettingsOpen } from "~web/state";
import { cn } from "~web/utils/helpers";

export const HeaderSettings = () => {
  const isSettingsOpen = signalIsSettingsOpen.value;
  return (
    <span
      data-text="Settings"
      className={cn(
        'absolute inset-0 flex items-center',
        'with-data-text',
        '-translate-y-[200%]',
        'transition-transform duration-300',
        {
          'translate-y-0': isSettingsOpen,
        },
      )}
    />
  );
};
