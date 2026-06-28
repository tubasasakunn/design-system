// GitHub Pages 向けカタログ生成: sources/ -> dist/preview/index.html
// 自己完結した静的 HTML 1 枚（依存ゼロ）。テーマ/外観を切り替えながら
// 全カラートークンの色見本と全アイコンを見比べて「好み」を選ぶためのもの。
import { mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadThemes, loadIcons, themesToCss, allTokenKeys, kebab } from "./lib.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "dist/preview");
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const themes = loadThemes(join(ROOT, "sources/themes"));
const icons = loadIcons(join(ROOT, "sources/icons"));
const tokenKeys = allTokenKeys(themes);

const themeNames = Object.keys(themes);
// light を既定（先頭）にする。
const appearances = [...new Set(themeNames.flatMap((t) => Object.keys(themes[t])))].sort((a, b) =>
  a === "light" ? -1 : b === "light" ? 1 : a.localeCompare(b)
);

// 各トークンは CSS 変数で着色するので、テーマ切替で色見本も自動更新される。
const swatches = tokenKeys
  .map(
    (k) => `<div class="swatch">
      <span class="chip" style="background: var(--${kebab(k)})"></span>
      <code>${k}</code>
    </div>`
  )
  .join("\n");

// アイコンはインライン SVG。currentColor なので前景色に追従する。
const iconCells = icons
  .map((icon) => {
    const svg = readFileSync(icon.path, "utf8").trim();
    return `<figure class="icon"><div class="glyph">${svg}</div><figcaption>${icon.name}<small>${icon.category}</small></figcaption></figure>`;
  })
  .join("\n");

const themeOptions = themeNames.map((t) => `<option value="${t}">${t}</option>`).join("");
const appearanceButtons = appearances
  .map((a, i) => `<button data-appearance-btn="${a}"${i === 0 ? ' class="active"' : ""}>${a}</button>`)
  .join("");

const html = `<!doctype html>
<html lang="ja" data-theme="${themeNames[0]}" data-appearance="${appearances[0]}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>design-system カタログ</title>
<style>
${themesToCss(themes)}
* { box-sizing: border-box; }
body {
  margin: 0; font-family: system-ui, sans-serif;
  background: var(--color-bg-primary); color: var(--color-fg-primary);
  transition: background .15s, color .15s;
}
header {
  position: sticky; top: 0; z-index: 10;
  display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;
  padding: 1rem 1.5rem; background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-default);
}
header h1 { font-size: 1rem; margin: 0; margin-right: auto; }
select, button {
  font: inherit; color: var(--color-fg-primary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-default);
  border-radius: 8px; padding: .4rem .7rem; cursor: pointer;
}
button.active { background: var(--color-accent-default); color: var(--color-accent-fg); border-color: transparent; }
main { padding: 1.5rem; max-width: 1100px; margin: 0 auto; }
h2 { font-size: .8rem; text-transform: uppercase; letter-spacing: .05em; color: var(--color-fg-muted); margin: 2rem 0 1rem; }
.swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: .5rem; }
.swatch { display: flex; align-items: center; gap: .6rem; padding: .5rem; border: 1px solid var(--color-border-default); border-radius: 10px; background: var(--color-bg-secondary); }
.chip { width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--color-border-strong); flex: none; }
.swatch code { font-size: .8rem; color: var(--color-fg-secondary); }
.icons { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: .5rem; }
.icon { margin: 0; display: flex; flex-direction: column; align-items: center; gap: .5rem; padding: 1rem .5rem; border: 1px solid var(--color-border-default); border-radius: 12px; background: var(--color-bg-secondary); }
.glyph svg { width: 28px; height: 28px; color: var(--color-fg-primary); }
figcaption { font-size: .75rem; text-align: center; color: var(--color-fg-secondary); display: flex; flex-direction: column; gap: 2px; }
figcaption small { color: var(--color-fg-muted); }
</style>
</head>
<body>
<header>
  <h1>design-system カタログ</h1>
  <label>テーマ <select id="theme">${themeOptions}</select></label>
  <span id="appearance">${appearanceButtons}</span>
</header>
<main>
  <h2>カラートークン（${tokenKeys.length}）</h2>
  <div class="swatches">${swatches}</div>
  <h2>アイコン（${icons.length}）</h2>
  <div class="icons">${iconCells}</div>
</main>
<script>
  const root = document.documentElement;
  document.getElementById("theme").addEventListener("change", (e) => root.dataset.theme = e.target.value);
  document.querySelectorAll("[data-appearance-btn]").forEach((btn) =>
    btn.addEventListener("click", () => {
      root.dataset.appearance = btn.dataset.appearanceBtn;
      document.querySelectorAll("[data-appearance-btn]").forEach((b) => b.classList.toggle("active", b === btn));
    })
  );
</script>
</body>
</html>
`;

writeFileSync(join(OUT, "index.html"), html);
console.log(`✓ preview: ${themeNames.length} themes, ${icons.length} icons, ${tokenKeys.length} tokens → dist/preview/index.html`);
