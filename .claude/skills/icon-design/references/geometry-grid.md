# グリッドと幾何（geometry） — リファレンス

アイコンの「骨格」を決める層。グリッド・ライブエリア・キーライン・ピクセルフィッティング・光学補正・角度。各項は「**理論（なぜ）**」と「**具体値・規約**」を併記。出典は末尾。

> 数値の確度: Material(m2/m3)・Apple は JS レンダリングのため、一部はミラーテキスト・WWDC トランスクリプト・一次引用の二次情報で相互裏取り。Lucide・Carbon は公式から直接取得。

## 0. システム横断 早見表

| | Material（system） | IBM Carbon | Apple SF Symbols | Lucide / Feather |
|---|---|---|---|---|
| グリッド/viewBox | 24dp（密度20・製品48） | master 32px→16/20/24/32 | 9weight×3scale テンプレート | **24×24** |
| ライブエリア | 20×20（+各辺2dp） | 28×28（+2px） | baseline+左右margin | ≥1px余白→最大22 |
| ストローク | 2dp（細部1.5） | 2px（縮小しても維持） | フォント連動・手描き9段 | **2px** centered |
| 角丸 | 外角2dp・内角直角 | 2px（×2増分） | 連続曲率 | ≥8px=2px / <8px=1px |
| 角度 | 対角45° | 45°、他は15°刻み | √2/√3/φ 対称 | 規定なし |

## 1. ベースグリッドと選択理由
- **理論**: 正方グリッドはセット全体の「織物」。最大サイズで一度描き線形縮小することで線幅・比率・位置の一貫性を保つ（IBM: "foundation to determine line thickness, proportion, shape and positioning across the entire set"）。**割り切れる数**を選ぶ — 24 は 2/3/4/6/8/12 で割れ、2px ストローク・2px 余白・8px 部分形状が整数ピクセルに乗る。UI のインライン字形・タッチターゲット（48dp の半分=24dp）と整合させる。
- **具体値**: Material=24dp（製品192pxマスター）／Carbon=32pxマスター→既定16px／Apple App Icon=1024pxマスター1枚／**Lucide・Feather=24×24（`viewBox 0 0 24 24`）**。Lucide は「なぜ24か」を明文化していない（可分性・UI標準サイズは業界共通理論）。

## 2. ライブエリア / パディング / トリム
- **理論**: ライブエリア（=safe area）は意味ある作画が収まる領域、外周の余白（=trim area）は避ける領域（IBM）。余白の目的は**書き出し時にスケールと周囲の空白を保つ**（隣接配置で特定アイコンだけ膨張しない）・エッジのクリップ防止・2px ストロークと整合する逃げ。
- **具体値**: Material=24dp 中 **20×20 ライブ + 各辺2dp**（密度版20dp は16×16+2dp）／Carbon=32px 中 **2px パディング→28×28**／**Lucide=最低1px パディング→最大22×22**（centered な2px ストロークが端で1px はみ出す前提）。本リポジトリは Lucide 準拠で「~20x20 を目安・最低1px 余白」。

## 3. キーライン形状（円・正方形・縦長/横長）
- **理論**: キーラインは基本形に一貫サイズを与えるガイド。**核心的な知覚問題＝数学的に同寸の円は正方形より小さく見える**。だから円のキーラインを正方形より大きく作り、オーバーシュートを最初から数値に織り込む。
- **具体値（Material, 20×20 ライブ内）**: 円 直径**20** / 正方形**18×18** / 縦長 **16w×20h** / 横長 **20w×16h** dp。円(20)>正方形(18) が意図的補正。Carbon は4キー形状を使うがピクセル寸法は非公開（Figma マスター内ガイド）。Apple は φ=1.618/√2/√3 比で内接形を構成（被写体の対称性が比を決める）。Lucide は明示グリッドを持たず **`circle`/`square` アイコンを光学体積の参照**にする。
- **補正率の参考値**: 円を正方形と等しく見せるには線寸法で約+5%（Helena Zhang）、面積を等しくするには **112.84%**（Bjango）。三角形は**重心（centroid）で中心合わせ**。

## 4. ピクセルフィッティング / 半ピクセル問題
- **理論**: SVG/Canvas は**整数座標を「ピクセルの境界」**として扱う。整数座標上の1px ストロークは隣接2pxに半分ずつ乗り**ぼける**。1×（100%）で偶数値設計すればキーライン寸法が整数ピクセルに着地する。
- **規約**: **偶数幅（2px,4px）→整数座標**（境界を対称に跨ぎ全ピクセルを満たしシャープ）。**奇数幅（1px,3px）→ +0.5 オフセット**。Carbon の製作則が最も具体的: 「全座標を整数に・小数禁止・**中心ボーダー禁止**（半ピクセル化する）・line ツールでなく rectangle ツール・全ストロークを expand」。Lucide: 「弧の中心もできるだけグリッドに整列」「低DPIでピクセルパーフェクトを狙う」。最終手段 `shape-rendering="crispEdges"` はアンチエイリアスを切るので円/対角を損なう。

## 5. 光学補正（optical correction）
- **理論**: 数学的に正しい幾何はしばしば誤って見える（同寸の円は正方形より小、幾何中心は重心とずれ、曲面・尖端は後退して見える）。IBM: "Follow what looks optically right versus strict metric values."
- **規約**:
  - **キーラインのオーバーシュート**: 円・三角・尖端を枠より少しはみ出させ、隣接アイコンと知覚サイズを揃える（§3）。
  - **重心で視覚的に中央寄せ**（Lucide: "visually centered by their center of gravity"）。検証法=正方形/円の隣・上下に置きズレを確認。対称形は真の中央へ（光学オフセットしない）。
  - **ブラーテスト**: 自分のアイコンと circle/square をぼかして並べ、自分だけ濃く（重く）見えないか確認（光学体積の均衡）。
  - 視覚的重さの均一化: 全ストローク2dp/2px に保つ（Material/Carbon/Lucide）。Material Symbols は `opsz`/`GRAD` 軸でサイズ・背景に応じ自動補正。

## 6. 角度・対称性
- **理論**: 45°・15° 刻みに制限すると対角線がアンチエイリアス時に**均等に階段化**し、セットが体系的に見える。水平/垂直優先で整数ピクセル上に対称構築するとシャープ。
- **具体値**: Material=対角は45°。Carbon=「均等なアンチエイリアスのため45°、その他は可能な限り15°刻み」。**Lucide/Feather は角度規約を持たない**（0/45/90 や15°刻みを採用するなら自前規約として ADR 化）。Lucide が規定するのは「対称アイコンは常に真の中央へ」のみ。

## 出典
- Material: m2.material.io/design/iconography/system-icons.html・product-icons.html / m3.material.io/styles/icons・/blog/introducing-symbols
- IBM Carbon: ibm.com/design/language/iconography/ui-icons/design / v10.carbondesignsystem.com/guidelines/icons/contribute
- Apple: developer.apple.com/design/human-interface-guidelines/sf-symbols・app-icons / WWDC19-206・WWDC21-10250 / designbygeometry.com/building-apples-ios-icon-grid
- Lucide/Feather: lucide.dev/contribute/icon-design-guide / github.com/feathericons/feather
- 光学補正: bjango.com/articles/opticaladjustments / minoraxis.medium.com/icon-grids-keylines-demystified / kilianvalkhof.com（half-pixel）
