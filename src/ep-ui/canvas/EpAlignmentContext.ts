import { createContext, useContext } from "react";

type EpAlignmentContextValue = {
  hAlign: "left" | "center" | "right";
  vAlign: "top" | "center" | "bottom";
};

export const EpAlignmentContext =
  createContext<EpAlignmentContextValue>({
    hAlign: "left",
    vAlign: "top",
  });

export function useEpAlignment() {
  return useContext(EpAlignmentContext);
}