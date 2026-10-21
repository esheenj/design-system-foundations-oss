// Original offline-first token utilities. No external dependencies.
export class TokenError extends Error {
  constructor(message) {
    super(message);
    this.name = "TokenError";
  }
}

const ALIAS = /^\{([a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*)\}$/;
const NAME = /^[a-z][a-z0-9-]*$/;
const SAFE_VALUE = /^(?:#[0-9a-fA-F]{6}|(?:0|[1-9]\d*)(?:\.\d+)?(?:px|rem|em|%)|(?:0|[1-9]\d*))$/;

export function flattenTokens(input, prefix = "") {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TokenError("Tokens must be a non-empty plain object.");
  }
  const output = {};
  for (const [key, value] of Object.entries(input)) {
    if (!NAME.test(key)) throw new TokenError(`Invalid token name: ${key}`);
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(output, flattenTokens(value, path));
    } else if (typeof value === "string" || typeof value === "number") {
      output[path] = String(value);
    } else {
      throw new TokenError(`Invalid value at ${path}`);
    }
  }
  return output;
}

export function compileTheme(tokens) {
  const flat = flattenTokens(tokens);
  if (!Object.keys(flat).length) throw new TokenError("Provide at least one token.");
  const resolved = {};
  const resolve = (path, visiting = []) => {
    if (!(path in flat)) throw new TokenError(`Unknown token reference: ${path}`);
    if (visiting.includes(path)) throw new TokenError(`Circular token reference: ${[...visiting, path].join(" -> ")}`);
    const value = flat[path];
    const alias = value.match(ALIAS);
    const result = alias ? resolve(alias[1], [...visiting, path]) : value;
    if (!SAFE_VALUE.test(result)) throw new TokenError(`Unsafe or unsupported token value at ${path}`);
    return result;
  };
  for (const path of Object.keys(flat).sort()) resolved[path] = resolve(path);
  const css = ":root {\n" + Object.entries(resolved)
    .map(([path, value]) => `  --${path.replaceAll(".", "-")}: ${value};`)
    .join("\n") + "\n}\n";
  return { resolved, css };
}

function luminance(hex) {
  if (typeof hex !== "string" || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
    throw new TokenError("Contrast requires a six-digit hex color.");
  }
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = channels.map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function contrastRatio(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100;
}
