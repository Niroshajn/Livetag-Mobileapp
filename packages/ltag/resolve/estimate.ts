
import type { EpBlockNode } from "../types";
import type { DeviceProfile } from "../device";

export function getLineHeight(
  size: "small" | "medium" | "large",
  profile: DeviceProfile
): number {
  const fontSize = profile.textSizes[size];

  return profile.lineHeight || Math.ceil(fontSize * 1.2);
}

export function estimateTextHeight(
  text: string,
  size: "small" | "medium" | "large",
  profile: DeviceProfile
): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  if (!words) return 0;

  const wordsPerLine = profile.wordsPerLine;
  const lines = Math.ceil(words / wordsPerLine);
  const lineHeight = getLineHeight(size, profile);

  return lines * lineHeight;
}

export function estimateBlockHeight(
  block: EpBlockNode,
  profile: DeviceProfile
): number {
  let contentHeight = 0;

  for (const child of block.children) {
    if (child.type === "text") {
      contentHeight += estimateTextHeight(
        child.text,
        child.size ?? "medium",
        profile
      );
    }

    if (child.type === "stat") {
      const size = child.size ?? "medium";

      if (child.label) {
        contentHeight += estimateTextHeight(
          child.label,
          size,
          profile
        );
      }

      if (child.value) {
        contentHeight += estimateTextHeight(
          child.value,
          size,
          profile
        );
      }
    }

    if (child.type === "image") {
      contentHeight +=
        child.height ?? profile.imageDefaultHeight;
    }
  }

  const pad = block.padding ?? profile.blockPaddingY ?? 0;

  return (
    contentHeight +
    pad * 2 +
    profile.blockBorder * 2
  );
}
