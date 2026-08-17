import { For, Index, Show, createMemo, createSignal } from "solid-js";
import { CopyToClipboard } from "../../components/copy-to-clipboard";
import { Icon } from "../../components/icon";
import { cn } from "../../utils/helpers";
import { formatForClipboard, formatValuePreview, safeGetValue } from "./utils";

interface ArrayHeaderProps {
  length: number;
  expanded: boolean;
  onToggle: () => void;
  isNegative: boolean;
}

interface TreeNodeProps {
  value: unknown;
  path: string;
  isNegative: boolean;
}

interface DiffValueViewProps {
  value: unknown;
  expanded: boolean;
  onToggle: () => void;
  isNegative: boolean;
}

const ArrayHeader = (props: ArrayHeaderProps) => (
  <div class="flex items-center gap-1">
    <button type="button" onClick={props.onToggle} class="flex items-center p-0 opacity-50">
      <Icon
        name="icon-chevron-right"
        size={12}
        class={cn(
          "transition-[color,transform]",
          props.isNegative ? "text-[#f87171]" : "text-[#4ade80]",
          props.expanded && "rotate-90",
        )}
      />
    </button>
    <span>Array({props.length})</span>
  </div>
);

const TreeNode = (props: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = createSignal(false);
  const canExpand = createMemo(
    () => props.value !== null && typeof props.value === "object" && !(props.value instanceof Date),
  );
  const entryKeys = createMemo(() => (canExpand() ? Object.keys(props.value as object) : []));
  const getEntryValue = (key: string) =>
    canExpand() ? (props.value as Record<string, unknown>)[key] : undefined;

  return (
    <Show
      when={canExpand()}
      fallback={
        <div class="flex items-center gap-1">
          <span class="text-gray-500">{props.path}:</span>
          <span class="truncate">{formatValuePreview(props.value)}</span>
        </div>
      }
    >
      <div class="flex flex-col">
        <div class="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            class="flex items-center p-0 opacity-50"
          >
            <Icon
              name="icon-chevron-right"
              size={12}
              class={cn(
                "transition-[color,transform]",
                props.isNegative ? "text-[#f87171]" : "text-[#4ade80]",
                isExpanded() && "rotate-90",
              )}
            />
          </button>
          <span class="text-gray-500">{props.path}:</span>
          <Show when={!isExpanded()}>
            <span class="truncate">
              {props.value instanceof Date
                ? formatValuePreview(props.value)
                : `{${Object.keys(props.value as object).join(", ")}}`}
            </span>
          </Show>
        </div>
        <Show when={isExpanded()}>
          <div class="pl-5 border-l border-[#333] mt-0.5 ml-1 flex flex-col gap-0.5">
            <For each={entryKeys()}>
              {(key) => (
                <TreeNode value={getEntryValue(key)} path={key} isNegative={props.isNegative} />
              )}
            </For>
          </div>
        </Show>
      </div>
    </Show>
  );
};

export const DiffValueView = (props: DiffValueViewProps) => {
  const safeResult = createMemo(() => safeGetValue(props.value));
  const safeValue = () => safeResult().value;
  const isExpandable = () =>
    safeValue() !== null && typeof safeValue() === "object" && !(safeValue() instanceof Promise);
  const objectKeys = createMemo(() =>
    isExpandable() && !Array.isArray(safeValue()) ? Object.keys(safeValue() as object) : [],
  );
  const getObjectValue = (key: string) => (safeValue() as Record<string, unknown>)[key];

  return (
    <Show
      when={!safeResult().error}
      fallback={<span class="text-gray-500 font-italic">{safeResult().error}</span>}
    >
      <Show when={isExpandable()} fallback={<span>{formatValuePreview(safeValue())}</span>}>
        <Show
          when={Array.isArray(safeValue())}
          fallback={
            <div class="flex items-start gap-1 relative">
              <button
                type="button"
                onClick={props.onToggle}
                class={cn("flex items-center", "p-0 mt-0.5 mr-1", "opacity-50")}
              >
                <Icon
                  name="icon-chevron-right"
                  size={12}
                  class={cn(
                    "transition-[color,transform]",
                    props.isNegative ? "text-[#f87171]" : "text-[#4ade80]",
                    props.expanded && "rotate-90",
                  )}
                />
              </button>
              <div class="flex-1">
                <Show
                  when={props.expanded}
                  fallback={<span>{formatValuePreview(safeValue())}</span>}
                >
                  <div class="pl-2 border-l border-[#333] mt-0.5 ml-1 flex flex-col gap-0.5">
                    <For each={objectKeys()}>
                      {(key) => (
                        <TreeNode
                          value={getObjectValue(key)}
                          path={key}
                          isNegative={props.isNegative}
                        />
                      )}
                    </For>
                  </div>
                </Show>
              </div>
              <CopyToClipboard
                text={formatForClipboard(safeValue())}
                class="absolute top-0.5 right-0.5 opacity-0 transition-opacity group-hover:opacity-100 self-end"
              >
                {({ ClipboardIcon }) => <>{ClipboardIcon}</>}
              </CopyToClipboard>
            </div>
          }
        >
          <div class="flex flex-col gap-1 relative">
            <ArrayHeader
              length={(safeValue() as unknown[]).length}
              expanded={props.expanded}
              onToggle={props.onToggle}
              isNegative={props.isNegative}
            />
            <Show when={props.expanded}>
              <div class="pl-2 border-l border-[#333] mt-0.5 ml-1 flex flex-col gap-0.5">
                <Index each={safeValue() as unknown[]}>
                  {(item, index) => (
                    <TreeNode
                      value={item()}
                      path={index.toString()}
                      isNegative={props.isNegative}
                    />
                  )}
                </Index>
              </div>
            </Show>
            <CopyToClipboard
              text={formatForClipboard(safeValue())}
              class="absolute top-0.5 right-0.5 opacity-0 transition-opacity group-hover:opacity-100 self-end"
            >
              {({ ClipboardIcon }) => <>{ClipboardIcon}</>}
            </CopyToClipboard>
          </div>
        </Show>
      </Show>
    </Show>
  );
};
