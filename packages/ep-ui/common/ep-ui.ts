import { StyleSheet } from "react-native";

export const epStyles = StyleSheet.create({
  // =========================================================
  // CANVAS
  // Web:
  // .ep-canvas
  // =========================================================

  epCanvas: {
    backgroundColor: "#ffffff",
    overflow: "hidden",

    // Web padding: 12px
    padding: 12,

    // Needed because the RN preview needs to occupy the device canvas.
    flex: 1,
  },

  epCanvasFull: {
    padding: 0,
    borderWidth: 0,
  },

  // =========================================================
  // SEGMENT
  // =========================================================

  epSegment: {
    flex: 1,
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },

  epSegmentView: {
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 0,
  },

  // =========================================================
  // ROW
  //
  // Web:
  //
  // .ep-row {
  //   display: flex;
  //   flex-direction: column;
  //   height: 100%;
  //   overflow: hidden;
  // }
  // =========================================================

  epRow: {
    flex: 1,
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    borderWidth: 0,
    minHeight: 0,
  },

  epRowItem: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    overflow: "hidden",
  },

  // =========================================================
  // COLUMNS
  //
  // Web:
  //
  // .ep-columns {
  //   display: grid;
  //   grid-auto-flow: column;
  //   gap: 12px;
  //   width: 100%;
  //   height: 100%;
  //   grid-auto-rows: 1fr;
  // }
  //
  // React Native has no equivalent CSS Grid here.
  // Each column therefore gets flex: 1.
  // =========================================================

  epColumns: {
    flex: 1,
    width: "100%",
    height: "100%",

    flexDirection: "row",

    gap: 12,

    minWidth: 0,
    minHeight: 0,

    overflow: "hidden",

    borderWidth: 0,
  },

  // =========================================================
  // COLUMN
  //
  // Web:
  //
  // .ep-column {
  //   display: flex;
  //   flex-direction: column;
  //   gap: 8px;
  //   width: 100%;
  // }
  //
  // flex: 1 is important for matching grid columns.
  // =========================================================

  epColumn: {
    flex: 1,

    flexDirection: "column",

    width: "100%",

    gap: 8,

    minWidth: 0,
    minHeight: 0,

    overflow: "hidden",
  },

  // =========================================================
  // BLOCK
  //
  // Web:
  //
  // .ep-block {
  //   display: flex;
  //   flex-direction: column;
  //   gap: 8px;
  //   flex: 1;
  //   box-sizing: border-box;
  //   padding: 12px;
  //   overflow: hidden;
  // }
  // =========================================================

  epBlock: {
    flex: 1,

    flexDirection: "column",

    gap: 8,

    padding: 12,

    overflow: "hidden",

    minWidth: 0,
    minHeight: 0,
  },

  // =========================================================
  // BLOCK -- H CENTER
  //
  // Web:
  //
  // align-items: center;
  // text-align: center;
  // =========================================================

  epBlockHCenter: {
    alignItems: "center",
  },

  // =========================================================
  // BLOCK -- V CENTER
  //
  // Web:
  //
  // justify-content: center;
  // =========================================================

  epBlockVCenter: {
    justifyContent: "center",
  },

  // =========================================================
  // BLOCK -- H + V CENTER
  // =========================================================

  epBlockCenter: {
    alignItems: "center",
    justifyContent: "center",
  },

  // =========================================================
  // BLOCK -- BORDER
  //
  // Web:
  //
  // border: 1px solid #000;
  // box-sizing: border-box;
  // =========================================================

  epBlockBorder: {
    borderWidth: 1,
    borderColor: "#000000",
  },

  // =========================================================
  // BLOCK -- FULL
  //
  // Web:
  //
  // .ep-block--full {
  //   padding: 0;
  // }
  // =========================================================

  epBlockFull: {
    padding: 0,
  },

  // =========================================================
  // TEXT
  // =========================================================

  text: {
    margin: 0,
    padding: 0,

    color: "#000000",

    // Web:
    // font-family: Roboto;
    fontFamily: "Roboto",
  },

  // =========================================================
  // TEXT SMALL
  //
  // Web:
  // font-size: var(--text-small);
  // line-height: calc(var(--text-small) + 4px);
  //
  // Keep these values equal to your web CSS variables.
  // =========================================================

  textSmall: {
    fontSize: 16,
    lineHeight: 20,
  },

  // =========================================================
  // TEXT MEDIUM
  // =========================================================

  textMedium: {
    fontSize: 20,
    lineHeight: 24,
  },

  // =========================================================
  // TEXT LARGE
  // =========================================================

  textLarge: {
    fontSize: 22,
    lineHeight: 26,
  },

  // =========================================================
  // TEXT H CENTER
  //
  // Web:
  // text-align: center;
  // =========================================================

  textHCenter: {
    textAlign: "center",
  },

  // =========================================================
  // TEXT V CENTER
  //
  // IMPORTANT:
  //
  // The web implementation is:
  //
  // display: flex;
  // align-items: center;
  // justify-content: center;
  //
  // This style is intended for a WRAPPER View,
  // not directly for Text.
  // =========================================================

  textVCenter: {
    alignItems: "center",
    justifyContent: "center",
  },

  // =========================================================
  // TEXT CENTER
  // =========================================================

  textCenter: {
    textAlign: "center",
  },

  // =========================================================
  // TEXT BOLD
  // =========================================================

  textBold: {
    fontWeight: "700",
  },

  // =========================================================
  // STAT
  // =========================================================

  stat: {
    flexDirection: "column",
  },

  // =========================================================
  // STAT VALUE
  //
  // Web:
  // font-weight: bold;
  // =========================================================

  statValue: {
    fontWeight: "700",
    color: "#000000",
    fontFamily: "Roboto",
  },

  // =========================================================
  // STAT SMALL
  // =========================================================

  statSmall: {
    fontSize: 16,
    lineHeight: 20,
  },

  // =========================================================
  // STAT MEDIUM
  // =========================================================

  statMedium: {
    fontSize: 20,
    lineHeight: 24,
  },

  // =========================================================
  // STAT LARGE
  // =========================================================

  statLarge: {
    fontSize: 26,
    lineHeight: 30,
  },

  // =========================================================
  // STAT CENTER
  //
  // Web:
  // .ep-stat--center {
  //   align-items: center;
  //   text-align: center;
  // }
  // =========================================================

  statCenter: {
    alignItems: "center",
  },

  statTextCenter: {
    textAlign: "center",
  },

  // =========================================================
  // IMAGE WRAPPER
  //
  // Web:
  //
  // .ep-image-wrap {
  //   flex: 1;
  //   display: flex;
  //   align-items: center;
  //   justify-content: center;
  //   background-color: rgb(254,249,249);
  //   overflow: hidden;
  //   position: relative;
  // }
  // =========================================================

  epImageWrap: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgb(254, 249, 249)",

    overflow: "hidden",

    position: "relative",

    minWidth: 0,
    minHeight: 0,
  },

  epImage: {
    width: "100%",
    height: "100%",

    resizeMode: "cover",

    backgroundColor: "rgba(110, 110, 110, 0.35)",
  },
  epImageContain: {
    width: "100%",
    height: "100%",

    resizeMode: "contain",

    backgroundColor: "rgba(110, 110, 110, 0.35)",
  },
  epImageOverlay: {
    position: "absolute",

    bottom: 10,
    right: 10,

    width: "auto",

    paddingVertical: 8,
    paddingHorizontal: 12,

    backgroundColor: "transparent",

    borderRadius: 4,
  },

  epImageOverlayText: {
    color: "rgb(10, 3, 3)",

    fontSize: 24,

    lineHeight: 28,

    fontWeight: "700",

    fontFamily: "Roboto",

    textAlign: "right",
  },

  // =========================================================
  // CANVAS OVERLAY
  //
  // Web:
  //
  // position: absolute;
  // bottom: 5px;
  // right: 0;
  // width: 100%;
  // min-height: 60px;
  // display: flex;
  // align-items: flex-end;
  // justify-content: flex-end;
  // padding: 10px;
  // =========================================================

  epCanvasOverlay: {
    position: "absolute",

    bottom: 5,
    right: 0,

    width: "100%",

    minHeight: 60,

    alignItems: "flex-end",
    justifyContent: "flex-end",

    backgroundColor: "transparent",

    padding: 10,
  },

  // =========================================================
  // CANVAS OVERLAY IMAGE WRAPPER
  //
  // Web:
  //
  // width: 60px;
  // height: 60px;
  // position: absolute;
  // bottom: 20px;
  // right: 30px;
  // =========================================================

  epCanvasOverlayImageWrap: {
    width: 60,
    height: 60,

    position: "absolute",

    bottom: 20,
    right: 30,
  },

  // =========================================================
  // CANVAS OVERLAY IMAGE
  // =========================================================

  epCanvasOverlayImage: {
    width: 60,
    height: 60,

    resizeMode: "contain",
  },

  // =========================================================
  // OVERLAY ICON
  // =========================================================

  epOverlayIcon: {
    width: 60,
    height: 60,

    resizeMode: "contain",
  },

  // =========================================================
  // IFRAME / WEBVIEW
  //
  // Web:
  //
  // .ep-iframe-wrap {
  //   flex: 1;
  //   display: flex;
  // }
  //
  // .ep-iframe-wrap iframe {
  //   width: 100%;
  //   height: 100%;
  //   border: none;
  // }
  // =========================================================

  epIframeWrap: {
    flex: 1,

    overflow: "hidden",

    minWidth: 0,
    minHeight: 0,
  },

  epIframe: {
    flex: 1,

    width: "100%",
    height: "100%",

    borderWidth: 0,
  },
});