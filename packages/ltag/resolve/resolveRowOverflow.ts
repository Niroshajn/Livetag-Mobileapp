import type {
  EpNode,
  EpColumnsNode,
  EpRowNode,
} from "../types";

import type {
  DeviceProfile,
} from "../device";

/* =========================================================
   RESOLVE ROW OVERFLOW
========================================================= */

export function resolveRowOverflow(
  node: EpRowNode,
  _profile: DeviceProfile,
  _maxHeight: number
): EpNode {
  const children =
    node.children ?? [];

  /* -------------------------------------------------------
     EMPTY ROW
  ------------------------------------------------------- */

  if (children.length === 0) {
    return {
      ...node,
      children: [],
    };
  }

  /* -------------------------------------------------------
     EXPLICIT COLUMN GRID
     
     Example:

       grid--cols-3

     becomes:

       column 1 -> items 1,4
       column 2 -> items 2,5
       column 3 -> item 3
  ------------------------------------------------------- */

  if (
    node.overflow ===
    "columns"
  ) {
    const maxColumns = Math.max(
      1,
      Math.floor(
        node.maxColumns ?? 1
      )
    );

    /*
     * Never create more columns than
     * there are children.
     */
    const columnCount =
      Math.min(
        maxColumns,
        children.length
      );

    const columns: EpNode[][] =
      Array.from(
        {
          length:
            columnCount,
        },
        () => []
      );

    /*
     * IMPORTANT:
     *
     * Distribute row-by-row.
     *
     * 5 items, 3 columns:
     *
     * item 1 -> col 0
     * item 2 -> col 1
     * item 3 -> col 2
     * item 4 -> col 0
     * item 5 -> col 1
     */
    children.forEach(
      (
        child,
        index
      ) => {
        const columnIndex =
          index %
          columnCount;

        columns[
          columnIndex
        ].push(child);
      }
    );

    const result: EpColumnsNode =
      {
        type: "columns",

        columns,
      };

    console.log(
      "========== RESOLVE GRID =========="
    );

    console.log(
      "MAX COLUMNS:",
      maxColumns
    );

    console.log(
      "ACTUAL COLUMNS:",
      columnCount
    );

    console.log(
      "ITEM COUNT:",
      children.length
    );

    console.log(
      "ITEMS PER COLUMN:",
      columns.map(
        (column) =>
          column.length
      )
    );

    console.log(
      "=================================="
    );

    return result;
  }

  return {
    ...node,
    children,
  };
}