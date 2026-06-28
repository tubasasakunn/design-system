#!/usr/bin/env node
// color-theme スキル付属: テーマJSONの WCAG 2.x コントラストを検証する（依存ゼロ・Node標準のみ）。
//
// 使い方:
//   node .claude/skills/color-theme/scripts/check-contrast.mjs sources/themes/cream
//   node .claude/skills/color-theme/scripts/check-contrast.mjs sources/themes/*   # 全テーマ
//   引数なし: sources/themes/ 配下の全テーマを検査
//
// 何を見るか: このリポジトリのセマンティックトークン(color.bg/fg/accent/border/status.*)について、
//   用途別の目標コントラスト(本文4.5:1 / 補助4.5:1 / 非テキストUI 3:1 等)を満たすか。
// 閾値の根拠は references/accessibility.md（WCAG 2.2 §1.4.3 / 1.4.11）。
// 注: 数値はあくまで WCAG 2 式。淡い面・ダークの文字は APCA でも別途確認すると堅い(同 §3)。

import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";

// ---- 色計算（references/accessibility.md §1.1 の式） -------------------------
function parseHex(hex) {
  let h = String(hex).replace("#", "").trim();
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  if (h.length === 4) h = [...h].map((c) => c + c).join(""); // #rgba
  if (h.length === 6) h += "ff";
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: parseInt(h.slice(6, 8), 16) / 255,
  };
}
const lin = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
function luminance(hex) {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrast(fg, bg) {
  const L1 = luminance(fg), L2 = luminance(bg);
  const [hi, lo] = L1 >= L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

// ---- JSON 平坦化（$ メタキーは無視） ----------------------------------------
function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("$")) continue;
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

// ---- 検査するペア（このリポジトリのトークンモデル前提） ----------------------
// target: 目標コントラスト, kind: text=本文系(AA 4.5) / large=大文字(3.0) / nontext=UI/境界(3.0)
// optional: true のトークンが欠けていてもエラーにしない（warning扱い）
const CHECKS = [
  // 本文・テキスト on 背景
  { fg: "color.fg.primary",   bg: "color.bg.primary",  target: 4.5, kind: "text",  label: "本文 fg.primary / bg.primary" },
  { fg: "color.fg.primary",   bg: "color.bg.secondary", target: 4.5, kind: "text", label: "本文 fg.primary / bg.secondary" },
  { fg: "color.fg.primary",   bg: "color.bg.elevated", target: 4.5, kind: "text",  label: "本文 fg.primary / bg.elevated", optional: true },
  { fg: "color.fg.secondary", bg: "color.bg.primary",  target: 4.5, kind: "text",  label: "補助 fg.secondary / bg.primary" },
  { fg: "color.fg.muted",     bg: "color.bg.primary",  target: 4.5, kind: "text",  label: "補助 fg.muted / bg.primary", note: "mutedは小さい補助文字に使うなら4.5、装飾なら3.0でも可" },
  // アクセント面の上の文字（on-color）
  { fg: "color.accent.fg",    bg: "color.accent.default", target: 4.5, kind: "text", label: "on-accent accent.fg / accent.default" },
  { fg: "color.accent.fg",    bg: "color.accent.hover",   target: 4.5, kind: "text", label: "on-accent accent.fg / accent.hover", optional: true },
  // アクセントを「文字/線」として地の上で使う場合（DESIGN.md の accent.strong 検討に対応）
  { fg: "color.accent.strong", bg: "color.bg.primary", target: 4.5, kind: "text", label: "accent.strong(文字/線) / bg.primary", optional: true },
  // 非テキスト（UI/境界/フォーカス）: WCAG 1.4.11 = 3:1
  { fg: "color.border.strong", bg: "color.bg.primary", target: 3.0, kind: "nontext", label: "border.strong / bg.primary", optional: true,
    note: "border.default は意図的に控えめ(3:1未満)で良い。strongや機能的な枠・フォーカスは3:1" },
  // ステータス色を「文字/アイコン」として使うなら 4.5、塗り面なら on 色側で確認
  { fg: "color.status.success", bg: "color.bg.primary", target: 3.0, kind: "nontext", label: "status.success / bg.primary", optional: true,
    note: "テキストとして使うなら4.5。アイコン/塗りなら3.0。色のみで意味を伝えない(1.4.1)" },
  { fg: "color.status.warning", bg: "color.bg.primary", target: 3.0, kind: "nontext", label: "status.warning / bg.primary", optional: true },
  { fg: "color.status.error",   bg: "color.bg.primary", target: 3.0, kind: "nontext", label: "status.error / bg.primary", optional: true },
];

const isDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };

function loadAppearances(themeDir) {
  const out = {};
  for (const f of readdirSync(themeDir)) {
    if (!f.endsWith(".json")) continue;
    out[f.replace(/\.json$/, "")] = flatten(JSON.parse(readFileSync(join(themeDir, f), "utf8")));
  }
  return out;
}

function fmt(n) { return n.toFixed(2).padStart(5); }

let hadFailure = false;

function checkTheme(themeDir) {
  const theme = basename(themeDir);
  const appearances = loadAppearances(themeDir);
  if (Object.keys(appearances).length === 0) {
    console.log(`\n⚠ ${theme}: JSON が見つかりません (${themeDir})`);
    return;
  }
  console.log(`\n━━ テーマ: ${theme} ━━`);
  for (const [appearance, tokens] of Object.entries(appearances)) {
    console.log(`\n  [${appearance}]`);
    for (const c of CHECKS) {
      const fg = tokens[c.fg], bg = tokens[c.bg];
      if (fg == null || bg == null) {
        if (!c.optional) {
          hadFailure = true;
          console.log(`    ✗ MISSING  ${c.label}  (${fg == null ? c.fg : c.bg} が未定義)`);
        }
        continue;
      }
      const ratio = contrast(fg, bg);
      const pass = ratio >= c.target;
      const mark = pass ? "✓" : "✗";
      if (!pass && !c.optional) hadFailure = true; // optional の不足は警告のみ（exit に影響しない）
      const flag = pass ? "" : (c.optional ? "  (optional/warn)" : "  ← FAIL");
      console.log(`    ${mark} ${fmt(ratio)}:1  (目標 ${c.target}:1)  ${c.label}${flag}`);
      if (!pass && c.note) console.log(`        ↳ ${c.note}`);
    }
  }
}

// ---- エントリポイント --------------------------------------------------------
let args = process.argv.slice(2);
if (args.length === 0) {
  const root = "sources/themes";
  if (!isDir(root)) {
    console.error(`使い方: node check-contrast.mjs <themeDir...>\n  例: node ${process.argv[1]} sources/themes/cream`);
    process.exit(2);
  }
  args = readdirSync(root).map((d) => join(root, d)).filter(isDir);
}
args.filter(isDir).forEach(checkTheme);

console.log(
  hadFailure
    ? "\n結果: 必須ペアに未達あり（✗ ← FAIL / MISSING）。references/accessibility.md を参照して調整。"
    : "\n結果: 必須ペアはすべて目標を満たしています（optional の warn は用途次第で判断）。"
);
process.exit(hadFailure ? 1 : 0);
