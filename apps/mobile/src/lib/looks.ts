import { Area } from "@keystone/core";
export type Look = "a" | "b" | "c";
export const lookOf = (value: unknown): Look =>
  value === "b" || value === "c" ? value : "a";
export const lookNames = { a: "Aurora Night", b: "Candy Pop", c: "Paper Zen" };
interface Appearance {
  name: string;
  bg: string;
  card: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  accentInk: string;
  gradient: readonly [string, string, string];
  display: string;
  radius: number;
  area: Record<Area, string>;
  tint: Record<Area, string>;
}
export const looks: Record<Look, Appearance> = {
  a: {
    name: lookNames.a,
    bg: "#101116",
    card: "#202128c9",
    ink: "#f3f3f6",
    muted: "#9b9cae",
    line: "#ffffff14",
    accent: "#b6a1ff",
    accentInk: "#17131f",
    gradient: ["#14151e", "#12131a", "#101116"],
    display: "System",
    radius: 12,
    area: {
      academics: "#5aabff",
      career: "#f076d9",
      skills: "#bded78",
      health: "#ffa36c",
      life: "#af96ff",
      other: "#b4b5ca",
    },
    tint: {
      academics: "#20334d",
      career: "#40243c",
      skills: "#2d3823",
      health: "#423024",
      life: "#322a46",
      other: "#2c2d38",
    },
  },
  b: {
    name: lookNames.b,
    bg: "#fff2df",
    card: "#fffcf4dc",
    ink: "#342443",
    muted: "#7c657e",
    line: "#5532541c",
    accent: "#6640c7",
    accentInk: "#ffffff",
    gradient: ["#fbe4f1", "#fff1d4", "#e3e9ff"],
    display: "Nunito_900Black",
    radius: 24,
    area: {
      academics: "#3e57be",
      career: "#ab3d70",
      skills: "#426b37",
      health: "#a44b26",
      life: "#7445a7",
      other: "#6a5b7b",
    },
    tint: {
      academics: "#dce5ff",
      career: "#ffd9ea",
      skills: "#e5f3bd",
      health: "#ffdfbc",
      life: "#eadbff",
      other: "#e9e4ef",
    },
  },
  c: {
    name: lookNames.c,
    bg: "#f5f1e8",
    card: "#fffdf88c",
    ink: "#2c342e",
    muted: "#73796f",
    line: "#39463820",
    accent: "#47684e",
    accentInk: "#fffdf8",
    gradient: ["#f5f1e8", "#f4f0e7", "#f5f1e8"],
    display: "Fraunces_400Regular",
    radius: 4,
    area: {
      academics: "#5978a0",
      career: "#a26776",
      skills: "#71834d",
      health: "#bc8659",
      life: "#8c7aa5",
      other: "#84867e",
    },
    tint: {
      academics: "#e9edf0",
      career: "#f1e7e7",
      skills: "#e8ecdf",
      health: "#f2e9df",
      life: "#ece8ef",
      other: "#ecece5",
    },
  },
};
