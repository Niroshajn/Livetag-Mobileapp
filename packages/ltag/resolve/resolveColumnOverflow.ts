import type {
  EpRowNode,
  EpNode,
  EpBlockNode,
} from "../types";

import type {
  DeviceProfile,
} from "../device";

import {
  estimateBlockHeight,
} from "./estimate";

function extractProps(block?: EpNode) {
  if (!block || block.type !== "block") {
    return {
      size: undefined,
      type: "text" as const,
    };
  }

  const child = block.children.find(
    (item) =>
      item.type === "text" ||
      item.type === "stat"
  );

  if (!child) {
    return {
      size: undefined,
      type: "text" as const,
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
  const blocks = row.children.filter(
    (node): node is EpBlockNode =>
      node.type === "block"
  );

  if (blocks.length === 0) {
    return {
      type: "columns",
      columns: [],
    };
  }

  const columnLimit = Math.max(
    1,
    Math.floor(maxColumns)
  );

  const columns: EpNode[][] = [];

  let currentColumn: EpNode[] = [];
  let currentHeight = 0;
  let used = 0;

  for (const block of blocks) {
    const blockHeight = estimateBlockHeight(
      block,
      profile
    );

    const nextHeight =
      currentColumn.length === 0
        ? blockHeight
        : currentHeight +
          profile.blockGap +
          blockHeight;

    if (
      currentColumn.length > 0 &&
      nextHeight > maxHeight
    ) {
      columns.push(currentColumn);

      if (columns.length >= columnLimit) {
        break;
      }

      currentColumn = [];
      currentHeight = 0;
    }

    if (currentColumn.length === 0) {
      currentColumn.push(block);
      currentHeight = blockHeight;
    } else {
      currentColumn.push(block);

      currentHeight +=
        profile.blockGap +
        blockHeight;
    }

    used++;
  }

  if (
    currentColumn.length > 0 &&
    columns.length < columnLimit
  ) {
    columns.push(currentColumn);
  }

  const hidden = Math.max(
    0,
    blocks.length - used
  );

  if (
    hidden > 0 &&
    columns.length > 0
  ) {
    const lastColumn =
      columns[columns.length - 1];

    const lastBlock =
      lastColumn[lastColumn.length - 1];

    const { size, type } =
      extractProps(lastBlock);

    const moreBlock: EpBlockNode = {
      type: "block",

      full: lastBlock?.type === "block"
        ? lastBlock.full ?? false
        : false,

      border: lastBlock?.type === "block"
        ? lastBlock.border ?? false
        : false,

      hAlign: lastBlock?.type === "block"
        ? lastBlock.hAlign
        : undefined,

      vAlign: lastBlock?.type === "block"
        ? lastBlock.vAlign
        : undefined,

      children:
        type === "stat"
          ? [
              {
                type: "stat",
                value: `and ${hidden} more`,
                size,
              },
            ]
          : [
              {
                type: "text",
                text: `and ${hidden} more`,
                size,
              },
            ],
    };

    lastColumn.push(moreBlock);
  }

  return {
    type: "columns",
    columns,
  };
}