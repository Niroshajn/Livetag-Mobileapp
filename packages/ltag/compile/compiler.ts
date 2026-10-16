import { parse } from "node-html-parser";
import type { EpNode } from "../types";
import { LTError } from "../errors";

export function compileLTHtml(html: string): EpNode {
  console.log("COMPILE INPUT HTML:", html);
  console.log(
  "========== TEXT CENTER DEBUG: INPUT HTML =========="
);
console.log(html);
  const root = parse(html);
  const segment = root.querySelector(".segment");
  const layout = root.querySelector(".layout, .layout--full");
  if (segment) {
    return parseSegment(segment);
  }
  if (layout) {
    validateClasses(layout);
    const layoutClass = layout.getAttribute("class") || "";
    const full = layoutClass.includes("layout--full");
    const rows = layout.querySelectorAll(":scope > .grid").map(parseGrid);
    // const rows = layout.querySelectorAll(":scope > .grid").map(parseGrid);
    const overlay = layout.querySelector(":scope > .overlay");
    const overlayChildren = overlay
      ? overlay.querySelectorAll(".item").map(parseItem)
      : undefined;
    return {
      type: "canvas",
      full,
      children: rows,
      overlay: overlayChildren,
    };
  }
  throw new LTError("NO_ROOT", "Root .layout or .segment element required");
}
function parseGrid(grid: any): EpNode {
  validateClasses(grid);
  const className = grid.getAttribute("class") || "";
  const items = grid.querySelectorAll(".item").map(parseItem);
  let maxColumns: number | undefined;
  const colsMatch = className.match(/grid--cols-(\d+)/);
  if (colsMatch) {
    maxColumns = parseInt(colsMatch[1], 10);
  } else {
    maxColumns = items.length;
  }
  return {
    type: "row",
    overflow: "columns",
    maxColumns,
    children: items,
  };
}

function parseSegment(segmentEl: any): EpNode {
  validateClasses(segmentEl);
  const rowsAttr = segmentEl.getAttribute("data-rows");
  const colsAttr = segmentEl.getAttribute("data-cols");
  const rows = parseInt(rowsAttr || "", 10);
  const cols = parseInt(colsAttr || "", 10);
  if (!rows || !cols) {
    throw new LTError(
      "SEGMENT_DIMENSIONS",
      "segment requires data-rows and data-cols"
    );
  }
  const rowWeights = parseWeights(
    segmentEl.getAttribute("data-row-weights"),
    rows
  );
  const colWeights = parseWeights(
    segmentEl.getAttribute("data-col-weights"),
    cols
  );
  const views = segmentEl.querySelectorAll(":scope > .segment-view");

  if (!views.length) {
    throw new LTError(
      "SEGMENT_NO_VIEWS",
      "segment must contain segment-view children"
    );
  }

  const children = views.map((viewEl: any) => {
    validateClasses(viewEl);
    const row = parseInt(viewEl.getAttribute("data-row") || "", 10);
    const col = parseInt(viewEl.getAttribute("data-col") || "", 10);
    const rowSpan = parseInt(viewEl.getAttribute("data-row-span") || "1", 10);
    const colSpan = parseInt(viewEl.getAttribute("data-col-span") || "1", 10);

    if (isNaN(row) || isNaN(col)) {
      throw new LTError(
        "SEGMENT_CELL_POSITION",
        "segment-view requires data-row and data-col"
      );
    }
    const layout = viewEl.querySelector(
      ":scope > .layout, :scope > .layout--full"
    );

    if (!layout) {
      throw new LTError(
        "SEGMENT_VIEW_NO_LAYOUT",
        "segment-view must contain layout"
      );
    }
    validateClasses(layout);
    const layoutClass = layout.getAttribute("class") || "";
    const full = layoutClass.includes("layout--full");
    const rows = layout.querySelectorAll(".grid").map(parseGrid);
    return {
      type: "segment-view",
      cell: { row, col, rowSpan, colSpan },
      children: [
        {
          type: "canvas",
          full,
          children: rows,
        },
      ],
    };
  });
  return {
    type: "segment",
    rows,
    cols,
    rowWeights,
    colWeights,
    children,
  };
}

function parseItem(item: any): EpNode {
  validateClasses(item);
  const className = item.getAttribute("class") || "";
  const full = className.includes("item--full");
  const border = className.includes("item--border");
// ✅ fixed
const hAlign = className.includes("item--hcenter") ? "center" : undefined;
const vAlign = className.includes("item--vcenter") ? "center" : undefined;
  const children: EpNode[] = [];
  item.querySelectorAll("span").forEach((span: any) => {
    const cls = span.getAttribute("class") || "";
    const text = span.textContent.trim();
   if (cls.includes("text")) {
  let size: "small" | "medium" | "large" | undefined;
  let hAlign: "center" | undefined;
  let vAlign: "center" | undefined;

  if (cls.includes("text--small")) size = "small";
  if (cls.includes("text--medium")) size = "medium";
  if (cls.includes("text--large")) size = "large";

  if (cls.includes("text--hcenter")) hAlign = "center";
  if (cls.includes("text--vcenter")) vAlign = "center";

  children.push({
    type: "text",
    text,
    size,
    hAlign,
    vAlign,
  });
}
    if (cls.includes("stat-value")) {
      let size: "small" | "medium" | "large" | undefined;
      let align: "center" | undefined;
      if (cls.includes("stat-value--small")) size = "small";
      if (cls.includes("stat-value--medium")) size = "medium";
      if (cls.includes("stat-value--large")) size = "large";
      if (cls.includes("stat-value--center")) align = "center";
      children.push({
        type: "stat",
        value: span.textContent.trim(),
        size,
        // align,
      });
    }
    if (cls.includes("label")) {
      children.push({
        type: "text",
        text: span.textContent.trim(),
      });
    }
  });
item.querySelectorAll(".ep-image-wrap").forEach((wrap: any) => { const img = wrap.querySelector("img"); if (!img) return; const src = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-lazy-src"); if (!src) { console.warn("[COMPILE IMAGE] Image has no src", wrap.toString()); return; } const widthAttr = img.getAttribute("width"); const heightAttr = img.getAttribute("height"); const overlay = wrap.querySelector(".ep-image-overlay"); const overlayIcon = overlay?.querySelector("img"); const imageNode: EpNode = { type: "image", src: src.trim(), width: widthAttr ? Number(widthAttr) : undefined, height: heightAttr ? Number(heightAttr) : undefined, overlayText: overlay?.querySelector("span")?.textContent.trim() || undefined, overlayImage: overlayIcon?.getAttribute("src") || undefined, }; console.log("[COMPILE IMAGE] Parsed image node", imageNode); children.push(imageNode); });


  item.querySelectorAll("iframe").forEach((frame: any) => {
    const src = frame.getAttribute("src");
    if (!src) {
      throw new LTError("IFRAME_NO_SRC", "Iframe requires src attribute");
    }
    const widthAttr = frame.getAttribute("width");
    const heightAttr = frame.getAttribute("height");
    children.push({
      type: "iframe",
      src,
      width: widthAttr ? parseInt(widthAttr, 10) : undefined,
      height: heightAttr ? parseInt(heightAttr, 10) : undefined,
    });
  });
return {
  type: "block",
  full,
  border,
  hAlign,
  vAlign,
  children,
};
}

import {
  ALLOWED_CLASS_LITERALS,
  ALLOWED_CLASS_PATTERNS,
} from "./classRegistry";
function isAllowedClass(cls: string): boolean {
  if (ALLOWED_CLASS_LITERALS.has(cls)) return true;
  return ALLOWED_CLASS_PATTERNS.some((re) => re.test(cls));
}
function validateClasses(node: any) {
  const classAttr = node.getAttribute("class") || "";
  classAttr.split(/\s+/).forEach((cls: string) => {
    if (cls && !isAllowedClass(cls)) {
      throw new LTError("INVALID_CLASS", `Class not allowed: ${cls}`);
    }
  });
}

function parseWeights(
  attr: string | null,
  expected: number
): number[] | undefined {
  if (!attr) return undefined;
  const weights = attr.split(",").map((v) => parseInt(v.trim(), 10));
  if (weights.length !== expected) {
    throw new LTError(
      "SEGMENT_WEIGHT_MISMATCH",
      "Weight count must match rows/cols"
    );
  }
  return weights;
}
