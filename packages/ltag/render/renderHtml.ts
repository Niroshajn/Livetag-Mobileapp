import type { EpNode } from "../types";

export function renderEpAstToHtml(node: EpNode): string {
  switch (node.type) {
    case "segment":
      return `<div class="ep-segment">
${node.children.map(renderEpAstToHtml).join("\n")}
</div>`;
    case "segment-view": {
      const width = (node as any).regionBox?.width ?? "100%";
      const height = (node as any).regionBox?.height ?? "100%";
      return `<div class="ep-segment-view"
    style="
      width:${typeof width === "number" ? width + "px" : width};
      height:${typeof height === "number" ? height + "px" : height};
      position:relative;
      border: none !important;
    ">
${node.children.map(renderEpAstToHtml).join("\n")}
</div>`;
    }
    case "canvas": {
      const className = node.full ? "ep-canvas ep-canvas--full" : "ep-canvas";
      const overlayHtml = (node as any).overlay
        ? `<div class="ep-canvas-overlay">
        ${(node as any).overlay.map(renderEpAstToHtml).join("\n")}
      </div>`
        : "";
      return `<div class="${className}" style="position:relative;">
    ${node.children.map(renderEpAstToHtml).join("\n")}
    ${overlayHtml}
  </div>`;
    }
    case "row":
      return `<div class="ep-row">
${node.children.map(renderEpAstToHtml).join("\n")}
</div>`;
    case "columns":
      return `<div class="ep-columns">
${node.columns
          .map(
            (col) => `<div class="ep-column">
${col.map(renderEpAstToHtml).join("\n")}
</div>`
          )
          .join("\n")}
</div>`;
    case "block": {
      // console.log("BLOCK NODE:", node);
      const classNames = ["ep-block"];
      if (node.full) classNames.push("ep-block--full");
      if (node.border) classNames.push("ep-block--border");
      if ((node as any).hAlign === "center") classNames.push("ep-block--hcenter");
      if ((node as any).vAlign === "center") classNames.push("ep-block--vcenter");
      return `<div class="${classNames.join(" ")}">
${node.children.map(renderEpAstToHtml).join("\n")}
</div>`;
    }
    case "text": {
      const sizeClass = node.size ? ` text--${node.size}` : "";
      const hAlignClass = node.hAlign === "center" ? " text--h-center" : "";
      const vAlignClass = node.vAlign === "center" ? " text--v-center" : "";

      return `<p class="text${sizeClass}${hAlignClass}${vAlignClass}">
    ${escapeHtml(node.text)}
  </p>`;
    }
    case "stat": {
      const sizeClass = node.size ? ` stat-value--${node.size}` : "";
      return `<div class="stat">
      <span class="stat-value${sizeClass}">
        ${escapeHtml(node.value)}
      </span>
      ${node.label
          ? `<span class="ep-stat-label">${escapeHtml(node.label)}</span>`
          : ""
        }
    </div>`;
    }
   case "iframe": {
  return `
    <div class="ep-iframe-wrap">
      <iframe
        src="${node.src}"
        width="${node.width || "100%"}"
        height="${node.height || "100%"}"
        frameborder="0"
        scrolling="no"
        style="overflow:hidden;"
      ></iframe>
    </div>
  `;
}
    case "image": {
      const style: string[] = [];

      if (node.width) style.push(`width:${node.width}px`);
      if (node.height) style.push(`height:${node.height}px`);
      if (node.fit) style.push(`object-fit:${node.fit}`);
      if (node.align === "center") style.push(`margin:0 auto`);
      if (node.align === "right") style.push(`margin-left:auto`);

      return `
  <div class="ep-image-wrap">
    <img 
      class="ep-image"
      src="${escapeHtml(node.src)}"
      style="${style.join(";")}"
    />

    ${node.overlayText || node.overlayImage
          ? `<div class="ep-image-overlay">
            ${node.overlayImage
            ? `<img class="ep-overlay-icon" src="${escapeHtml(
              node.overlayImage
            )}" />`
            : ""
          }
            ${node.overlayText
            ? `<span>${escapeHtml(node.overlayText)}</span>`
            : ""
          }
          </div>`
          : ""
        }
  </div>`;
    }
    default:
      throw new Error(`Unknown EpNode type: ${(node as any).type}`);
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
