// build スクリプト共通のユーティリティ。依存ゼロ（Node 標準モジュールのみ）。
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";

// ネストした JSON を { "color.bg.primary": "#fff" } のドット記法に平坦化する。
// "$appearance" などの $ で始まるメタキーは無視する。
export function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("$")) continue;
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

// "color.bg.primary" -> "color-bg-primary"
export const kebab = (s) => s.replace(/\./g, "-");

// "arrow-left" -> "arrowLeft" / "ocean" -> "Ocean"
export const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
export const pascal = (s) => { const c = camel(s); return c.charAt(0).toUpperCase() + c.slice(1); };

// #rgb / #rrggbb / #rrggbbaa -> { r, g, b (0-255), a (0-1) }
export function parseHex(hex) {
  let h = String(hex).replace("#", "").trim();
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  if (h.length === 6) h += "ff";
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: parseInt(h.slice(6, 8), 16) / 255,
  };
}

// sources/themes/<theme>/<appearance>.json を
// { theme: { appearance: { "color.bg.primary": "#fff", ... } } } で読み込む。
export function loadThemes(root) {
  const themes = {};
  for (const theme of readdirSync(root)) {
    const dir = join(root, theme);
    if (!statSync(dir).isDirectory()) continue;
    themes[theme] = {};
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      const appearance = file.replace(/\.json$/, "");
      themes[theme][appearance] = flatten(JSON.parse(readFileSync(join(dir, file), "utf8")));
    }
  }
  return themes;
}

// テーマ群を CSS 変数定義に変換する。default/light は :root の既定値にもなる。
// build-web と build-preview で同じ出力を使うため共通化している。
export function themesToCss(themes) {
  let css = "";
  for (const [theme, appearances] of Object.entries(themes)) {
    for (const [appearance, tokens] of Object.entries(appearances)) {
      const isDefault = theme === "default" && appearance === "light";
      const scoped = `[data-theme="${theme}"][data-appearance="${appearance}"]`;
      const selector = isDefault ? `:root,\n${scoped}` : scoped;
      const decls = Object.entries(tokens).map(([k, v]) => `  --${kebab(k)}: ${v};`).join("\n");
      css += `\n${selector} {\n${decls}\n}\n`;
    }
  }
  return css;
}

// 全テーマ・全外観を通じたトークンキーの和集合（ソート済み）。
export function allTokenKeys(themes) {
  const keys = new Set();
  for (const appearances of Object.values(themes))
    for (const tokens of Object.values(appearances)) for (const k of Object.keys(tokens)) keys.add(k);
  return [...keys].sort();
}

// sources/icons 配下の .svg を再帰的に集める。直近の親フォルダ名を category とする。
export function loadIcons(root) {
  const icons = [];
  const walk = (dir, category) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full, entry);
      else if (entry.endsWith(".svg")) icons.push({ name: entry.replace(/\.svg$/, ""), category, path: full });
    }
  };
  walk(root, "");
  return icons.sort((a, b) => a.name.localeCompare(b.name));
}
