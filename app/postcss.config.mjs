import tailwindcss from "tailwindcss";
import tailwindcssNesting from "tailwindcss/nesting/index.js";
import autoprefixer from "autoprefixer";
import discard from "postcss-discard";
import prefixSelector from "postcss-prefix-selector";

/** @type {import("postcss").Plugin} */
const prefix = prefixSelector({
  prefix: ".mx",
  transform: (prefix, selector, prefixedSelector, filePath, _rule) => {
    if (filePath.includes(".global.")) {
      return selector;
    }
    if (selector.includes(".theme-dark")) {
      return selector.replace(".theme-dark", `.theme-dark ${prefix}`);
    } else if (selector.includes(".mx-")) {
      return selector;
    } else {
      return prefixedSelector;
    }
  },
});

export default {
  plugins: [
    tailwindcss({ config: "./tailwind.config.cjs" }),
    tailwindcssNesting({}),
    autoprefixer({}),
    discard({
      rule: ["html", "body"],
    }),
    prefix,
  ],
};
