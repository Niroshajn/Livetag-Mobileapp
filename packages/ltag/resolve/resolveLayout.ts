import type { EpNode } from "../types";
import type { DeviceProfile } from "../device";

import { resolveRowOverflow } from "./resolveRowOverflow";
import { resolveSegment } from "./resolveSegment";

/**
 * Detect an explicitly defined columns node inside a row.
 *
 * Explicit grids must not be converted again by the
 * automatic row overflow resolver.
 */
function hasExplicitColumns(
  node: EpNode
): boolean {
  return (
    node.type === "row" &&
    node.children.some(
      (child) => child.type === "columns"
    )
  );
}

/**
 * Resolve the complete EP layout.
 */
export function resolveLayout(
  node: EpNode,
  profile: DeviceProfile
): EpNode {
  switch (node.type) {
    case "segment": {
      return resolveSegment(node, profile);
    }

    case "canvas": {
      return {
        ...node,

        children: node.children.map((child) =>
          resolveLayout(child, profile)
        ),

        overlay: node.overlay?.map((child) =>
          resolveLayout(child, profile)
        ),
      };
    }

    case "segment-view": {
      return {
        ...node,

        children: node.children.map((child) =>
          resolveLayout(child, profile)
        ),
      };
    }

    case "row": {
      // Keep explicitly defined grids unchanged.
      if (hasExplicitColumns(node)) {
        return {
          ...node,

          children: node.children.map((child) =>
            resolveLayout(child, profile)
          ),
        };
      }

      const maxHeight =
        profile.canvasHeight *
        profile.maxRowHeightRatio;

      const resolved = resolveRowOverflow(
        node,
        profile,
        maxHeight
      );

      if (resolved.type === "columns") {
        return {
          ...resolved,

          columns: resolved.columns.map(
            (column) =>
              column.map((child) =>
                resolveLayout(child, profile)
              )
          ),
        };
      }

      if (resolved.type === "row") {
        return {
          ...resolved,

          children: resolved.children.map(
            (child) =>
              resolveLayout(child, profile)
          ),
        };
      }

      return resolved;
    }

    case "columns": {
      return {
        ...node,

        columns: node.columns.map(
          (column) =>
            column.map((child) =>
              resolveLayout(child, profile)
            )
        ),
      };
    }

    case "column": {
      return {
        ...node,

        children: node.children.map((child) =>
          resolveLayout(child, profile)
        ),
      };
    }

    case "block": {
      return {
        ...node,

        children: node.children.map((child) =>
          resolveLayout(child, profile)
        ),
      };
    }

    case "text":
    case "stat":
    case "image":
    case "iframe": {
      return node;
    }

    default: {
      return node;
    }
  }
}

/**
 * Resolve the layout without applying automatic row
 * overflow. Useful inside segment regions where the
 * original row and grid structure must be preserved.
 */
export function resolveLayoutWithoutOverflow(
  node: EpNode,
  profile: DeviceProfile
): EpNode {
  switch (node.type) {
    case "segment": {
      return resolveSegment(node, profile);
    }

    case "canvas": {
      return {
        ...node,

        children: node.children.map((child) =>
          resolveLayoutWithoutOverflow(
            child,
            profile
          )
        ),

        overlay: node.overlay?.map((child) =>
          resolveLayoutWithoutOverflow(
            child,
            profile
          )
        ),
      };
    }

    case "segment-view": {
      return {
        ...node,

        children: node.children.map((child) =>
          resolveLayoutWithoutOverflow(
            child,
            profile
          )
        ),
      };
    }

    case "row": {
      return {
        ...node,

        children: node.children.map((child) =>
          resolveLayoutWithoutOverflow(
            child,
            profile
          )
        ),
      };
    }

    case "columns": {
      return {
        ...node,

        columns: node.columns.map(
          (column) =>
            column.map((child) =>
              resolveLayoutWithoutOverflow(
                child,
                profile
              )
            )
        ),
      };
    }

    case "column": {
      return {
        ...node,

        children: node.children.map((child) =>
          resolveLayoutWithoutOverflow(
            child,
            profile
          )
        ),
      };
    }

    case "block": {
      return {
        ...node,

        children: node.children.map((child) =>
          resolveLayoutWithoutOverflow(
            child,
            profile
          )
        ),
      };
    }

    case "text":
    case "stat":
    case "image":
    case "iframe": {
      return node;
    }

    default: {
      return node;
    }
  }
}