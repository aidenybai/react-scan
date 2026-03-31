export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";

export type CollapsedPosition = {
  corner: Corner;
  orientation: "horizontal" | "vertical";
};

export interface ToolbarPosition {
  /**
   * The corner/position to place the toolbar.
   * @default "bottom-right"
   */
  corner?: Corner;
  /**
   * Horizontal offset in pixels from the computed corner position.
   * Positive values move the toolbar to the right, negative to the left.
   * @default 0
   */
  x?: number;
  /**
   * Vertical offset in pixels from the computed corner position.
   * Positive values move the toolbar down, negative moves it up.
   * @default 0
   */
  y?: number;
}

export interface ResizeHandleProps {
  position: Corner | "top" | "bottom" | "left" | "right";
}

export interface WidgetDimensions {
  isFullWidth: boolean;
  isFullHeight: boolean;
  width: number;
  height: number;
  position: Position;
}

export interface ComponentsTreeConfig {
  width: number;
}

export interface WidgetConfig {
  corner: Corner;
  dimensions: WidgetDimensions;
  lastDimensions: WidgetDimensions;
  componentsTree: ComponentsTreeConfig;
}

export interface WidgetSettings {
  corner: Corner;
  dimensions: WidgetDimensions;
  lastDimensions: WidgetDimensions;
  componentsTree: ComponentsTreeConfig;
}
