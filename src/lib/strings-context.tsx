import { createContext, useContext } from "react";

export type StringsContextType = {
  strings: Record<string, string>;
  language: "en" | "pt";
  setLanguage: (lang: "en" | "pt") => void;
};

export const StringsContext = createContext<StringsContextType>({
  strings: {},
  language: "en",
  setLanguage: () => {},
});

export function useStrings() {
  return useContext(StringsContext);
}
