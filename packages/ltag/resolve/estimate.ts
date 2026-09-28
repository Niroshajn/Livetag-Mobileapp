import type { EpBlockNode } from "../types";
import type { DeviceProfile } from "../device";

const DEFAULT_BLOCK_PADDING_X = 12;

function getFontSize(
  size: "small" | "medium" | "large",
  profile: DeviceProfile
): number {
  return profile.textSizes[size];
}

function estimateWrappedTextHeight(
  text: string,
  fontSize: number,
  lineHeight: number,
  availableWidth: number
): number {
  if (!text.trim()) {
    return 0;
  }

  // Approximate the width of text using the font size.
  // This is an estimate, not native font measurement.
  const averageCharacterWidth = fontSize * 0.52;

  const maxCharactersPerLine = Math.max(
    1,
    Math.floor(availableWidth / averageCharacterWidth)
  );

  const words = text.trim().split(/\s+/);

  let lines = 1;
  let currentLineLength = 0;

  for (const word of words) {
    // Also handle words that are longer than one line.
    if (word.length > maxCharactersPerLine) {
      if (currentLineLength > 0) {
        lines++;
        currentLineLength = 0;
      }

      const wordLines = Math.ceil(
        word.length / maxCharactersPerLine
      );

      lines += wordLines - 1;

      const remainingCharacters =
        word.length % maxCharactersPerLine;

      currentLineLength = remainingCharacters;
      continue;
    }

    const requiredLength =
      currentLineLength === 0
        ? word.length
        : currentLineLength + 1 + word.length;

    if (requiredLength > maxCharactersPerLine) {
      lines++;
      currentLineLength = word.length;
    } else {
      currentLineLength = requiredLength;
    }
  }

  return lines * lineHeight;
}

export function getLineHeight(
  size: "small" | "medium" | "large",
  profile: DeviceProfile
): number {
  // Match the lineHeight used by the React Native Text renderer.
  return profile.lineHeight;
}

export function estimateTextHeight(
  text: string,
  size: "small" | "medium" | "large",
  profile: DeviceProfile
): number {
  const fontSize = getFontSize(size, profile);

  const availableWidth = Math.max(
    1,
    profile.canvasWidth -
      DEFAULT_BLOCK_PADDING_X * 2 -
      profile.blockBorder * 2
  );

  return estimateWrappedTextHeight(
    text,
    fontSize,
    getLineHeight(size, profile),
    availableWidth
  );
}

export function estimateBlockHeight(
  block: EpBlockNode,
  profile: DeviceProfile
): number {
  const horizontalPadding = block.full
    ? 0
    : DEFAULT_BLOCK_PADDING_X;

  const verticalPadding = block.full
    ? 0
    : profile.blockPaddingY;

  const borderWidth = block.border
    ? profile.blockBorder
    : 0;

  const availableWidth = Math.max(
    1,
    profile.canvasWidth -
      horizontalPadding * 2 -
      borderWidth * 2
  );

  let contentHeight = 0;

  for (const child of block.children) {
    if (child.type === "text") {
      const size = child.size ?? "medium";

      contentHeight += estimateWrappedTextHeight(
        child.text ?? "",
        profile.textSizes[size],
        profile.lineHeight,
        availableWidth
      );
    }

    if (child.type === "stat") {
      const size = child.size ?? "medium";
      const statStyle = profile.statSizes[size];

      if (child.label) {
        contentHeight += estimateWrappedTextHeight(
          child.label,
          statStyle.fontSize,
          statStyle.lineHeight,
          availableWidth
        );
      }

      if (child.value) {
        contentHeight += estimateWrappedTextHeight(
          child.value,
          statStyle.fontSize,
          statStyle.lineHeight,
          availableWidth
        );
      }
    }

    if (child.type === "image") {
      contentHeight +=
        child.height ?? profile.imageDefaultHeight;
    }
  }

  return (
    contentHeight +
    verticalPadding * 2 +
    borderWidth * 2
  );
}