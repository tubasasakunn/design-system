// GitHub Pages 向けカタログ生成: sources/ -> dist/preview/index.html
// 自己完結した静的 HTML 1 枚（依存ゼロ）。テーマ/外観を切り替えながら
// 全カラートークンの色見本と全アイコンを見比べて「好み」を選ぶためのもの。
import { mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadThemes, loadIcons, themesToCss, allTokenKeys, kebab, findDefaultTheme, loadPatterns, patternMeta, injectPatternChrome } from "./lib.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "dist/preview");
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const themes = loadThemes(join(ROOT, "sources/themes"));
const defaultTheme = findDefaultTheme(join(ROOT, "sources/themes"));
const icons = loadIcons(join(ROOT, "sources/icons"));
const tokenKeys = allTokenKeys(themes);
const patterns = loadPatterns(join(ROOT, "sources/patterns"));

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
// スタイル(丸み系/カクカク系…)ごとにセクション分けして見比べられるようにする。
const styles = [...new Set(icons.map((i) => i.style))].sort();
const iconSection = styles
  .map((style) => {
    const cells = icons
      .filter((i) => i.style === style)
      .map((icon) => {
        const svg = readFileSync(icon.path, "utf8").trim();
        return `<figure class="icon"><div class="glyph">${svg}</div><figcaption>${icon.name}<small>${icon.category}</small></figcaption></figure>`;
      })
      .join("\n");
    const count = icons.filter((i) => i.style === style).length;
    return `<h3 class="style-h">${style} <span>(${count})</span></h3><div class="icons">${cells}</div>`;
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
${themesToCss(themes, defaultTheme)}
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
.patterns-link { font-size: .85rem; color: var(--color-fg-secondary); text-decoration: none; padding: .4rem .7rem; border-radius: 999px; border: 1px solid var(--color-border-default); background: var(--color-bg-secondary); }
.patterns-link:hover { color: var(--color-fg-primary); border-color: var(--color-border-strong); }
main { padding: 1.5rem; max-width: 1100px; margin: 0 auto; }
h2 { font-size: .8rem; text-transform: uppercase; letter-spacing: .05em; color: var(--color-fg-muted); margin: 2rem 0 1rem; }
.style-h { font-size: .8rem; margin: 1.2rem 0 .6rem; color: var(--color-fg-secondary); }
.style-h span { color: var(--color-fg-muted); font-weight: normal; }
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
  ${patterns.length ? `<a class="patterns-link" href="patterns/">表現パターン (${patterns.length}) →</a>` : ""}
  <label>テーマ <select id="theme">${themeOptions}</select></label>
  <span id="appearance">${appearanceButtons}</span>
</header>
<main>
  <h2>カラートークン（${tokenKeys.length}）</h2>
  <div class="swatches">${swatches}</div>
  <h2>アイコン（${icons.length} / ${styles.length} スタイル）</h2>
  ${iconSection}
</main>
<script>
  const root = document.documentElement;
  const save = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const themeSel = document.getElementById("theme");
  const syncAppearanceButtons = () =>
    document.querySelectorAll("[data-appearance-btn]").forEach((b) => b.classList.toggle("active", b.dataset.appearanceBtn === root.dataset.appearance));
  try {
    const t = localStorage.getItem("ds-theme"), a = localStorage.getItem("ds-appearance");
    if (t && [...themeSel.options].some((o) => o.value === t)) { root.dataset.theme = t; themeSel.value = t; }
    if (a) { root.dataset.appearance = a; syncAppearanceButtons(); }
  } catch {}
  themeSel.addEventListener("change", (e) => { root.dataset.theme = e.target.value; save("ds-theme", e.target.value); });
  document.querySelectorAll("[data-appearance-btn]").forEach((btn) =>
    btn.addEventListener("click", () => {
      root.dataset.appearance = btn.dataset.appearanceBtn;
      save("ds-appearance", btn.dataset.appearanceBtn);
      syncAppearanceButtons();
    })
  );
</script>
</body>
</html>
`;

writeFileSync(join(OUT, "index.html"), html);

// ---- 表現パターン (sources/patterns/) → dist/preview/patterns/ ----
// 各パターンは自己完結 HTML。テーマ CSS 変数とテーマ同期スクリプトを注入して配布する。
const CATEGORY_LABELS = {
  water: "水と液体",
  "motion-3d": "3D と奥行き",
  scroll: "スクロール演出",
  softbody: "やわらかさ・弾性",
  particles: "パーティクル",
  typography: "タイポグラフィ",
  light: "光と影",
  generative: "ジェネラティブ",
  interaction: "インタラクション",
  transitions: "トランジション",
};

if (patterns.length) {
  const themeCss = themesToCss(themes, defaultTheme);
  const entries = patterns.map((p) => {
    const src = readFileSync(p.path, "utf8");
    const meta = patternMeta(src);
    const outDir = join(OUT, "patterns", p.category);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, `${p.name}.html`), injectPatternChrome(src, themeCss, defaultTheme, { backHref: "../index.html" }));
    return { ...p, ...meta };
  });

  const categories = [...new Set(entries.map((e) => e.category))].sort();
  const sections = categories
    .map((cat) => {
      const items = entries.filter((e) => e.category === cat);
      const cards = items
        .map(
          (e) => `<a class="card" href="${e.category}/${e.name}.html">
        <span class="card-title">${e.title || e.name}</span>
        <span class="card-desc">${e.desc}</span>
        <span class="card-name"><code>${e.category}/${e.name}</code></span>
      </a>`
        )
        .join("\n");
      return `<section><h2>${CATEGORY_LABELS[cat] ?? cat} <span>(${items.length})</span></h2><div class="cards">${cards}</div></section>`;
    })
    .join("\n");

  const galleryHtml = `<!doctype html>
<html lang="ja" data-theme="${defaultTheme ?? themeNames[0]}" data-appearance="${appearances[0]}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>表現パターン — design-system</title>
<style>
${themeCss}
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
header a.back { font-size: .85rem; color: var(--color-fg-secondary); text-decoration: none; }
select, button {
  font: inherit; color: var(--color-fg-primary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-default);
  border-radius: 8px; padding: .4rem .7rem; cursor: pointer;
}
button.active { background: var(--color-accent-default); color: var(--color-accent-fg); border-color: transparent; }
main { padding: 1.5rem; max-width: 1100px; margin: 0 auto; }
h2 { font-size: .8rem; text-transform: uppercase; letter-spacing: .05em; color: var(--color-fg-muted); margin: 2.2rem 0 1rem; }
h2 span { font-weight: normal; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: .7rem; }
.card {
  display: flex; flex-direction: column; gap: .45rem; padding: 1rem 1.1rem;
  border: 1px solid var(--color-border-default); border-radius: 20px;
  background: var(--color-bg-secondary); text-decoration: none; color: inherit;
  transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s, border-color .18s;
}
.card:hover { transform: translateY(-3px); box-shadow: 0 6px 18px rgba(40,35,25,.1); border-color: var(--color-accent-default); }
.card-title { font-size: .95rem; font-weight: 600; }
.card-desc { font-size: .78rem; color: var(--color-fg-secondary); line-height: 1.5; }
.card-name code { font-size: .7rem; color: var(--color-fg-muted); }
</style>
</head>
<body>
<header>
  <h1>表現パターン（${entries.length}）</h1>
  <a class="back" href="../index.html">← カタログ</a>
  <label>テーマ <select id="theme">${themeOptions}</select></label>
  <span id="appearance">${appearanceButtons}</span>
</header>
<main>
${sections}
</main>
<script>
  const root = document.documentElement;
  const save = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const themeSel = document.getElementById("theme");
  const syncAppearanceButtons = () =>
    document.querySelectorAll("[data-appearance-btn]").forEach((b) => b.classList.toggle("active", b.dataset.appearanceBtn === root.dataset.appearance));
  try {
    const t = localStorage.getItem("ds-theme"), a = localStorage.getItem("ds-appearance");
    if (t && [...themeSel.options].some((o) => o.value === t)) { root.dataset.theme = t; themeSel.value = t; }
    if (a) { root.dataset.appearance = a; syncAppearanceButtons(); }
  } catch {}
  themeSel.addEventListener("change", (e) => { root.dataset.theme = e.target.value; save("ds-theme", e.target.value); });
  document.querySelectorAll("[data-appearance-btn]").forEach((btn) =>
    btn.addEventListener("click", () => {
      root.dataset.appearance = btn.dataset.appearanceBtn;
      save("ds-appearance", btn.dataset.appearanceBtn);
      syncAppearanceButtons();
    })
  );
</script>
</body>
</html>
`;
  writeFileSync(join(OUT, "patterns", "index.html"), galleryHtml);
}

console.log(
  `✓ preview: ${themeNames.length} themes, ${icons.length} icons, ${tokenKeys.length} tokens, ${patterns.length} patterns → dist/preview/`
);
