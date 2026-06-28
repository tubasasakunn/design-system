// Swift(iOS/macOS)向け生成: sources/ -> dist/swift/
//   Colors/<Theme>.xcassets : テーマ別カラーカタログ。light/dark を 1 つの colorset に統合。
//   Icons.xcassets          : SVG を imageset 化 (ベクター保持 + テンプレート描画)。style で名前空間化。
//   DesignSystem.swift      : Image/Color へアクセスする型付き API (DSIcon.<Style>, DSTheme)。
import { mkdirSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadThemes, loadIcons, kebab, camel, pascal, parseHex } from "./lib.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "dist/swift");
rmSync(OUT, { recursive: true, force: true });

const INFO = { author: "design-system", version: 1 };
const writeJSON = (p, o) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(o, null, 2)); };
const hex2 = (n) => `0x${n.toString(16).padStart(2, "0").toUpperCase()}`;
const colorComponents = (v) => {
  const { r, g, b, a } = parseHex(v);
  return { "color-space": "srgb", components: { red: hex2(r), green: hex2(g), blue: hex2(b), alpha: a.toFixed(3) } };
};

// --- Themes -> テーマ別 .xcassets ---
const themes = loadThemes(join(ROOT, "sources/themes"));
for (const [theme, appearances] of Object.entries(themes)) {
  const catalog = join(OUT, "Colors", `${pascal(theme)}.xcassets`);
  writeJSON(join(catalog, "Contents.json"), { info: INFO });
  const keys = new Set(Object.values(appearances).flatMap((t) => Object.keys(t)));
  for (const key of keys) {
    const colors = [];
    if (appearances.light?.[key]) colors.push({ idiom: "universal", color: colorComponents(appearances.light[key]) });
    if (appearances.dark?.[key])
      colors.push({ idiom: "universal", appearances: [{ appearance: "luminosity", value: "dark" }], color: colorComponents(appearances.dark[key]) });
    writeJSON(join(catalog, `${kebab(key)}.colorset`, "Contents.json"), { colors, info: INFO });
  }
}

// --- Icons -> Icons.xcassets（style を名前空間フォルダにする）---
const icons = loadIcons(join(ROOT, "sources/icons"));
const iconCatalog = join(OUT, "Icons.xcassets");
writeJSON(join(iconCatalog, "Contents.json"), { info: INFO });
const styles = [...new Set(icons.map((i) => i.style))].sort();
for (const style of styles) {
  // provides-namespace により asset 名が "<style>/<name>" になる。
  writeJSON(join(iconCatalog, style, "Contents.json"), { info: INFO, properties: { "provides-namespace": true } });
}
for (const icon of icons) {
  const setDir = join(iconCatalog, icon.style, `${icon.name}.imageset`);
  mkdirSync(setDir, { recursive: true });
  copyFileSync(icon.path, join(setDir, `${icon.name}.svg`));
  writeJSON(join(setDir, "Contents.json"), {
    images: [{ filename: `${icon.name}.svg`, idiom: "universal" }],
    info: INFO,
    properties: { "preserves-vector-representation": true, "template-rendering-intent": "template" },
  });
}

// --- 型付き Swift API ---
// スタイルごとにネストした enum を作る。例: DSIcon.Rounded.arrowLeft.image
// case 名は予約語(default など)と衝突しうるのでバッククォートで囲む。
const styleEnums = styles
  .map((style) => {
    const names = [...new Set(icons.filter((i) => i.style === style).map((i) => i.name))].sort();
    const cases = names.map((n) => `        case \`${camel(n)}\` = "${n}"`).join("\n");
    return `    /// ${style} スタイルのアイコン。asset 名は "${style}/<name>"。
    public enum ${pascal(style)}: String, CaseIterable {
${cases}
        public var image: Image { Image("${style}/\\(rawValue)", bundle: .module) }
    }`;
  })
  .join("\n\n");
const themeCases = Object.keys(themes).map((t) => `    case \`${camel(t)}\` = "${pascal(t)}"`).join("\n");
const swift = `// AUTO-GENERATED — 直接編集しないでください
import SwiftUI

/// アイコン。スタイル(丸み系/カクカク系…)ごとに型を分けている。
/// Icons.xcassets はテンプレート描画なので foregroundStyle で着色できる。
public enum DSIcon {
${styleEnums}
}

/// カラーテーマ。各 case が dist/swift/Colors/<Theme>.xcassets に対応する。
public enum DSTheme: String, CaseIterable {
${themeCases}
}
`;
writeFileSync(join(OUT, "DesignSystem.swift"), swift);

console.log(`✓ swift: ${Object.keys(themes).length} themes, ${icons.length} icons (${styles.length} styles) → dist/swift`);
