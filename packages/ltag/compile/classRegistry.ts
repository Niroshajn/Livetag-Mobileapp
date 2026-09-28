// packages/ltag/compile/classRegistry.ts

export const ALLOWED_CLASS_LITERALS =
  new Set<string>([
    // Layout
    "layout",
    "layout--full",
    "layout--col",
    "layout--row",

    // Grid
    "grid",

    // Items
    "item",
    "item--full",
    "item--center",
    "item--border",
    "item--hcenter",
    "item--vcenter",

    // Iframe
    "iframe",

    // Text
    "text",
    "text--small",
    "text--medium",
    "text--large",
    "text--h-center",
    "text--v-center",
    "text--center",

    // Stat
    "stat",
    "value",
    "stat-value",
    "stat-value--small",
    "stat-value--medium",
    "stat-value--large",
    "stat-value--center",

    // Label
    "label",

    // Image
    "image",
    "ep-image",
    "ep-image-wrap",
    "ep-image-overlay",

    // Overlay
    "overlay",

    // Segment
    "segment",
    "segment-view",
  ]);

export const ALLOWED_CLASS_PATTERNS: RegExp[] = [
  /^grid--cols-\d+$/,
  /^grid--rows-\d+$/,
];