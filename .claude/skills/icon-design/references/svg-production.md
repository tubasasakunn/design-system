# SVG 制作・最適化・配布 — リファレンス

原本 SVG を「正しく・軽く・移植可能に」する実務層。正規化・パス最適化・SVGO・小サイズ最適化・マルチプラットフォーム配布・配布形態。各項は「**理論（なぜ）**」と「**具体手順・設定値**」を併記。

## 1. 正規化（normalization）
- **viewBox**: 座標系・アスペクト比・スケーリングを一手に担う解像度非依存の核心。`0 0 24 24` の値より**セット内全アイコンで同一グリッド共有**が重要。viewBox 無しのインライン SVG は既定 300×150px に化けるので必ず残す。`width`/`height` ≤0 は描画を無効化。
- **width/height を持たせない**: インライン SVG では CSS が属性を上書き。viewBox を残し px 寸法を外し、CSS でサイズ指定（`width:100%;height:auto` でアスペクト比維持）。
- **currentColor**: 線アイコン=`stroke="currentColor"`、塗りアイコン=`fill="currentColor"`。固定色（`fill="#333"`）はカスケード上書き不可でテーマ/状態に追随できない。

## 2. パス最適化
- **アンカー最小化**: 点数=バイト数。直線点は座標2つ、曲線点は4–7数値 → 直線化で命令50%減。不可視ジオメトリ（背後・viewBox 外）は削除。
- **ブール演算**: 重なる単純形状を union/subtract で1パスに統合 → 軽量・クロスPF で一貫描画。**閉パス前提**（ストロークに適用すると予期せぬ結果）。
- **fill-rule**: 既定 `nonzero`（巻き方向を考慮）。**穴あき形状（リング・"O"・くり抜き）は `evenodd` が安全**（内側サブパスの巻き方向に依存せず確実に穴を作る）。CSS 指定があれば SVG 属性より優先。
- **精度の丸め**: 小数桁は最大の削減源。**小数2桁**が実用スイートスポット（64px 未満で2桁と3桁はほぼ区別不能）。最高精度で保存→段階的に下げ崩れる直前で止める。

## 3. SVGO
- **設計思想**: 「描画結果に影響を与えず安全に除去/変換できるものだけ」変更。`preset-default` をベースに。
- **保持すべきもの**:
  - **viewBox は消さない**（`removeViewBox` はスケーリングを壊すと公式警告。preset-default に**含まれない**）。
  - 代わりに **`removeDimensions`** で width/height を除去（無ければ viewBox で補完）。使う前に removeViewBox を無効化。
  - **currentColor を守る**: `convertColors` の `currentColor` オプションは**既定 false** のまま（true は全色を currentColor 化して意図色を潰す）。
  - **id 衝突**: `cleanupIds` は既定 ON で短縮。複数 SVG を同一文書にインラインすると衝突 → `prefixIds` で回避。
  - `<title>` に依存するなら title 除去系を入れない（preset-default は `removeDesc` で `<desc>` を消す）。
- **描画を壊しがちな最適化（要目視）**:
  - `mergePaths`（既定ON）: 統合先は1 style/1 fill-rule しか持てず、**異なる fill-rule のパス統合で穴が塗り潰される**。
  - `convertShapeToPath`（既定ON）: `<rect>`/`<line>` を path 化し**基本図形セレクタの CSS が効かなくなる**（`line{stroke:…}`）。`convertArcs` と併用で弧が壊れる報告あり。
  - `collapseGroups`（既定ON）: グループ transform/継承属性を落として子がずれることがある。
- **アイコン推奨**: preset-default + viewBox 保持 + `removeDimensions` 追加 + `convertColors` 既定 + 穴あき/CSS被参照は `mergePaths`/`convertShapeToPath` を `overrides:{...:false}` で無効化 + 複数インラインなら `prefixIds`。
- **本repo の方針**: ビルドは依存ゼロ（SVGO 未使用）。導入するなら CLAUDE.md の通り `build/` 内に閉じ込め、`sources/` スキーマと `dist/` 消費契約（CSS 変数名・xcassets 名）は維持する。

## 4. 小サイズ最適化
- **半ピクセル**: 偶数幅=整数座標、奇数幅=+0.5（[geometry-grid.md](geometry-grid.md) §4）。`shape-rendering="crispEdges"` は円/対角を損なう最終手段。
- **複数 optical size を持つ理由**: 24px 設計を16px に単純縮小すると実効ストロークが細りすぎる → サイズ別バリアント（または可変 opsz 軸）で小サイズ可読性を保つ。

## 5. マルチプラットフォーム配布

### 5.1 Web
- **currentColor + CSS テーマ（要石）**: 単色グリフを `currentColor` で描けばホスト要素 `color`（=トークン `--color-fg-*`）から全テーマ色を再現。
- **コンポーネント化（SVGR）**: SVGO最適化→JSX変換→props スプレッド・`fill=currentColor`・px→em。バンドル同梱で追加リクエスト無し、**tree-shaking**・props・型安全。本repo は `vite-plugin-svgr` を消費側で想定。
- **スプライト（`<symbol>`+`<use>`）**: 外部ファイルをキャッシュ可。`<use>` ではクローン子孫に CSS 継承が保証されないため symbol 内で `fill="currentColor"` を明示。外部 `<use href="sprite.svg#id">` は同一オリジン制約。

### 5.2 Apple iOS/macOS
- **SF Symbols カスタムシンボル**: SF Symbols アプリで類似シンボルを **File ▸ Export Template…**（SVG）→編集→**Validate**→Xcode アセットカタログへ。テンプレート3.0+ は全レンダリングモード対応（Xcode14+）。可変テンプレートは3デザイン（Ultralight-S/Regular-S/Black-S）で残り24を補間。補間制約=3weight 間でアンカー数・最初の点・巡回方向を一致、ストロークは塗りパス化。
- **アセットカタログ Render As = Template Image**: 「元画像の色を無視し tintColor で表示」＝**Web の currentColor の Apple 版**。SVG/PDF は `Preserve Vector Data` でベクター同梱（SVG は sRGB のみ→template 化）。
- 本repo の `DSIcon.<Style>.<name>.image` は template 描画なので `.foregroundStyle(...)` で着色可。

### 5.3 命名統一・単一ソース生成
- Web=kebab-case（`arrow-left`）→ SVGR で PascalCase。SF Symbols=ドット小文字（`cloud.heart`）。Material=snake_case（`arrow_back`）。
- **共通原則**: 原本を**単色・参照着色（currentColor / Template Image）・固定 viewBox・一貫ストローク**に保てば1枚の SVG が全PFを駆動できる。本repo の `sources/icons/<style>/<category>/<name>.svg → dist/web + dist/swift`（名前一致）はこのモデルの正統な実装。
- **命名は描画対象ベース**（`floppy-disk` not `save`、Lucide 流）、用途語は alias/tag メタ層へ。

## 6. 配布形態のトレードオフ
| 状況 | 推奨 | 理由 |
|---|---|---|
| モダン JS アプリ・有限集合 | SVG コンポーネント(SVGR) | tree-shaking/props/型安全 |
| 大規模・多ページ・ビルド無し | 外部 SVG スプライト | 単一ファイルをキャッシュ/FW非依存 |
| 少数 or パーツ別アニメ | インライン SVG | 完全制御・currentColor・最良 a11y |
| 単一ソースのマルチPF（**本repo**） | 原本 SVG → ターゲット別生成 | `sources/→dist/` に合致 |
- **アイコンフォントは新規採用非推奨**（SR が疑似要素を読む・Unicode 衝突・ロード失敗で豆腐・単色のみ・配置ハック依存）。業界は SVG へ移行済み。

## 出典
- MDN: developer.mozilla.org/SVG（viewBox, fill-rule, use, color_value, img role）
- SVGO: svgo.dev/docs（introduction, preset-default, removeViewBox, removeDimensions, mergePaths, cleanupIds, convertColors, convertShapeToPath）
- CSS-Tricks: scale-svg / cascading-svg-fill-color / accessible-svgs / icon-fonts-vs-svg / svg-sprites-use-better-icon-fonts
- 配布: react-svgr.com / cloudfour.com/thinks/seriously-dont-use-icon-fonts / bjango.com/articles/svgassetcatalogs / createwithswift.com/creating-custom-sf-symbols
- 最適化: smashingmagazine.com（optimising-svgs）/ svgbackgrounds.com（reduce-file-size）/ oreillymedia.github.io/Using_SVG（precision）
