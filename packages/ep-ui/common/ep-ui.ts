import { StyleSheet } from "react-native";

export const epStyles = StyleSheet.create({
  // =========================================================
  // CANVAS
  // =========================================================

  epCanvas: {
    backgroundColor: "#ffffff",
    overflow: "hidden",
    padding: 12,
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
    overflow: "hidden",
    width: "100%",
    height: "100%",
  },

  epSegmentView: {
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 0,
  },

  // =========================================================
  // ROW
  // =========================================================

  epRow: {
    flex: 1,
    flexDirection: "column",
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
  // =========================================================

  epColumns: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    minWidth: 0,
    minHeight: 0,
    overflow: "hidden",
    borderWidth: 0,
  },

  epColumn: {
    flex: 1,
    flexDirection: "column",
    gap: 8,
    minWidth: 0,
    minHeight: 0,
    overflow: "hidden",
  },

  // =========================================================
  // BLOCK
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

  epBlockHCenter: {
    alignItems: "center",
  },

  epBlockVCenter: {
    justifyContent: "center",
  },

  epBlockBorder: {
    borderWidth: 1,
    borderColor: "#000000",
  },

  epBlockFull: {
    padding: 0,
  },

  // =========================================================
  // TEXT
  // =========================================================

  text: {
    margin: 0,
    color: "#000000",
  },

  textSmall: {
    fontSize: 16,
    lineHeight: 20,
  },

  textMedium: {
    fontSize: 20,
    lineHeight: 24,
  },

  textLarge: {
    fontSize: 22,
    lineHeight: 26,
  },

  textHCenter: {
    textAlign: "center",
  },

  textVCenter: {
    textAlignVertical: "center",
  },

  // =========================================================
  // STAT
  // =========================================================

  stat: {
    flexDirection: "column",
  },

  statValue: {
    fontWeight: "bold",
    color: "#000000",
  },

  statSmall: {
    fontSize: 16,
    lineHeight: 20,
  },

  statMedium: {
    fontSize: 20,
    lineHeight: 24,
  },

  statLarge: {
    fontSize: 26,
    lineHeight: 30,
  },

  statCenter: {
    alignItems: "center",
  },

  statTextCenter: {
    textAlign: "center",
  },

  // =========================================================
  // IMAGE
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

  // =========================================================
  // IMAGE OVERLAY
  // =========================================================

  epImageOverlay: {
    position: "absolute",
    bottom: 10,
    right: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "transparent",
    borderRadius: 4,
  },

  epImageOverlayText: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "bold",
  },

  epOverlayIcon: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },

  // =========================================================
  // CANVAS OVERLAY
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

  epCanvasOverlayImageWrap: {
    width: 60,
    height: 60,
    position: "absolute",
    bottom: 20,
    right: 30,
  },

  epCanvasOverlayImage: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },

  // =========================================================
  // IFRAME / WEBVIEW
  // =========================================================

  epIframeWrap: {
    flex: 1,
    overflow: "hidden",
  },

  epIframe: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderWidth: 0,
  },
});