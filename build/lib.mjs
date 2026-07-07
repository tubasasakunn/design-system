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

// sources/patterns/<category>/<name>.html を集める。
// 第1階層 = category（water / motion-3d / scroll …）、ファイル名 = パターン名。
export function loadPatterns(root) {
  const patterns = [];
  for (const category of subdirs(root)) {
    const dir = join(root, category);
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".html")) continue;
      patterns.push({ category, name: file.replace(/\.html$/, ""), path: join(dir, file) });
    }
  }
  return patterns.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

// パターン HTML から <meta name="pattern-title/desc"> を抽出する。title 側は <title> にフォールバック。
export function patternMeta(html) {
  const meta = (n) => {
    const m =
      html.match(new RegExp(`<meta[^>]*name=["']pattern-${n}["'][^>]*content=["']([^"']*)["']`, "i")) ||
      html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']pattern-${n}["']`, "i"));
    return m?.[1];
  };
  return {
    title: meta("title") ?? html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? "",
    desc: meta("desc") ?? "",
  };
}

// パターン原本 HTML に、テーマ CSS 変数・テーマ同期スクリプト・戻る/外観トグルの
// 小さなオーバーレイを注入して配布形にする。build-preview と検証スクリプトで共用。
export function injectPatternChrome(html, themeCss, defaultTheme, { backHref = "../index.html" } = {}) {
  const head = `
<style id="ds-theme">${themeCss}</style>
<script id="ds-theme-sync">(() => { try {
  const q = new URLSearchParams(location.search);
  let ls = null; try { ls = window.localStorage; } catch {}
  const root = document.documentElement;
  root.dataset.theme = q.get("theme") || ls?.getItem("ds-theme") || root.dataset.theme || ${JSON.stringify(defaultTheme ?? "")} || "light";
  root.dataset.appearance = q.get("appearance") || ls?.getItem("ds-appearance") || root.dataset.appearance || "light";
} catch {} })()</script>`;
  const chrome = `
<div id="ds-chrome" style="position:fixed;inset:auto 0 0 0;top:0;height:0;z-index:2147483000;pointer-events:none;font-family:system-ui,sans-serif;">
  <a href="${backHref}" style="pointer-events:auto;position:fixed;top:14px;left:14px;display:inline-block;padding:.45rem .85rem;border-radius:999px;font-size:.8rem;text-decoration:none;color:var(--color-fg-secondary);background:color-mix(in srgb, var(--color-bg-elevated) 82%, transparent);border:1px solid var(--color-border-default);backdrop-filter:blur(8px);box-shadow:0 2px 6px rgba(40,35,25,.08);">← 一覧</a>
  <button id="ds-appearance-toggle" type="button" style="pointer-events:auto;position:fixed;top:14px;right:14px;padding:.45rem .85rem;border-radius:999px;font:inherit;font-size:.8rem;cursor:pointer;color:var(--color-fg-secondary);background:color-mix(in srgb, var(--color-bg-elevated) 82%, transparent);border:1px solid var(--color-border-default);backdrop-filter:blur(8px);box-shadow:0 2px 6px rgba(40,35,25,.08);"></button>
</div>
<script>(() => { try {
  const root = document.documentElement;
  const btn = document.getElementById("ds-appearance-toggle");
  const label = () => { btn.textContent = root.dataset.appearance === "dark" ? "☾ dark" : "☀ light"; };
  btn.addEventListener("click", () => {
    root.dataset.appearance = root.dataset.appearance === "dark" ? "light" : "dark";
    try { localStorage.setItem("ds-appearance", root.dataset.appearance); } catch {}
    label();
  });
  label();
} catch {} })()</script>`;
  let out = html;
  out = /<head[^>]*>/i.test(out) ? out.replace(/<head[^>]*>/i, (m) => m + head) : head + out;
  out = /<\/body>/i.test(out) ? out.replace(/<\/body>/i, chrome + "\n</body>") : out + chrome;
  return out;
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
