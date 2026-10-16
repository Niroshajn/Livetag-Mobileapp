import type {
  EpNode,
  EpCanvasNode,
  EpRowNode,
  EpSegmentNode,
  EpSegmentViewNode,
} from "../types";
import { resolveLayoutWithoutOverflow } from "./resolveLayout";
import type { DeviceProfile, RegionDeviceProfile } from "../device";

export function resolveSegment(
  node: EpSegmentNode,
  profile: DeviceProfile
): EpNode {
  const { rows, cols, rowWeights, colWeights } = node;

  const colHeights = computeSplits(profile.canvasHeight, rows, rowWeights);
  const colWidths = computeSplits(profile.canvasWidth, cols, colWeights);

  const resolvedChildren = node.children.map((view) => {
    const regionProfile = createRegionProfile(
      profile,
      view,
      colWidths,
      colHeights
    );

    const resolved = view.children.map((child) =>
      resolveLayoutWithoutOverflow(child, regionProfile)
    );

    const regionWidth = regionProfile.canvasWidth;
    const regionHeight = regionProfile.canvasHeight;

    return {
      ...view,
      regionBox: {
        width: regionProfile.canvasWidth,
        height: regionProfile.canvasHeight,
        offsetX: regionProfile.offsetX,
        offsetY: regionProfile.offsetY,
      },
      children: resolved,
    };
  });

  return {
    ...node,
    children: resolvedChildren,
  };
}

function computeSplits(
  total: number,
  count: number,
  weights?: number[]
): number[] {
  const effective = weights ?? Array(count).fill(1);
  const sum = effective.reduce((a, b) => a + b, 0);
  const splits = effective.map((w) => Math.floor((w / sum) * total));
  const allocated = splits.reduce((a, b) => a + b, 0);
  splits[count - 1] += total - allocated;
  return splits;
}

function createRegionProfile(
  base: DeviceProfile,
  view: EpSegmentViewNode,
  colWidths: number[],
  rowHeights: number[]
): RegionDeviceProfile {
  const { row, col, rowSpan, colSpan } = view.cell;

  const offsetX = sumRange(colWidths, 0, col);
  const offsetY = sumRange(rowHeights, 0, row);

  const width = sumRange(colWidths, col, colSpan);
  const height = sumRange(rowHeights, row, rowSpan);

  return {
    ...base,
    canvasWidth: width,
    canvasHeight: height,
    offsetX,
    offsetY,
  };
}

function sumRange(arr: number[], start: number, span: number): number {
  return arr.slice(start, start + span).reduce((a, b) => a + b, 0);
}
