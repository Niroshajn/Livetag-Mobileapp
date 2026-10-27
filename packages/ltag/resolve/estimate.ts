
// import type { EpBlockNode } from "../types";
// import type { DeviceProfile } from "../device";

// export function getLineHeight(
//   size: "small" | "medium" | "large",
//   profile: DeviceProfile
// ): number {
//   const fontSize = profile.textSizes[size];

//   return profile.lineHeight || Math.ceil(fontSize * 1.2);
// }

// export function estimateTextHeight(
//   text: string,
//   size: "small" | "medium" | "large",
//   profile: DeviceProfile
// ): number {
//   const words = text.trim().split(/\s+/).filter(Boolean).length;

//   if (!words) return 0;

//   const wordsPerLine = profile.wordsPerLine;
//   const lines = Math.ceil(words / wordsPerLine);
//   const lineHeight = getLineHeight(size, profile);

//   return lines * lineHeight;
// }

// export function estimateBlockHeight(
//   block: EpBlockNode,
//   profile: DeviceProfile
// ): number {
//   let contentHeight = 0;

//   for (const child of block.children) {
//     if (child.type === "text") {
//       contentHeight += estimateTextHeight(
//         child.text,
//         child.size ?? "medium",
//         profile
//       );
//     }

//     if (child.type === "stat") {
//       const size = child.size ?? "medium";

//       if (child.label) {
//         contentHeight += estimateTextHeight(
//           child.label,
//           size,
//           profile
//         );
//       }

//       if (child.value) {
//         contentHeight += estimateTextHeight(
//           child.value,
//           size,
//           profile
//         );
//       }
//     }

//     if (child.type === "image") {
//       contentHeight +=
//         child.height ?? profile.imageDefaultHeight;
//     }
//   }

//   const pad = block.padding ?? profile.blockPaddingY ?? 0;

//   return (
//     contentHeight +
//     pad * 2 +
//     profile.blockBorder * 2
//   );
// }

// import type { EpBlockNode } from "../types";
// import type { DeviceProfile } from "../device";

// type Size = "small" | "medium" | "large";

// export const CANVAS_PADDING_X = 16;
// export const COLUMN_GAP = 12;

// const AVG_CHAR_RATIO = 0.55; // average Roboto glyph width / font size
// const STAT_LABEL = { fontSize: 14, lineHeight: 18, marginTop: 4 };

// // Must match EpText (fontSize + 4)
// export function getTextLineHeight(size: Size, profile: DeviceProfile): number {
//   return profile.textSizes[size] + 4;
// }

// // Kept for backward compatibility
// export const getLineHeight = getTextLineHeight;

// export function defaultContentWidth(profile: DeviceProfile): number {
//   return profile.canvasWidth - CANVAS_PADDING_X * 2;
// }

// function countLines(text: string, fontSize: number, width: number): number {
//   const words = text.trim().split(/\s+/).filter(Boolean);
//   if (!words.length) return 0;

//   const maxChars = Math.max(1, Math.floor(width / (fontSize * AVG_CHAR_RATIO)));

//   let lines = 1;
//   let current = 0;

//   for (const word of words) {
//     if (current === 0) {
//       current = word.length;
//     } else if (current + 1 + word.length <= maxChars) {
//       current += 1 + word.length;
//     } else {
//       lines++;
//       current = word.length;
//     }
//     // very long word that must be broken
//     while (current > maxChars) {
//       lines++;
//       current -= maxChars;
//     }
//   }
//   return lines;
// }

// export function estimateTextHeight(
//   text: string,
//   size: Size,
//   profile: DeviceProfile,
//   width: number = defaultContentWidth(profile)
// ): number {
//   const lines = countLines(text, profile.textSizes[size], width);
//   return lines * getTextLineHeight(size, profile);
// }

// export function estimateBlockHeight(
//   block: EpBlockNode,
//   profile: DeviceProfile,
//   outerWidth: number = defaultContentWidth(profile)
// ): number {
//   // Must match EpBlock
//   const pad = block.full ? 0 : block.padding ?? profile.blockPaddingY ?? 0;
//   const border = block.border ? 2 : 0; // 1px each side
//   const innerWidth = Math.max(1, outerWidth - pad * 2 - border);

//   const heights: number[] = [];

//   for (const child of block.children) {
//     if (child.type === "text") {
//       heights.push(
//         estimateTextHeight(child.text, child.size ?? "medium", profile, innerWidth)
//       );
//     } else if (child.type === "stat") {
//       const size = child.size ?? "medium";
//       const stat = profile.statSizes[size];
//       let h = 0;

//       if (child.value) {
//         h += countLines(child.value, stat.fontSize, innerWidth) * stat.lineHeight;
//       }
//       if (child.label) {
//         h +=
//           STAT_LABEL.marginTop +
//           countLines(child.label, STAT_LABEL.fontSize, innerWidth) *
//             STAT_LABEL.lineHeight;
//       }
//       heights.push(h);
//     } else if (child.type === "image") {
//       heights.push(child.height ?? profile.imageDefaultHeight);
//     }
//   }

//   const gaps = Math.max(0, heights.length - 1) * profile.blockGap;
//   const content = heights.reduce((a, b) => a + b, 0) + gaps;

//   return content + pad * 2 + border;
// }

import type { EpBlockNode } from "../types";
import type { DeviceProfile } from "../device";

type Size = "small" | "medium" | "large";

const LINE_HEIGHT_RATIO = 1.6;

export function getLineHeight(size: Size, profile: DeviceProfile): number {
  return Math.ceil(profile.textSizes[size] * LINE_HEIGHT_RATIO);
}

export function estimateTextHeight(
  text: string,
  size: Size,
  profile: DeviceProfile
): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (!words) return 0;

  let wordsPerLine = profile.wordsPerLine;
  if (size === "large") wordsPerLine *= 1.6;
  if (size === "small") wordsPerLine *= 1.6;

  const lines = Math.ceil(words / wordsPerLine);
  return lines * getLineHeight(size, profile);
}

export function estimateBlockHeight(
  block: EpBlockNode,
  profile: DeviceProfile
): number {
  let contentHeight = 0;

  for (const child of block.children) {
    if (child.type === "text") {
      contentHeight += estimateTextHeight(child.text, child.size ?? "medium", profile);
    }
    if (child.type === "stat") {
      const size = child.size ?? "medium";
      if (child.label) contentHeight += estimateTextHeight(child.label, size, profile);
      if (child.value) contentHeight += estimateTextHeight(child.value, size, profile);
    }
    if (child.type === "image") {
      contentHeight += child.height ?? profile.imageDefaultHeight;
    }
  }

  const pad = block.padding ?? profile.blockPaddingY ?? 0;
  return contentHeight + pad * 2 + profile.blockBorder * 2;
}