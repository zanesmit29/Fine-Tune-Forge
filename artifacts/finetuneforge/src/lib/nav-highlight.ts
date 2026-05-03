import { createContext, useContext } from "react";

export interface NavHighlightState {
  highlightMyModels: boolean;
  clearHighlight: () => void;
}

export const NavHighlightContext = createContext<NavHighlightState>({
  highlightMyModels: false,
  clearHighlight: () => {},
});

export function useNavHighlight(): NavHighlightState {
  return useContext(NavHighlightContext);
}
