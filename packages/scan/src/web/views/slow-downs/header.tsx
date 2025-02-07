import { Icon } from "~web/components/icon"
import { cn } from "~web/utils/helpers"

export const HeaderSlowDowns = () => {
  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center gap-x-2',
      )}
    >
      <Icon name="icon-sanil" />
      Slow Downs
    </div>
  )
}
