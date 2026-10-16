import type { EpRowNode, EpNode } from "../types";
import type { DeviceProfile } from "../device";
import { estimateBlockHeight } from "./estimate";

function extractProps(block?: EpNode) {
  if (!block || block.type !== "block") {
    return {
      size: undefined,
      align: undefined,
      type: "text",
    };
  }

  const child = block.children.find(
    (c) => c.type === "text" || c.type === "stat"
  );

  if (!child) {
    return {
      size: undefined,
      align: undefined,
      type: "text",
    };
  }

  return {
    size: child.size,
    type: child.type,
  };
}

export function resolveColumnOverflow(
  row: EpRowNode,
  profile: DeviceProfile,
  maxHeight: number,
  maxColumns: number
): EpNode {
  const columns: EpNode[][] = [];
  let currentCol: EpNode[] = [];
  let currentHeight = 0;
  let used = 0;

  // Ensure the maximum number of columns is valid.
  const columnLimit = Math.max(
    1,
    Math.floor(maxColumns || 2)
  );

  for (const block of row.children) {
    if (block.type !== "block") {
      continue;
    }

    const h = estimateBlockHeight(block, profile);

    if (currentHeight + h <= maxHeight) {
      currentCol.push(block);
      currentHeight += h + profile.blockGap;
      used++;
      continue;
    }

    // Do not add an empty column.
    if (currentCol.length > 0) {
      columns.push(currentCol);
    }

    if (columns.length >= columnLimit) {
      break;
    }

    // Start a new column with the current block.
    currentCol = [block];
    currentHeight = h + profile.blockGap;
    used++;
  }

  if (
    currentCol.length > 0 &&
    columns.length < columnLimit
  ) {
    columns.push(currentCol);
  }

  const hidden = row.children.length - used;

  // Safely handle the case where no columns were created.
  const lastColumn =
    columns.length > 0
      ? columns[columns.length - 1]
      : undefined;

  const lastBlock =
    lastColumn && lastColumn.length > 0
      ? lastColumn[lastColumn.length - 1]
      : undefined;

  const { size, type } = extractProps(lastBlock);

  if (hidden > 0 && lastColumn) {
    lastColumn.push({
      type: "block",
      full:
        lastBlock?.type === "block"
          ? lastBlock.full ?? false
          : false,
      border:
        lastBlock?.type === "block"
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
    type: "columns",
    columns,
  };
}