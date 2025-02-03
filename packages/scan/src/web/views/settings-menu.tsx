import { cn } from '~web/utils/helpers';

type SettingsMenuProps = {
  /** Current outline state: 'off', 'always-on', or 'smart' */
  outlineState: 'off' | 'always-on' | 'smart';
  /** Callback when outline state changes */
  onOutlineStateChange: (state: 'off' | 'always-on' | 'smart') => void;
  /** Whether the FPS counter is visible */
  isFpsVisible: boolean;
  /** Callback when FPS visibility changes */
  onFpsVisibilityChange: (visible: boolean) => void;
  /** Whether notifications are visible */
  areNotificationsVisible: boolean;
  /** Callback when notifications visibility changes */
  onNotificationsVisibilityChange: (visible: boolean) => void;
  /** Callback to open summary view */
  onOpenSummary: () => void;
  /** Callback to close settings menu */
  onClose: () => void;
};

export function SettingsMenu({
  outlineState,
  onOutlineStateChange,
  isFpsVisible,
  onFpsVisibilityChange,
  areNotificationsVisible,
  onNotificationsVisibilityChange,
  onOpenSummary,
  onClose,
}: SettingsMenuProps) {
  return (
    <div className="absolute inset-0 bg-[#0A0A0A] flex flex-col">
      {/* Minimal Header */}
      <div className="h-8 flex items-center justify-end px-2">
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/5 rounded transition-colors text-gray-500 hover:text-gray-300"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-3">
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <section>
              <h3 className="text-[11px] font-medium text-white/70 uppercase tracking-wider mb-2">
                Quick Actions
              </h3>
              <button
                onClick={onOpenSummary}
                className="w-full px-3 py-2 rounded text-left text-xs text-white/70 hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3.688 3.037a.497.497 0 0 0-.651.651l6.5 15.999a.501.501 0 0 0 .947-.062l1.569-6.083a2 2 0 0 1 1.448-1.479l6.124-1.579a.5.5 0 0 0 .063-.947z" />
                </svg>
                <span>Open Performance Summary</span>
              </button>
            </section>

            {/* View Options */}
            <section>
              <h3 className="text-[11px] font-medium text-white/70 uppercase tracking-wider mb-2">
                View Options
              </h3>
              <div className="space-y-2">
                <label className="flex items-center justify-between w-full px-3 py-2 rounded text-xs text-white/70 hover:bg-white/5 transition-colors cursor-pointer">
                  <span>Show FPS Counter</span>
                  <input
                    type="checkbox"
                    checked={isFpsVisible}
                    onChange={(e) =>
                      onFpsVisibilityChange(e.currentTarget.checked)
                    }
                    className="h-3.5 w-3.5 rounded border-white/20 bg-black text-[#A284F5] focus:ring-[#A284F5] focus:ring-offset-0"
                  />
                </label>
                <label className="flex items-center justify-between w-full px-3 py-2 rounded text-xs text-white/70 hover:bg-white/5 transition-colors cursor-pointer">
                  <span>Show Notifications</span>
                  <input
                    type="checkbox"
                    checked={areNotificationsVisible}
                    onChange={(e) =>
                      onNotificationsVisibilityChange(e.currentTarget.checked)
                    }
                    className="h-3.5 w-3.5 rounded border-white/20 bg-black text-[#A284F5] focus:ring-[#A284F5] focus:ring-offset-0"
                  />
                </label>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div>
            <section>
              <h3 className="text-[11px] font-medium text-white/70 uppercase tracking-wider mb-2">
                Outline Mode
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => onOutlineStateChange('off')}
                  className={cn(
                    'w-full px-3 py-2 rounded text-left text-xs',
                    'transition-colors',
                    outlineState === 'off'
                      ? 'bg-[#A284F5] text-white'
                      : 'text-white/70 hover:bg-white/5',
                  )}
                >
                  Off
                </button>
                <button
                  onClick={() => onOutlineStateChange('always-on')}
                  className={cn(
                    'w-full px-3 py-2 rounded text-left text-xs',
                    'transition-colors',
                    outlineState === 'always-on'
                      ? 'bg-[#A284F5] text-white'
                      : 'text-white/70 hover:bg-white/5',
                  )}
                >
                  Always On
                </button>
                <button
                  onClick={() => onOutlineStateChange('smart')}
                  className={cn(
                    'w-full px-3 py-2 rounded text-left text-xs',
                    'transition-colors',
                    outlineState === 'smart'
                      ? 'bg-[#A284F5] text-white'
                      : 'text-white/70 hover:bg-white/5',
                  )}
                >
                  Smart Activation
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
