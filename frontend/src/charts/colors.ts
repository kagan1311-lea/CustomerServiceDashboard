// Validated categorical palette (fixed order — never cycled or reassigned
// per series identity) from the dataviz skill's reference palette.
export const CATEGORICAL = [
  "#2a78d6", // 1 blue
  "#eb6834", // 2 orange
  "#1baf7a", // 3 aqua
  "#eda100", // 4 yellow
  "#e87ba4", // 5 magenta
  "#008300", // 6 green
  "#4a3aa7", // 7 violet
  "#e34948", // 8 red
] as const;

// Sequential blue ramp, light -> dark, for single-hue magnitude encoding.
export const SEQUENTIAL_BLUE = ["#cde2fb", "#86b6ef", "#3987e5", "#1c5cab"] as const;

export const CHART_CHROME = {
  gridline: "#e1e0d9",
  baseline: "#c3c2b7",
  mutedText: "#898781",
  secondaryText: "#52514e",
  surface: "#fcfcfb",
} as const;
