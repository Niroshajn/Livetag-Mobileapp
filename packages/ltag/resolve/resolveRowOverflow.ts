import type { EpRowNode, EpNode } from "../types";
import type { DeviceProfile } from "../device";
import { resolveColumnOverflow } from "./resolveColumnOverflow";
import { estimateBlockHeight } from "./estimate";

function extractProps(block?: EpNode) {
  if (!block || block.type !== "block") {
    return { size: undefined, align: undefined, type: "text" };
  }

  const child = block.children.find(
    (c) => c.type === "text" || c.type === "stat"
  );

  if (!child) {
    return { size: undefined, align: undefined, type: "text" };
  }

  return {
    size: child.size,
    type: child.type,
  };
}
export function resolveRowOverflow(
  row: EpRowNode,
  profile: DeviceProfile,
  maxHeight: number
): EpNode {
  if (row.overflow === "columns") {
    return resolveColumnOverflow(row, profile, maxHeight, row.maxColumns ?? 2);
  }

  let used = 0;
  const visible: EpNode[] = [];

  for (const block of row.children) {
    if (block.type !== "block") continue;
    const h = estimateBlockHeight(block, profile);
    if (used + h > maxHeight) break;
    used += h + profile.blockGap;
    visible.push(block);
  }

  const hidden = row.children.length - visible.length;
const lastBlock =
  visible.length > 0
    ? visible[visible.length - 1]
    : undefined;
  const { size, type } = extractProps(lastBlock);
 if (hidden > 0) {
  visible.push({
    type: "block",
    full:
      lastBlock && lastBlock.type === "block"
        ? lastBlock.full ?? false
        : false,
    border:
      lastBlock && lastBlock.type === "block"
        ? lastBlock.border ?? false
        : false,
    children: [
      type === "stat"
        ? {
            type: "stat",
            value: `and ${hidden} more`,
            size,
          }
        : {
            type: "text",
            text: `and ${hidden} more`,
            size,
          },
    ],
  });
}
  return {
    type: "row",
    children: visible,
  };
}
