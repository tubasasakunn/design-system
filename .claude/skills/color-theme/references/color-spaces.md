# カラーモデル / 色空間 リファレンス

> color-theme スキルの参考資料。最終確認: 2026-06 時点のブラウザ/ツール状況。
> このリポジトリへの含意は末尾「§5 このデザインシステムへの適用」を参照。

## 0. 前提: 「カラーモデル」と「色空間」

- **カラーモデル**: 色を数値の組で表す数学的方式（RGB, HSL, CMYK, Lab…）。
- **色空間 (color space)**: カラーモデル + その数値を実際の物理色に結びつける定義（原色・白色点・ガンマ）。「RGB」はモデル、「sRGB」「Display P3」は色空間。
- **デバイス依存**（sRGB, P3, CMYK: 同じ数値でも機器で見え方が変わりうる）と **デバイス非依存 / 知覚ベース**（XYZ, Lab, LCH, OKLab, OKLCH, HCT: CIE測色 or 知覚を基準に絶対定義）を区別するのが実務上の最重要ポイント。

---

## 1. 各カラーモデル / 色空間

### 1.1 RGB / sRGB（加法混色・ガンマ・線形RGB）

- **加法混色**: R+G+B を光として加算。`0,0,0`=黒、`255,255,255`=白。ディスプレイの基本。
- **sRGB**: Web・一般ディスプレイの事実上の既定。白色点 **D65**。
- **ガンマ（伝達関数）が核心**。`#808080`（中間グレー）は物理的な光量の50%ではない。sRGB値は**非線形にエンコード**されている（暗部にビットを多く割く）。
  - sRGB→線形: `C/12.92 (C ≤ 0.04045)`、`((C+0.055)/1.055)^2.4 (それ以外)`。実効ガンマ ≈ **2.2**。
- **線形RGB (linear-light)**: ガンマを外した光量比例値。**正確な合成・ブレンド・リサイズ・アンチエイリアスはここで行う**。ガンマ済みsRGBのまま平均するとグラデ/半透明が暗く濁る（有名な「50%グレー問題」）。CSS の OKLab 補間がこれを回避する。
- **長所**: ユビキタス、軽量、HW直結。**短所**: 知覚的に不均一（数値距離 ≠ 見た目の差）、色域が狭い、パレット生成に不向き。
- **使いどころ**: 最終出力・既存資産・フォールバック値。

### 1.2 HSL と HSB(HSV)

RGBを「人が扱いやすい円筒座標」に変換したもの。**どちらも sRGB の単なる再表現**で、知覚均等ではない。

- **HSL**: Hue(0–360°) / Saturation / **Lightness**。L=50%で純色、0%黒、100%白。
- **HSB/HSV**: Hue / Saturation / **Brightness(Value)**。B=100%が最も明るい純色、白は S=0 かつ B=100%。
- **UIで使うときの致命的な落とし穴（知覚明度問題）**:
  - L・B は **幾何学的な値であって知覚明度ではない**。同一Lでも色相で見た目の明るさが激変。
  - 例: `hsl(60 100% 50%)`（黄）と `hsl(240 100% 50%)`（青）は**どちらもL=50%**だが、黄は眩しく、青はかなり暗く見える。
  - 結果: 「Hだけ回して同じLのセットを作る」と**見た目の明度がバラバラなパレット**になる。
- **使いどころ**: カラーピッカーUI、軽い色相回転。**体系的なパレット/ランプ生成には使わない**（→ OKLCH/HCT）。

### 1.3 CMYK（印刷・減法混色）

- **減法混色**: Cyan/Magenta/Yellow/Key(黒) のインクが光を吸収。紙・印刷の世界。
- **デバイス依存が極端**（インク・用紙・ICCプロファイル依存）。色域が狭くRGBとずれる。
- **Web で原則使わない理由**: ①画面はRGB発光、②画面上に「正しいCMYK色」は存在しない、③CSSにCMYK指定は実質ない（`device-cmyk()` は印刷向けドラフト）。
- **使いどころ**: 印刷入稿のみ。DSでは「印刷用に別途プロファイル変換」と割り切る。

### 1.4 CIE XYZ / CIELAB (L\*a\*b\*) / LCH

CIE による**デバイス非依存・測色ベース**の基盤。

- **CIE XYZ (1931)**: 全色空間変換のハブ。**Y = 輝度(luminance)**。直接UIには使わない中継点。
- **CIELAB (L\*a\*b\*)**: XYZを知覚均等化した空間。**L\***=知覚明度0–100、**a\***=緑(−)↔赤(+)、**b\***=青(−)↔黄(+)。HSLより格段に均等だが**完全ではない**（特に青で色相が歪む「Labの青問題」）。
- **LCH (LCh_ab)**: Labの円筒座標。**L\***/**C**(chroma=彩度)/**H**(色相角)。CSSに `lab()`/`lch()` あり（Baseline済み）。
- **長所**: デバイス非依存、明度を独立操作、色差(ΔE)計算に使える。**短所**: 青の色相非線形、彩度上限が色相で変動。UIランプ生成は後継のOKLCH推奨。

### 1.5 OKLab / OKLCH ★ 現行Webの実用標準

**Björn Ottosson が 2020年12月発表**。CIELABの弱点（青の色相シフト、青〜紫の不均等）を改良LMS錐体応答＋立方根＋最適化行列で克服した、**現行Web向けの実用的知覚均等空間**。

- **OKLab座標**: **L**(明度0–1)/**a**(緑↔赤)/**b**(青↔黄)。
- **OKLCH座標（実務はほぼこちら）**:
  - **L = 知覚明度** 0–1（CSSは0%–100%可）。**色相に依らず一定の明るさ**。
  - **C = Chroma（彩度・絶対量）** 0〜約0.37+（sRGB内現実上限は色相により~0.32、P3でさらに上）。**HSLのSと違い絶対量**: C=0.1 はどの色相・明度でも同程度の鮮やかさ。
  - **H = 色相角** 0–360°。**Hを変えても見た目の明度がほぼ変わらない**（HSL最大の弱点を解消）。
- **HSL/LCH に対する優位**:
  1. 真の知覚明度: L固定で色相を回しても明るさが揃う → **整ったパレットが機械的に作れる**。
  2. 絶対chroma: 明度を変えても彩度感が予測可能 → トーナルランプが破綻しない。
  3. グラデ/ミックスが綺麗（補色間でも濁った中間色が出にくい）。Lab/LCHより青の挙動が自然。
  4. 広色域に素直（P3/Rec2020 も同座標系で扱える）。
- **CSSサポート（2026-06）**: `oklch()`/`oklab()` は **2025年9月にBaseline入り**（Chrome/Edge 111+、Safari 15.4+、Firefox 113+）。実利用~95%+。Relative color syntax（`oklch(from var(--c) l c h)`）も主要ブラウザに展開済み（ランプ自動生成に便利）。
- **P3 広色域**: `oklch(70% 0.25 150)` のように sRGB外（P3域）も自然に指定でき、非対応では gamut mapping。
- **使いどころ（最有力）**: UIテーマトークン、カラーランプ生成、グラデ、`color-mix()`。

### 1.6 HCT（Material Design 3）

Google が Material 3 のため開発。**CAM16 + L\* のハイブリッド**。

- **構成**: **H**=CAM16色相 / **C**=CAM16彩度(0〜~120) / **T**=Tone(**CIELABのL\***、0黒〜100白)。
- **なぜ使うか / OKLCHとの差別化**:
  1. **アクセシビリティを座標に内蔵**: ToneはL\*なので、**Tone差だけでコントラストを保証**。Tone差 **40→コントラスト比≥3.0**、**50→≥4.5（WCAG AA）**。「トーン値を選ぶ＝コントラストが決まる」。
  2. Hue/Chromaを変えてもToneが動かない（ダイナミックカラーで明度・コントラストを保ったまま色相差替え）。
- **実装**: `material-color-utilities`（CSSネイティブ関数は無く、ライブラリでhexに焼く）。
- **住み分け**: CSSネイティブ重視＝**OKLCH** / コントラスト保証つき自動パレット＝**HCT**。

---

## 2. 知覚均等性 (Perceptual Uniformity)

- **定義**: 数値上の等距離が、見た目の色差の等しさに対応する性質。「ΔL=10 がどの色相・明度でも同程度の見た目変化」。
- **なぜランプ生成で重要か**: ランプ（50…950）は「等間隔に見える滑らかな階段」であってほしい。知覚均等空間なら **Lを等差で刻むだけで視覚的に均等な段階**になり、複数色相で**同じ段番号＝同じ明るさ**を保証でき、コントラスト予測が成立する。
- **HSLで等間隔に動かすと破綻する例**:
  - `hsl(H 100% 50%)` を 60(黄)/120(緑)/240(青) で並べると L=50%なのに黄は明るく青は暗い → 「同じ明度トークン」のはずが見た目バラバラ。
  - L 10%刻みでも暗部の見た目変化は小さく明部は白飛び気味 → 段の間隔が不均等。
  - → OKLCH/HCTなら L(Tone)等差＝見た目等差、H固定＝色相固定、C固定＝彩度感固定で破綻しない。

---

## 3. 色域 (Gamut): sRGB vs Display P3

- **大きさ**: sRGB ⊂ **Display P3**（約25%広い、特に赤緑が鮮やか）⊂ **Rec.2020**。2025–26で中級以上ディスプレイの多くがP3対応。
- **CSS指定**: `color(display-p3 1 0 0)` 等、または `oklch()`/`lch()` で色域外も記述可。判定は `@media (color-gamut: p3) {…}`。
- **gamut mapping**: 広色域→狭色域へ収める処理。単純クリップは色相/明度がずれる。CSS Color 4 は **OKLCH空間でChromaを落としつつ L と H を保つ**方式を規定（知覚的に穏当）。
- **CSSフォールバック（推奨）**:
  ```css
  .btn {
    background: #1a73e8;            /* 1) sRGB フォールバック（先に書く） */
    background: oklch(55% 0.2 255); /* 2) 対応ブラウザが上書き、P3域も表現 */
  }
  ```
  非対応ブラウザは2行目を無視。**未対応でも壊れず劣化（graceful degradation）**。

---

## 4. 実務指針（2025–2026）: どの色空間を使うか

**結論: OKLCH が事実上の推奨デフォルト**（CSSネイティブ・Baseline・知覚均等・P3対応・グラデ/mixが綺麗）。

1. **テーマトークンの「正本」を OKLCH で定義**（L=明度段 / C=彩度 / H=ブランド色相 を分離管理）→ 色相差替え・ダーク派生が機械的に作れる。
2. **ランプ生成**: H固定、Lを知覚等差で刻む、CはLに応じ軽く調整（明部/暗部で到達chromaが下がる）。
3. **コントラスト保証を自動化／Material系**なら **HCT**（Tone差でWCAG充足: 40→3.0、50→4.5）。
4. **フォールバック**: 必ず sRGB hex を先に、`oklch()` を後に。旧環境が残るなら `@supports`。
5. **HSL/HSV は使わない**（ピッカー内部表現を除く）。CMYK は印刷入稿のみ別パイプライン。

**ツール**: [oklch.com](https://oklch.com)（Evil Martians、P3/sRGB可視化＋hexフォールバック生成、事実上の標準）、[huetone](https://huetone.ardov.me)（APCA＋知覚均等ランプ）、Material 3 は [material-color-utilities](https://github.com/material-foundation/material-color-utilities)。

---

## 5. このデザインシステムへの適用

- 現状 `sources/themes/<theme>/*.json` は **hex 前提**。原本を hex で持つこと自体は健全（消費契約がシンプル、Swift colorset にも焼きやすい）。
- **設計時の思考は OKLCH で行う**のが推奨: oklch.com で L/C/H を決め、ランプや色相差替えを設計してから **hex に焼いて JSON に書く**。これだけでも知覚均等な段・テーマ間の明度整合が手に入る。
- 将来「正本を OKLCH 化し `build/` で hex フォールバック + `oklch()` を両出力」するのは **破壊的になりうる方向性**（スキーマ拡張・既定色空間の選定）。採用するなら **ADR（`/adr`）に記録**する。`DESIGN.md` のパステル/低彩度志向は OKLCH の低 C 帯と相性が良い。

---

## Sources
- [MDN: oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) ／ [Can I use: oklch()](https://caniuse.com/mdn-css_types_color_oklch)
- [Evil Martians: OKLCH in CSS — why we moved from RGB and HSL](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)
- [Oklab color space — Wikipedia](https://en.wikipedia.org/wiki/Oklab_color_space)
- [ColorFYI: Perceptual Color Spaces — Lab, LCH, Oklab, OKLCH](https://colorfyi.com/blog/perceptual-color-spaces/)
- [Material Design 3: The science of color & design](https://m3.material.io/blog/science-of-color-design) ／ [How the color system works](https://m3.material.io/styles/color/system/how-the-system-works)
- [material-color-utilities (GitHub)](https://github.com/material-foundation/material-color-utilities)
- [WebKit: Wide Gamut Color in CSS with Display-P3](https://webkit.org/blog/10042/wide-gamut-color-in-css-with-display-p3/)
- [Chrome: High definition CSS color guide](https://developer.chrome.com/docs/css-ui/high-definition-css-color-guide)
- [W3C: CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/) ／ [Design Tokens Color Module](https://www.designtokens.org/tr/2025.10/color/)
