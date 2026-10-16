type StatSize = {
  fontSize: number;
  lineHeight: number;
};

export type DeviceProfile = {
  // Canvas
  canvasWidth: number;
  canvasHeight: number;
  canvasPaddingY: number;
  // Row
  rowGap: number;
  rowPaddingY: number;
  maxRowHeightRatio: number;
  // Block
  blockGap: number;
  blockBorder: number;
  blockPaddingY: number;
  // Text
  lineHeight: number;
  wordsPerLine: number;
  //Image
  imageDefaultHeight: number;
  statSizes: {
    small: StatSize;
    medium: StatSize;
    large: StatSize;
  };
  textSizes: {
    small: number;
    medium: number;
    large: number;
  };
};

export const DEFAULT_DEVICE_PROFILE: DeviceProfile = {
  canvasWidth: 800,
  canvasHeight: 480,
  canvasPaddingY: 32, // 16 * 2
  rowPaddingY: 0,
  rowGap: 8,
  blockGap: 8,
  blockBorder: 2,
  blockPaddingY: 12,
  lineHeight: 24,
  wordsPerLine: 8,
  imageDefaultHeight: 120,
  maxRowHeightRatio: 0.5,

  textSizes: {
    small: 16,
    medium: 20,
    large: 22,
  },
  statSizes: {
    small: { fontSize: 16, lineHeight: 20 },
    medium: { fontSize: 20, lineHeight: 24 },
    large: { fontSize: 26, lineHeight: 30 },
  },
};

export const LTDP75BW_800x480: DeviceProfile = {
  canvasWidth: 800,
  canvasHeight: 480,

  canvasPaddingY: 32,
  rowPaddingY: 0,
  rowGap: 8,

  blockGap: 8,
  blockBorder: 2,
  blockPaddingY: 12,

  lineHeight: 24,
  wordsPerLine: 8,
  imageDefaultHeight: 120,

  maxRowHeightRatio: 0.5,

  textSizes: {
    small: 18,
    medium: 22,
    large: 26,
  },
  statSizes: {
    small: { fontSize: 18, lineHeight: 22 },
    medium: { fontSize: 22, lineHeight: 26 },
    large: { fontSize: 26, lineHeight: 30 },
  },
};

export const E6_73IN_800x480: DeviceProfile = {
  canvasWidth: 800,
  canvasHeight: 480,

  canvasPaddingY: 32,
  rowPaddingY: 0,
  rowGap: 8,

  blockGap: 8,
  blockBorder: 2,
  blockPaddingY: 12,

  lineHeight: 24,
  wordsPerLine: 8,
  imageDefaultHeight: 120,
  maxRowHeightRatio: 0.5,
  textSizes: {
    small: 18,
    medium: 22,
    large: 26,
  },
  statSizes: {
    small: { fontSize: 18, lineHeight: 22 },
    medium: { fontSize: 22, lineHeight: 26 },
    large: { fontSize: 26, lineHeight: 30 },
  },
};

export const E6_13IN_1200x1600: DeviceProfile = {
  canvasWidth: 1200,
  canvasHeight: 1600,

  canvasPaddingY: 32,
  rowPaddingY: 0,
  rowGap: 8,

  blockGap: 8,
  blockBorder: 2,
  blockPaddingY: 12,

  lineHeight: 26,
  wordsPerLine: 8,
  imageDefaultHeight: 120,

  maxRowHeightRatio: 0.5,
  textSizes: {
    small: 28,
    medium: 38,
    large: 48,
  },
  statSizes: {
    small: { fontSize: 28, lineHeight: 32 },
    medium: { fontSize: 34, lineHeight: 38 },
    large: { fontSize: 40, lineHeight: 44 },
  },
};
export type RegionDeviceProfile = DeviceProfile & {
  offsetX: number;
  offsetY: number;
};
