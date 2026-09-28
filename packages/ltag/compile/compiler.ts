// packages/ltag/compile/compiler.ts

import {
  parse,
  type HTMLElement,
} from "node-html-parser";

import type {
  EpNode,
  EpSegmentViewNode,
} from "../types";

import { LTError } from "../errors";

import {
  ALLOWED_CLASS_LITERALS,
  ALLOWED_CLASS_PATTERNS,
} from "./classRegistry";


// ======================================================
// CLASS VALIDATION
// ======================================================

function isAllowedClass(cls: string): boolean {
  if (ALLOWED_CLASS_LITERALS.has(cls)) {
    return true;
  }

  return ALLOWED_CLASS_PATTERNS.some((regex) =>
    regex.test(cls)
  );
}

function validateClasses(node: HTMLElement): void {
  const classAttr =
    node.getAttribute("class") ?? "";

  classAttr
    .split(/\s+/)
    .filter(Boolean)
    .forEach((cls) => {
      if (!isAllowedClass(cls)) {
        throw new LTError(
          "INVALID_CLASS",
          `Class not allowed: ${cls}`
        );
      }
    });
}


// ======================================================
// MAIN COMPILER
// ======================================================

export function compileLTHtml(
  html: string
): EpNode {
  console.log(
    "COMPILE INPUT HTML:",
    html
  );

  if (!html || !html.trim()) {
    throw new LTError(
      "EMPTY_HTML",
      "HTML content cannot be empty"
    );
  }

  const root = parse(html);

  // ====================================================
  // SEGMENT
  // ====================================================

  const segment =
    root.querySelector(".segment");

  if (segment) {
    return parseSegment(segment);
  }

  // ====================================================
  // LAYOUT
  // ====================================================

  const layout =
    root.querySelector(
      ".layout, .layout--full"
    );

  if (layout) {
    validateClasses(layout);

    const layoutClass =
      layout.getAttribute("class") ?? "";

    const full =
      layoutClass.includes("layout--full");

    const rows =
      layout
        .querySelectorAll(
          ":scope > .grid"
        )
        .map(parseGrid);

    // Overlay
    const overlay =
      layout.querySelector(
        ":scope > .overlay"
      );

    const overlayChildren =
      overlay
        ? overlay
            .querySelectorAll(".item")
            .map(parseItem)
        : undefined;

    return {
      type: "canvas",
      full,
      children: rows,
      overlay: overlayChildren,
    };
  }

  throw new LTError(
    "NO_ROOT",
    "Root .layout or .segment element required"
  );
}


// ======================================================
// GRID
// ======================================================

function parseGrid(
  grid: HTMLElement
): EpNode {
  validateClasses(grid);

  const className =
    grid.getAttribute("class") ?? "";

  const items =
    grid
      .querySelectorAll(
        ":scope > .item"
      )
      .map(parseItem);

  let maxColumns:
    | number
    | undefined;

  const colsMatch =
    className.match(
      /grid--cols-(\d+)/
    );

  if (colsMatch) {
    maxColumns =
      parseInt(
        colsMatch[1],
        10
      );
  } else {
    maxColumns =
      items.length;
  }

  return {
    type: "row",
    overflow: "columns",
    maxColumns,
    children: items,
  };
}


// ======================================================
// SEGMENT
// ======================================================

function parseSegment(
  segmentEl: HTMLElement
): EpNode {
  validateClasses(segmentEl);

  const rowsAttr =
    segmentEl.getAttribute(
      "data-rows"
    );

  const colsAttr =
    segmentEl.getAttribute(
      "data-cols"
    );

  const rows =
    parseInt(
      rowsAttr ?? "",
      10
    );

  const cols =
    parseInt(
      colsAttr ?? "",
      10
    );

  if (!rows || !cols) {
    throw new LTError(
      "SEGMENT_DIMENSIONS",
      "segment requires data-rows and data-cols"
    );
  }

  const rowWeights =
    parseWeights(
      segmentEl.getAttribute(
        "data-row-weights"
      ),
      rows
    );

  const colWeights =
    parseWeights(
      segmentEl.getAttribute(
        "data-col-weights"
      ),
      cols
    );

  const views =
    segmentEl.querySelectorAll(
      ":scope > .segment-view"
    );

  if (!views.length) {
    throw new LTError(
      "SEGMENT_NO_VIEWS",
      "segment must contain segment-view children"
    );
  }

  // ====================================================
  // IMPORTANT FIX
  //
  // EpSegmentNode.children requires
  // EpSegmentViewNode[]
  // ====================================================

  const children: EpSegmentViewNode[] =
    views.map(
      (viewEl): EpSegmentViewNode => {
        validateClasses(viewEl);

        const row =
          parseInt(
            viewEl.getAttribute(
              "data-row"
            ) ?? "",
            10
          );

        const col =
          parseInt(
            viewEl.getAttribute(
              "data-col"
            ) ?? "",
            10
          );

        const rowSpan =
          parseInt(
            viewEl.getAttribute(
              "data-row-span"
            ) ?? "1",
            10
          );

        const colSpan =
          parseInt(
            viewEl.getAttribute(
              "data-col-span"
            ) ?? "1",
            10
          );

        if (
          isNaN(row) ||
          isNaN(col)
        ) {
          throw new LTError(
            "SEGMENT_CELL_POSITION",
            "segment-view requires data-row and data-col"
          );
        }

        // ----------------------------------------------
        // Layout inside segment-view
        // ----------------------------------------------

        const layout =
          viewEl.querySelector(
            ":scope > .layout, :scope > .layout--full"
          );

        if (!layout) {
          throw new LTError(
            "SEGMENT_VIEW_NO_LAYOUT",
            "segment-view must contain layout"
          );
        }

        validateClasses(layout);

        const layoutClass =
          layout.getAttribute(
            "class"
          ) ?? "";

        const full =
          layoutClass.includes(
            "layout--full"
          );

        const rows =
          layout
            .querySelectorAll(
              ":scope > .grid"
            )
            .map(parseGrid);

        // ----------------------------------------------
        // RETURN EXACT EpSegmentViewNode
        // ----------------------------------------------

        return {
          type: "segment-view",

          cell: {
            row,
            col,
            rowSpan,
            colSpan,
          },

          children: [
            {
              type: "canvas",
              full,
              children: rows,
            },
          ],
        };
      }
    );

  return {
    type: "segment",

    rows,
    cols,

    rowWeights,
    colWeights,

    children,
  };
}


// ======================================================
// ITEM
// ======================================================

function parseItem(
  item: HTMLElement
): EpNode {
  validateClasses(item);

  const className =
    item.getAttribute("class") ?? "";

  const full =
    className.includes(
      "item--full"
    );

  const border =
    className.includes(
      "item--border"
    );

  const hAlign =
    className.includes(
      "item--hcenter"
    )
      ? "center"
      : undefined;

  const vAlign =
    className.includes(
      "item--vcenter"
    )
      ? "center"
      : undefined;

  const children: EpNode[] = [];

  // ====================================================
  // SPAN ELEMENTS
  // ====================================================

  item
    .querySelectorAll("span")
    .forEach((span) => {
      const cls =
        span.getAttribute(
          "class"
        ) ?? "";

      const text =
        span.textContent.trim();

      // ==================================================
      // TEXT
      // ==================================================

      if (cls.includes("text")) {
        let size:
          | "small"
          | "medium"
          | "large"
          | undefined;

        let textHAlign:
          | "center"
          | undefined;

        let textVAlign:
          | "center"
          | undefined;

        if (
          cls.includes(
            "text--small"
          )
        ) {
          size = "small";
        }

        if (
          cls.includes(
            "text--medium"
          )
        ) {
          size = "medium";
        }

        if (
          cls.includes(
            "text--large"
          )
        ) {
          size = "large";
        }

        // Correct class names
        if (
          cls.includes(
            "text--h-center"
          )
        ) {
          textHAlign = "center";
        }

        if (
          cls.includes(
            "text--v-center"
          )
        ) {
          textVAlign = "center";
        }

        if (
          cls.includes(
            "text--center"
          )
        ) {
          textHAlign = "center";
        }

        children.push({
          type: "text",
          text,
          size,
          hAlign: textHAlign,
          vAlign: textVAlign,
        });
      }


      // ==================================================
      // STAT
      // ==================================================

      if (
        cls.includes(
          "stat-value"
        )
      ) {
        let size:
          | "small"
          | "medium"
          | "large"
          | undefined;

        let align:
          | "center"
          | undefined;

        if (
          cls.includes(
            "stat-value--small"
          )
        ) {
          size = "small";
        }

        if (
          cls.includes(
            "stat-value--medium"
          )
        ) {
          size = "medium";
        }

        if (
          cls.includes(
            "stat-value--large"
          )
        ) {
          size = "large";
        }

        if (
          cls.includes(
            "stat-value--center"
          )
        ) {
          align = "center";
        }

        children.push({
          type: "stat",
          value: text,
          size,

          // ============================================
          // IMPORTANT:
          // EpStatNode expects hAlign,
          // NOT align.
          // ============================================

          hAlign: align,
        });
      }


      // ==================================================
      // LABEL
      // ==================================================

      if (
        cls.includes("label")
      ) {
        children.push({
          type: "text",
          text,
        });
      }
    });


  // ====================================================
  // IMAGE
  // ====================================================

  item
    .querySelectorAll(
      ".ep-image-wrap"
    )
    .forEach((wrap) => {
      const img =
        wrap.querySelector("img");

      if (!img) {
        return;
      }

      const src =
        img.getAttribute("src");

      if (!src) {
        throw new LTError(
          "IMAGE_NO_SRC",
          "Image node requires src attribute"
        );
      }

      const widthAttr =
        img.getAttribute(
          "width"
        );

      const heightAttr =
        img.getAttribute(
          "height"
        );

      const overlay =
        wrap.querySelector(
          ".ep-image-overlay"
        );

      const overlayIcon =
        overlay?.querySelector(
          "img"
        );

      children.push({
        type: "image",

        src,

        width: widthAttr
          ? parseInt(
              widthAttr,
              10
            )
          : undefined,

        height: heightAttr
          ? parseInt(
              heightAttr,
              10
            )
          : undefined,

        overlayText:
          overlay
            ? overlay.textContent.trim()
            : undefined,

        overlayImage:
          overlayIcon?.getAttribute(
            "src"
          ) ?? undefined,
      });
    });


  // ====================================================
  // IFRAME
  // ====================================================

  item
    .querySelectorAll(
      "iframe"
    )
    .forEach((frame) => {
      const src =
        frame.getAttribute(
          "src"
        );

      if (!src) {
        throw new LTError(
          "IFRAME_NO_SRC",
          "Iframe requires src attribute"
        );
      }

      const widthAttr =
        frame.getAttribute(
          "width"
        );

      const heightAttr =
        frame.getAttribute(
          "height"
        );

      children.push({
        type: "iframe",

        src,

        width: widthAttr
          ? parseInt(
              widthAttr,
              10
            )
          : undefined,

        height: heightAttr
          ? parseInt(
              heightAttr,
              10
            )
          : undefined,
      });
    });


  // ====================================================
  // RETURN BLOCK
  // ====================================================

  return {
    type: "block",

    width: 1,

    full,

    border,

    hAlign,

    vAlign,

    children,
  };
}


// ======================================================
// WEIGHTS
// ======================================================

function parseWeights(
  attr: string | undefined,
  expected: number
): number[] | undefined {
  if (!attr) {
    return undefined;
  }

  const weights =
    attr
      .split(",")
      .map((value) =>
        parseInt(
          value.trim(),
          10
        )
      );

  if (
    weights.length !== expected ||
    weights.some(
      (weight) => isNaN(weight)
    )
  ) {
    throw new LTError(
      "SEGMENT_WEIGHT_MISMATCH",
      "Weight count must match rows/cols and all weights must be valid numbers"
    );
  }

  return weights;
}