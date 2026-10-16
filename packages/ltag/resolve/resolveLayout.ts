import type {
  EpNode,
  EpCanvasNode,
  EpRowNode,
  EpSegmentNode,
  EpSegmentViewNode,                                                                                                                                                                                                              
} from "../types";

import type { DeviceProfile } from "../device";
import { resolveRowOverflow } from "./resolveRowOverflow";
import { resolveSegment } from "./resolveSegment";

export function resolveLayout(node: EpNode, profile: DeviceProfile): EpNode {
  // console.log("device profile------", profile);

  switch (node.type) {
    case "segment": {
      return resolveSegment(node, profile);
    }

    case "canvas":
      return {
        ...node,
        children: node.children.map((child) => resolveLayout(child, profile)),
      };

    case "segment-view":
      return {
        ...node,
        children: node.children.map((child) => resolveLayout(child, profile)),
      };

    case "row": {
      const resolved = resolveRowOverflow(
        node,
        profile,
        profile.canvasHeight * profile.maxRowHeightRatio
      );

      if (resolved.type === "columns") {
        return {
          type: "columns",
          columns: resolved.columns.map((col) =>
            col.map((child) => resolveLayout(child, profile))
          ),
        };
      }

      if (resolved.type === "row") {
        return {
          type: "row",
          children: resolved.children.map((child: EpNode) =>
            resolveLayout(child, profile)
          ),
        };
      }
      return resolved;
    }

    case "columns":
      return {
        type: "columns",
        columns: node.columns.map((col) =>
          col.map((child) => resolveLayout(child, profile))
        ),
      };

    case "column":
      return {
        type: "column",
        children: node.children.map((child) => resolveLayout(child, profile)),
      };

    case "block":
      return {
        ...node,
        children: node.children.map((child) => resolveLayout(child, profile)),
      };

    case "text":
    case "stat":
    case "image":
    case "iframe":
      return node;
  }
  return node;
}
export function resolveLayoutWithoutOverflow(
  node: EpNode,
  profile: DeviceProfile
): EpNode {
  switch (node.type) {
    case "canvas":
      return {
        ...node,
        children: node.children.map((child) =>
          resolveLayoutWithoutOverflow(child, profile)
        ),
      };

    case "row":
      return {
        type: "row",
        children: node.children.map((child) =>
          resolveLayoutWithoutOverflow(child, profile)
        ),
      };

    case "columns":
      return {
        type: "columns",
        columns: node.columns.map((col) =>
          col.map((child) => resolveLayoutWithoutOverflow(child, profile))
        ),
      };

    case "column":
      return {
        type: "column",
        children: node.children.map((child) =>
          resolveLayoutWithoutOverflow(child, profile)
        ),
      };

    case "block":
      return {
        ...node,
        children: node.children.map((child) =>
          resolveLayoutWithoutOverflow(child, profile)
        ),
      };

    default:
      return node;
  }
}
