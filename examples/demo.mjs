import { compileTheme, contrastRatio } from "../src/tokens.mjs";
import { demoTokens } from "./sample.mjs";

const { resolved, css } = compileTheme(demoTokens);
console.log("Resolved tokens:", JSON.stringify(resolved, null, 2));
console.log("Text/surface contrast:", contrastRatio(resolved["color.text"], resolved["color.surface"]));
console.log("Generated CSS:\n" + css);
