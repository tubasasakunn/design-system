# ストロークとスタイル軸 — リファレンス

アイコンの「線の質感とスタイル系統」を決める層。ストローク幅・終端/結合・角丸/同心角・センターストローク vs アウトライン・スタイル軸（line/fill/duotone/weight/optical size）。各項は「**理論（なぜ）**」と「**具体値・規約**」を併記。

## 0. システム横断 早見表

| | Lucide/Feather | Phosphor | IBM Carbon | Material Symbols | SF Symbols |
|---|---|---|---|---|---|
| 標準ストローク | 2px(`absoluteStrokeWidth`可) | weight軸 8/12/16/24@256 | 2px(縮小しても維持) | 2dp/可変 wght100-700 | フォント連動・手描き9段 |
| cap / join | round / round | round / round | butt / miter寄り | スタイル依存 | — |
| スタイル軸 | 単一 | weight6+fill+duotone | UI vs ピクトグラム | 4軸 wght/FILL/GRAD/opsz | weight×scale×variant×rendering |
| 着色 | stroke=currentColor | fill=currentColor | fill（黒master） | currentColor/opacity | template+foregroundStyle |

## 1. ストローク幅と視覚的重さ
- **理論**: ストローク幅は「視覚的重さ（optical weight＝知覚される視覚的質量）」の主要パラメータ。質量は bbox でなく「塗り面積・線幅・内部余白・周囲余白の関係」で決まる。最大の分岐は**線幅をサイズに比例させるか／視覚的に一定に保つか**。比例だと拡大で太すぎ・縮小でヘアラインになり可読性が落ちる。
- **具体値**: Lucide/Feather=**2px@24**。SVG 標準は比例（48pxで実効~4px）だが Lucide は `absoluteStrokeWidth` で「表示サイズによらず画面上2px」を維持できる（混在サイズで線の重さを揃える）。Carbon=2px、**リサイズしても2pxを変えない**（＝光学サイジング。16pxでは線を諦め塗りグリフ化）。Material=2dp（細部1.5dp）。Phosphor=weight軸そのものが線幅（24px換算で thin0.75/light1.125/regular1.5/bold2.25、2px相当はBold）。

## 2. 終端（cap）と結合（join）
- **理論**: cap/join がスタイルの「声」を決める最重要レバー。**round=友好的・有機的**（丸ペンの印象）、**butt+miter=技術的・精密・シャープ**。
- **具体値（MDN 定義）**: cap = `butt`（平ら・既定）/ `round`（半円付加）/ `square`（線幅の半分押し出した矩形）。join = `miter`（尖り・既定）/ `round`（円弧）/ `bevel`（平切り）。
- **落とし穴**: 鋭角では miter のスパイクが伸び、`stroke-miterlimit`（既定4）を超えると**自動で bevel にフォールバック**する。→ **sharp スタイルの細い鋭角で意図せず角が平切りになる実害**。鋭角を使うなら miterlimit を明示するか角度を寝かせて検証。
- 採用: Lucide/Feather/Phosphor=round+round。Carbon=square(butt)、矢印の先端は常に角・丸い先端は使わない。**本リポジトリ: rounded=round/round、sharp=butt/miter**。

## 3. 角丸と同心角（concentric corners）
- **理論**: **inner radius = outer radius − stroke width**。外円の内側に内円をネストするとき半径を等しくすると角で帯が不均一に太る。差を線幅ぴったりにすると2つの円弧が**共通中心（同心）**を持ち角でも線の太さが一定。半径不一致は「安っぽく雑」、同心は「引き締まって洗練」して見える。Apple は SwiftUI に `ConcentricRectangle`（WWDC25）を追加。
- **具体値**: Lucide=**≥8px形状は2px半径 / <8px形状は1px半径**（固定2pxだと小形状がボブ状になる回避）。Carbon=2px、必要に応じ**2の倍数**（4,6,8…で同心オフセットを整数pxに乗せる）。Material=外角2dp・**内側の角は直角**・2dp以下のストローク自体の角は丸めない。

## 4. センターストローク vs アウトライン化 + currentColor
- **トレードオフ**:
  - **センターストローク**（開いた単一パス＋`stroke-width`。**本リポジトリの方式**）— 利点: 色・サイズ・太さ・cap・join を属性1つで後変更可、DOM アクセス可、極小ファイル。欠点: ヘアラインのアンチエイリアスが不安定（~24px未満不向き）、1形状内で太さを変えられない。
  - **アウトライン化（expand stroke）** — 利点: レンダラのストローク演算に依存せずジオメトリが移植性高い、テーパー/可変幅/ブール塗り可、極小ラスタで継ぎ目ボケ回避。欠点: **再ウェイト不可**（ストロークが無い）、点数倍増でパス肥大。
  - **使い分け**: 均一ウェイト・テーマ着色・≥24px・単一原本マルチPF → センターストローク。テーパー/可変/極小確実レンダ/最終確定アセット → 展開fill。
- **実態**: Lucide/Feather/本repo=センターストローク+`stroke=currentColor`/`fill=none`。Phosphor/Carbon=出荷物は**展開済み fill**（Carbon は半ピクセル化防止で中心線禁止）。
- **currentColor**: `fill/stroke="currentColor"` は要素 CSS `color` を継承。1変数（本systemなら `--color-fg-*` トークン）で全状態の色を駆動。**重大制約: DOM にインライン展開された SVG でのみ機能**（`<img>`/`background-image` 経由は無効）→ アイコンをインライン化/コンポーネント化する理由。`fill` 既定は黒なのでアウトラインは `fill="none"` 必須。

## 5. スタイル軸の体系
- **塗り分類**: outline/line・filled/solid・duotone(2階調)・weight(thin/light/regular/bold)。Phosphor の duotone=「Regular 輪郭 + 背後に20% opacity の `currentColor` 塗り」で1色入力2階調。Material レガシーは Filled/Outlined/Rounded/Two-Tone/Sharp の5別ファミリ。
- **rounded vs sharp**: 本質は §2 cap/join + §3 角丸の組合せ。Material Symbols は Outlined/Rounded/Sharp の3スタイル。本repo の rounded/sharp はこの軸。
- **ウェイトと optical size**: 活字 punchcutter は各サイズで字形を再設計した。**小サイズ/本文用は太く・簡略**（潰れ防止）、**大サイズ/display用は細く・詳細**。Material Symbols `opsz`=20–48dp でストローク自動調整。Carbon は16/20/24/32 を各サイズ別マスタにし（単純縮小でない）線は2px一定・16pxは塗り化。
- **Material Symbols 4軸**: `wght`100–700（線幅・全体サイズも動く）／`FILL`0–1（連続軸＝状態遷移をアニメ可）／**`GRAD`−50–200**（weight より granular に線厚を微調整するが**全体幅・行送りを変えない**。−25=明on暗の眩光低減、反転文字は太く見えるのでレイアウト不変のまま補償）／`opsz`20–48。
- **SF Symbols**: 9weight（San Francisco フォントに手描きで一致＝隣接テキストと同じ声）×3scale（Small/Medium/Large、ポイントサイズ固定で scale だけ変え cap height に自動で光学縦センタリング）×variant（outline/fill/slash/enclosing/badge）×4rendering（monochrome/hierarchical/palette/multicolor）。可変は3ソース（Ultralight-S/Regular-S/Black-S）でパス数・点数・順序・巡回方向を一致させ補間。

## 6. fill版とline版で重さを揃える
- **理論**: 塗りアイコンは線幅が同じでもアウトラインより**重く感じる**（同グリッドで面積を占め密度が高い）。「幾何学的な等しさは光学的な不等さを要求する」。
- **テクニック**: 塗り形状を少し inset（小さく）／内部ネガティブスペースを再調整して密度を下げる／bbox でなく知覚質量で整列（検証は squint/blur テスト）。Phosphor は fill外形=Regular外形と同一にしフットプリント維持。

## 7. 本リポジトリへの含意
- **`rounded`（stroke2px/round cap/join）= Lucide 準拠**、**`sharp`（butt/miter）= Carbon の終端規範 + Lucide からの意図的逸脱**。
- **sharp の鋭角は miter-limit による bevel フォールバックが実害**（§2）。鋭角を使うなら検証。
- **同心角 inner r = outer r − 2px** が rounded の角で2px線を均一に保つ条件（§3）。
- **将来 weight 軸**: Phosphor の 24px 換算ランプ 0.75/1.125/1.5/2.25 が雛形。**duotone**=「regular 輪郭 + 背後20% opacity currentColor 塗り」。ただし可変フォント的多軸は CLAUDE.md の「依存ゼロ・生 SVG」と緊張するので **build 時バリアント**として閉じ込めるのが整合的。

## 出典
- Lucide: lucide.dev/contribute/icon-design-guide・/guide/.../stroke-width / github.com/lucide-icons/lucide CONTRIBUTING
- Phosphor: phosphoricons.com / github.com/phosphor-icons / minoraxis.medium.com/phosphor-icons-is-live
- Carbon: carbondesignsystem.com/elements/icons/usage / v10.carbondesignsystem.com/guidelines/icons/contribute
- Material Symbols: developers.google.com/fonts/docs/material_symbols / fonts.google.com/knowledge（grade_axis, optical_size_axis）
- SF Symbols: developer.apple.com/design/human-interface-guidelines/sf-symbols / WWDC19-206・WWDC21-10097/10250
- SVG 仕様: developer.mozilla.org/SVG（stroke-linecap, stroke-linejoin, stroke-miterlimit, color_value）/ cloudfour.com/thinks/the-math-behind-nesting-rounded-corners / danklammer.com/articles/svg-stroke-ftw / dutchicon.com/optical-weight-icons / typenetwork.com/articles/inside-the-fonts-optical-sizes
