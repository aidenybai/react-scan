export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface ResizeHandleProps {
  position: Corner | 'top' | 'bottom' | 'left' | 'right';
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
