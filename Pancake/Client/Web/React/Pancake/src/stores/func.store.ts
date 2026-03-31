import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Func = 'latest' | '' | '' | ''

export type FuncStore = {
  func: string;
  setFunc: (func: string) => void;
};