import type {
  EpNode,
  EpSegmentNode,
  EpSegmentViewNode,
} from "../types";

import type {
  DeviceProfile,
  RegionDeviceProfile,
} from "../device";

import {
  resolveLayoutWithoutOverflow,
} from "./resolveLayout";

export function resolveSegment(
  node: EpSegmentNode,
  profile: DeviceProfile
): EpSegmentNode {
  const {
    rows,
    cols,
    rowWeights,
    colWeights,
  } = node;

  // Calculate the height of each grid row.
  const rowHeights = computeSplits(
    profile.canvasHeight,
    rows,
    rowWeights
  );

  // Calculate the width of each grid column.
  const colWidths = computeSplits(
    profile.canvasWidth,
    cols,
    colWeights
  );

  const resolvedChildren: EpSegmentViewNode[] =
    node.children.map((view) => {
      const regionProfile = createRegionProfile(
        profile,
        view,
        colWidths,
        rowHeights
      );

      const children: EpNode[] =
        view.children.map((child) =>
          resolveLayoutWithoutOverflow(
            child,
            regionProfile
          )
        );

      return {
        ...view,
        regionBox: {
          width: regionProfile.canvasWidth,
          height: regionProfile.canvasHeight,
          offsetX: regionProfile.offsetX,
          offsetY: regionProfile.offsetY,
        },
        children,
      };
    });

  return {
    ...node,
    children: resolvedChildren,
  };
}

/**
 * Divide a dimension into weighted regions.
 *
 * The returned values always add up to `total`
 * when count is a positive integer.
 */
function computeSplits(
  total: number,
  count: number,
  weights?: number[]
): number[] {
  const safeCount = Math.max(
    0,
    Math.floor(count)
  );

  if (safeCount === 0) {
    return [];
  }

  const safeTotal = Math.max(
    0,
    Math.floor(total)
  );

  const effectiveWeights = Array.from(
    { length: safeCount },
    (_, index) => {
      const weight = weights?.[index] ?? 1;

      return Number.isFinite(weight) && weight > 0
        ? weight
        : 0;
    }
  );

  let totalWeight = effectiveWeights.reduce(
    (sum, weight) => sum + weight,
    0
  );

  // If every weight is zero, use equal sizing.
  if (totalWeight === 0) {
    effectiveWeights.fill(1);
    totalWeight = safeCount;
  }

  const splits = effectiveWeights.map(
    (weight) =>
      Math.floor(
        (weight / totalWeight) * safeTotal
      )
  );

  const allocated = splits.reduce(
    (sum, value) => sum + value,
    0
  );

  // Give remaining pixels to the final region.
  splits[safeCount - 1] +=
    safeTotal - allocated;

  return splits;
}

function createRegionProfile(
  base: DeviceProfile,
  view: EpSegmentViewNode,
  colWidths: number[],
  rowHeights: number[]
): RegionDeviceProfile {
  const {
    row,
    col,
    rowSpan,
    colSpan,
  } = view.cell;

  const offsetX = sumRange(
    colWidths,
    0,
    col
  );

  const offsetY = sumRange(
    rowHeights,
    0,
    row
  );

  const width = sumRange(
    colWidths,
    col,
    colSpan
  );

  const height = sumRange(
    rowHeights,
    row,
    rowSpan
  );

  return {
    ...base,
    canvasWidth: width,
    canvasHeight: height,
    offsetX,
    offsetY,
  };
}

function sumRange(
  values: number[],
  start: number,
  span: number
): number {
  const safeStart = Math.max(
    0,
    Math.floor(start)
  );

  const safeSpan = Math.max(
    0,
    Math.floor(span)
  );

  return values
    .slice(safeStart, safeStart + safeSpan)
    .reduce((sum, value) => sum + value, 0);
}