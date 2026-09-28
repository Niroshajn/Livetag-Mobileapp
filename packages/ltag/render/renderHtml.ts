import type { EpNode } from "../types";

export function renderEpAstToHtml(node: EpNode): string {
  switch (node.type) {
    // =========================================================
    // SEGMENT
    // =========================================================

    case "segment":
      return `
        <div class="ep-segment">
          ${node.children.map(renderEpAstToHtml).join("\n")}
        </div>
      `;

    // =========================================================
    // SEGMENT VIEW
    // =========================================================

    case "segment-view": {
      const width = node.regionBox?.width ?? "100%";
      const height = node.regionBox?.height ?? "100%";

      return `
        <div
          class="ep-segment-view"
          style="
            width:${toCssSize(width)};
            height:${toCssSize(height)};
            position:relative;
            overflow:hidden;
            border:none !important;
          "
        >
          ${node.children.map(renderEpAstToHtml).join("\n")}
        </div>
      `;
    }

    // =========================================================
    // CANVAS
    // =========================================================

    case "canvas": {
      const className = node.full
        ? "ep-canvas ep-canvas--full"
        : "ep-canvas";

      const overlayHtml =
        node.overlay && node.overlay.length > 0
          ? `
            <div class="ep-canvas-overlay">
              ${node.overlay
                .map(renderEpAstToHtml)
                .join("\n")}
            </div>
          `
          : "";

      return `
        <div
          class="${className}"
          style="
            position:relative;
            overflow:hidden;
          "
        >
          ${node.children
            .map(renderEpAstToHtml)
            .join("\n")}

          ${overlayHtml}
        </div>
      `;
    }

    // =========================================================
    // ROW
    // =========================================================

    case "row": {
      const maxColumns =
        node.maxColumns ?? node.children.length;

      return `
        <div
          class="ep-row"
          style="
            display:grid;
            grid-template-columns:repeat(
              ${maxColumns},
              minmax(0, 1fr)
            );
            width:100%;
            height:100%;
            overflow:hidden;
          "
        >
          ${node.children
            .map(
              (child) => `
                <div
                  class="ep-row-item"
                  style="
                    min-width:0;
                    min-height:0;
                    overflow:hidden;
                  "
                >
                  ${renderEpAstToHtml(child)}
                </div>
              `
            )
            .join("\n")}
        </div>
      `;
    }

    // =========================================================
    // COLUMNS
    // =========================================================

    case "columns":
      return `
        <div
          class="ep-columns"
          style="
            display:grid;
            grid-auto-flow:column;
            grid-auto-columns:minmax(0, 1fr);
            gap:12px;
            width:100%;
            height:100%;
            min-height:0;
            overflow:hidden;
          "
        >
          ${node.columns
            .map(
              (column) => `
                <div
                  class="ep-column"
                  style="
                    display:flex;
                    flex-direction:column;
                    gap:8px;
                    min-width:0;
                    min-height:0;
                    overflow:hidden;
                  "
                >
                  ${column
                    .map(renderEpAstToHtml)
                    .join("\n")}
                </div>
              `
            )
            .join("\n")}
        </div>
      `;

    // =========================================================
    // COLUMN
    // =========================================================

    case "column":
      return `
        <div
          class="ep-column"
          style="
            display:flex;
            flex-direction:column;
            gap:8px;
            min-width:0;
            min-height:0;
            overflow:hidden;
          "
        >
          ${node.children
            .map(renderEpAstToHtml)
            .join("\n")}
        </div>
      `;

    // =========================================================
    // BLOCK
    // =========================================================

    case "block": {
      const classNames = ["ep-block"];

      if (node.full) {
        classNames.push("ep-block--full");
      }

      if (node.border) {
        classNames.push("ep-block--border");
      }

      if (node.hAlign === "center") {
        classNames.push("ep-block--hcenter");
      }

      if (node.vAlign === "center") {
        classNames.push("ep-block--vcenter");
      }

      return `
        <div class="${classNames.join(" ")}">
          ${node.children
            .map(renderEpAstToHtml)
            .join("\n")}
        </div>
      `;
    }

    // =========================================================
    // TEXT
    // =========================================================

    case "text": {
      const classes = ["text"];

      if (node.size) {
        classes.push(`text--${node.size}`);
      }

      if (node.hAlign === "center") {
        classes.push("text--h-center");
      }

      if (node.vAlign === "center") {
        classes.push("text--v-center");
      }

      return `
        <p class="${classes.join(" ")}">
          ${escapeHtml(node.text)}
        </p>
      `;
    }

    // =========================================================
    // STAT
    // =========================================================

    case "stat": {
      const classes = ["stat-value"];

      if (node.size) {
        classes.push(`stat-value--${node.size}`);
      }

      if (node.hAlign === "center") {
        classes.push("stat-value--center");
      }

      return `
        <div class="stat">
          <span class="${classes.join(" ")}">
            ${escapeHtml(node.value)}
          </span>

          ${
            node.label
              ? `
                <span class="ep-stat-label">
                  ${escapeHtml(node.label)}
                </span>
              `
              : ""
          }
        </div>
      `;
    }

    // =========================================================
    // IMAGE
    // =========================================================

    case "image": {
      const imageStyle: string[] = [];

      if (node.width !== undefined) {
        imageStyle.push(
          `width:${toCssSize(node.width)}`
        );
      }

      if (node.height !== undefined) {
        imageStyle.push(
          `height:${toCssSize(node.height)}`
        );
      }

      if (node.fit) {
        imageStyle.push(
          `object-fit:${node.fit}`
        );
      }

      if (node.align === "center") {
        imageStyle.push("margin:0 auto");
      }

      if (node.align === "right") {
        imageStyle.push("margin-left:auto");
      }

      return `
        <div class="ep-image-wrap">

          <img
            class="ep-image"
            src="${escapeAttribute(node.src)}"
            style="${imageStyle.join(";")}"
          />

          ${
            node.overlayText || node.overlayImage
              ? `
                <div class="ep-image-overlay">

                  ${
                    node.overlayImage
                      ? `
                        <img
                          class="ep-overlay-icon"
                          src="${escapeAttribute(
                            node.overlayImage
                          )}"
                        />
                      `
                      : ""
                  }

                  ${
                    node.overlayText
                      ? `
                        <span>
                          ${escapeHtml(
                            node.overlayText
                          )}
                        </span>
                      `
                      : ""
                  }

                </div>
              `
              : ""
          }

        </div>
      `;
    }

    // =========================================================
    // IFRAME
    // =========================================================

    case "iframe":
      return `
        <div
          class="ep-iframe-wrap"
          style="
            width:100%;
            height:100%;
            overflow:hidden;
          "
        >
          <iframe
            src="${escapeAttribute(node.src)}"
            width="${node.width ?? "100%"}"
            height="${node.height ?? "100%"}"
            frameborder="0"
            scrolling="no"
            style="
              width:100%;
              height:100%;
              border:none;
              overflow:hidden;
            "
          ></iframe>
        </div>
      `;

    // =========================================================
    // UNKNOWN
    // =========================================================

    default:
      return assertNever(node);
  }
}

// =============================================================
// CSS SIZE
// =============================================================

function toCssSize(
  value: number | string
): string {
  return typeof value === "number"
    ? `${value}px`
    : value;
}

// =============================================================
// HTML ESCAPING
// =============================================================

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

// =============================================================
// EXHAUSTIVE CHECK
// =============================================================

function assertNever(value: never): never {
  throw new Error(
    `Unknown EpNode type: ${
      (value as { type?: string })?.type
    }`
  );
}