// Enforces authorship-protocol rule 9 (logical properties) and bans `vw`.
const physicalProperties = [
  /^(margin|padding|scroll-margin|scroll-padding)-(top|right|bottom|left)$/,
  /^border-(top|right|bottom|left)(-(width|style|color))?$/,
  /^border-(top|bottom)-(left|right)-radius$/,
  /^(min-|max-)?(width|height)$/,
  /^overflow-(x|y)$/,
  /^overscroll-behavior-(x|y)$/,
  /^contain-intrinsic-(width|height)$/,
  "top",
  "right",
  "bottom",
  "left",
  "float",
  "clear",
];

export default {
  extends: ["stylelint-config-standard"],
  overrides: [{ files: ["**/*.astro"], customSyntax: "postcss-html" }],
  rules: {
    "property-disallowed-list": [
      physicalProperties,
      { message: "Use the logical property (authorship protocol rule 9)." },
    ],
    "declaration-property-value-disallowed-list": [
      {
        "text-align": ["left", "right"],
        float: ["left", "right"],
        clear: ["left", "right"],
        resize: ["horizontal", "vertical"],
      },
      { message: "Use the logical value (authorship protocol rule 9)." },
    ],
    "unit-disallowed-list": [["vw"], { message: "vw units are not allowed." }],
  },
};
