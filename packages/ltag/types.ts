export interface EpSegmentCell {
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
}

export interface EpSegmentViewNode {
  type: "segment-view";
  cell: EpSegmentCell;

  children: EpNode[];

  regionBox?: {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  };
}

export interface EpSegmentNode {
  type: "segment";
  rows: number;
  cols: number;

  rowWeights?: number[];
  colWeights?: number[];

  full?: boolean;

  // IMPORTANT
  children: EpSegmentViewNode[];
}

export interface EpCanvasNode {
  type: "canvas";
  full?: boolean;
  children: EpNode[];
  overlay?: EpNode[];
}

export interface EpRowNode {
  type: "row";
  overflow?: "columns";
  maxColumns?: number;
  maxRows?: number;
  children: EpNode[];
}

export interface EpColumnsNode {
  type: "columns";
  columns: EpNode[][];
}

export interface EpColumnNode {
  type: "column";
  children: EpNode[];
}

export interface EpBlockNode {
  type: "block";

  width?: number;
  full?: boolean;
  border?: boolean;
  padding?: number;

  hAlign?: "center";
  vAlign?: "center";

  children: EpNode[];
}

export type EpTextSize = "small" | "medium" | "large";

export interface EpTextNode {
  type: "text";

  text: string;

  size?: EpTextSize;
  align?: "center";
  hAlign?: "center";
  vAlign?: "center";
}

export interface EpStatNode {
  type: "stat";

  value: string;
  label?: string;

  size?: EpTextSize;

  hAlign?: "center";
  vAlign?: "center";
}

export interface EpImageNode {
  type: "image";

  src: string;

  fit?: "contain" | "cover";

  align?: "left" | "center" | "right";

  width?: number;
  height?: number;

  overlayText?: string;
  overlayImage?: string;
}

export interface EpIframeNode {
  type: "iframe";

  src: string;

  width?: number;
  height?: number;
}

export type EpNode =
  | EpCanvasNode
  | EpSegmentNode
  | EpSegmentViewNode
  | EpRowNode
  | EpColumnsNode
  | EpColumnNode
  | EpBlockNode
  | EpTextNode
  | EpStatNode
  | EpIframeNode
  | EpImageNode;