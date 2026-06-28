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

// "arrow-left" -> "arrowLeft" / "ocean" -> "Ocean" / "volume-2" -> "volume2"
// ハイフン区切りを全て除去（数字後続も含む）。Swift の enum case 識別子にハイフンは使えないため。
export const camel = (s) => s.replace(/-+([a-z0-9])/g, (_, c) => c.toUpperCase());
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

const isDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };
const subdirs = (root) => (isDir(root) ? readdirSync(root).filter((e) => isDir(join(root, e))) : []);

// sources/themes/<theme>/<appearance>.json を
// { theme: { appearance: { "color.bg.primary": "#fff", ... } } } で読み込む。
export function loadThemes(root) {
  const themes = {};
  for (const theme of subdirs(root)) {
    const dir = join(root, theme);
    themes[theme] = {};
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      const appearance = file.replace(/\.json$/, "");
      themes[theme][appearance] = flatten(JSON.parse(readFileSync(join(dir, file), "utf8")));
    }
  }
  return themes;
}

// :root の既定値にするテーマ名を返す。いずれかの外観 JSON に "$default": true を持つテーマ。
// 見つからなければ null（その場合どのテーマも :root を持たない）。
export function findDefaultTheme(root) {
  for (const theme of subdirs(root)) {
    const dir = join(root, theme);
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      const json = JSON.parse(readFileSync(join(dir, file), "utf8"));
      if (json.$default === true) return theme;
    }
  }
  return null;
}

// テーマ群を CSS 変数定義に変換する。defaultTheme の light は :root の既定値にもなる。
// build-web と build-preview で同じ出力を使うため共通化している。
export function themesToCss(themes, defaultTheme = null) {
  let css = "";
  for (const [theme, appearances] of Object.entries(themes)) {
    for (const [appearance, tokens] of Object.entries(appearances)) {
      const isDefault = theme === defaultTheme && appearance === "light";
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

// sources/icons/<style>/<category>/<name>.svg を集める。
// 第1階層 = style（丸み系 rounded / カクカク系 sharp …）、第2階層 = category、ファイル名 = name。
// name はスタイル内で一意。スタイルをまたいで同名 SVG（別スタイルの同じ意味のアイコン）を持てる。
export function loadIcons(root) {
  const icons = [];
  for (const style of subdirs(root)) {
    for (const category of subdirs(join(root, style))) {
      const dir = join(root, style, category);
      for (const file of readdirSync(dir)) {
        if (!file.endsWith(".svg")) continue;
        icons.push({ style, category, name: file.replace(/\.svg$/, ""), path: join(dir, file) });
      }
    }
  }
  return icons.sort((a, b) => a.style.localeCompare(b.style) || a.name.localeCompare(b.name));
}

// 利用可能なアイコンスタイル一覧（ソート済み）。
export function iconStyles(root) {
  return subdirs(root).sort();
}

// 既定のアイコンスタイル。慣例として "rounded"。無ければ先頭のスタイル、何も無ければ null。
export function defaultIconStyle(root) {
  const styles = iconStyles(root);
  return styles.includes("rounded") ? "rounded" : styles[0] ?? null;
}
