type StatSize = {
  fontSize: number;
  lineHeight: number;
};

export type DeviceProfile = {
  /* =========================================================
     CANVAS
  ========================================================= */

  canvasWidth: number;
  canvasHeight: number;
  canvasPaddingY: number;

  /* =========================================================
     ROW
  ========================================================= */

  rowGap: number;
  rowPaddingY: number;
  maxRowHeightRatio: number;

  /* =========================================================
     BLOCK
  ========================================================= */

  blockGap: number;
  blockBorder: number;
  blockPaddingY: number;

  /* =========================================================
     TEXT
  ========================================================= */

  lineHeight: number;
  wordsPerLine: number;

  /* =========================================================
     IMAGE
  ========================================================= */

  imageDefaultHeight: number;

  /* =========================================================
     FONT SIZES
  ========================================================= */

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

/* =========================================================
   DEFAULT DEVICE
========================================================= */

export const DEFAULT_DEVICE_PROFILE: DeviceProfile = {
  canvasWidth: 800,
  canvasHeight: 480,

  canvasPaddingY: 32,

  rowGap: 8,
  rowPaddingY: 0,

  // IMPORTANT
  maxRowHeightRatio: 0.5,

  blockGap: 8,
  blockBorder: 2,
  blockPaddingY: 12,

  lineHeight: 24,
  wordsPerLine: 8,

  imageDefaultHeight: 120,

  textSizes: {
    small: 16,
    medium: 20,
    large: 22,
  },

  statSizes: {
    small: {
      fontSize: 16,
      lineHeight: 20,
    },

    medium: {
      fontSize: 20,
      lineHeight: 24,
    },

    large: {
      fontSize: 22,
      lineHeight: 28,
    },
  },
};

/* =========================================================
   LTDP75BW 800 x 480
========================================================= */

export const LTDP75BW_800x480: DeviceProfile = {
  canvasWidth: 800,
  canvasHeight: 480,

  canvasPaddingY: 32,

  rowPaddingY: 0,
  rowGap: 8,

  // IMPORTANT
  maxRowHeightRatio: 0.5,

  blockGap: 8,
  blockBorder: 2,
  blockPaddingY: 12,

  lineHeight: 28,
  wordsPerLine: 8,

  imageDefaultHeight: 120,

  textSizes: {
    small: 18,
    medium: 22,
    large: 26,
  },

  statSizes: {
    small: {
      fontSize: 18,
      lineHeight: 24,
    },

    medium: {
      fontSize: 22,
      lineHeight: 28,
    },

    large: {
      fontSize: 26,
      lineHeight: 32,
    },
  },
};

/* =========================================================
   E6 73IN 800 x 480
========================================================= */

export const E6_73IN_800x480: DeviceProfile = {
  canvasWidth: 800,
  canvasHeight: 480,

  canvasPaddingY: 32,

  rowPaddingY: 0,
  rowGap: 8,

  // IMPORTANT
  maxRowHeightRatio: 0.5,

  blockGap: 8,
  blockBorder: 2,
  blockPaddingY: 12,

  lineHeight: 28,
  wordsPerLine: 8,

  imageDefaultHeight: 120,

  textSizes: {
    small: 18,
    medium: 22,
    large: 26,
  },

  statSizes: {
    small: {
      fontSize: 18,
      lineHeight: 24,
    },

    medium: {
      fontSize: 22,
      lineHeight: 28,
    },

    large: {
      fontSize: 26,
      lineHeight: 32,
    },
  },
};

/* =========================================================
   E6 13IN 1200 x 1600
========================================================= */

export const E6_13IN_1200x1600: DeviceProfile = {
  canvasWidth: 1200,
  canvasHeight: 1600,

  canvasPaddingY: 32,

  rowPaddingY: 0,
  rowGap: 8,

  // IMPORTANT
  maxRowHeightRatio: 0.5,

  blockGap: 8,
  blockBorder: 2,
  blockPaddingY: 16,

  lineHeight: 44,
  wordsPerLine: 10,

  imageDefaultHeight: 220,

  textSizes: {
    small: 28,
    medium: 38,
    large: 48,
  },

  statSizes: {
    small: {
      fontSize: 28,
      lineHeight: 34,
    },

    medium: {
      fontSize: 34,
      lineHeight: 42,
    },

    large: {
      fontSize: 40,
      lineHeight: 48,
    },
  },
};
/* =========================================================
   DEVICE PROFILE MAP
========================================================= */

export const DEVICE_PROFILE_MAP: Record<
  string,
  DeviceProfile
> = {
  LTDP75BW_800x480,
  E6_73IN_800x480,
  E6_13IN_1200x1600,
};

/* =========================================================
   GET DEVICE PROFILE
========================================================= */

export function getDeviceProfile(
  modelNo: string
): DeviceProfile {
  return (
    DEVICE_PROFILE_MAP[modelNo] ??
    DEFAULT_DEVICE_PROFILE
  );
}
export type RegionDeviceProfile =
  DeviceProfile & {
    offsetX: number;
    offsetY: number;
  };