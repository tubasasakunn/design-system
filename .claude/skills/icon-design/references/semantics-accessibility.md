# 意味論・一貫性・アクセシビリティ — リファレンス

アイコンが「伝わるか・揃っているか・使えるか」の層。メタファー/認知（NN/g）、セット内の一貫性軸、ファミリー設計（状態・バッジ・RTL）、アクセシビリティ（WCAG）。各項は「**理論（なぜ）**」と「**具体指針・数値**」を併記。

## 1. メタファーと認知（意味の伝わりやすさ）

### 1.1 アイコンはデフォルトで曖昧
- **理論（NN/g）**: ほぼ全アイコンは曖昧。同じ図像が UI ごとに別意味（ハート=お気に入り/ブックマーク/いいね）。真に普遍なのはごく少数（home/print/虫眼鏡=search）。「わずかな意味の差でもユーザーの理解と依拠を阻害する」。
- **指針**: 曖昧さ克服の唯一確実な手段は**テキストラベル併記**。「a word is worth a thousand pictures」。

### 1.2 認識 ≠ 解釈
2段階が両方成功して機能する: (1) 図形を認識できるか (2) 何を意味/操作するか解釈できるか。フロッピーを物体として識別できなくても「保存」と分かる＝**機能的理解 > 物体認識**。NN/g「5秒ルール」: 着想に5秒超かかる図像は機能しない見込み。

### 1.3 参照 vs 抽象（NN/g 3分類・使いやすさ順）
1. **Resemblance（類似）**: 物体を直接描く（封筒=メール）。最良。難点は微小サイズの可読性。
2. **Reference（参照・比喩）**: 連想で表す（クランプ=圧縮）。「UI上の駄洒落は危険」、文化/言語翻訳リスク。
3. **Arbitrary（恣意）**: 規約でのみ意味を持つ（?=ヘルプ）。最も学習困難。**ただし広く標準化済みなら優秀**（ハンバーガー/虫眼鏡/歯車）。
- **結論**: 新規採用は resemblance 優先。恣意記号は慣習化済みに限る。

### 1.4 普遍 vs 文化依存（回避・要ラベル）
- メール=**封筒**（万国共通）を使い**郵便受け**（国ごと形が違う）は避ける。
- **チェックマーク**: 西洋=正解だが**日本・北欧で「不正解」**を意味し得る。
- **手のジェスチャ**: thumbs-up は西アフリカ/中東で侮辱、OK サインはブラジル/トルコで卑猥 → グローバル UI で回避。
- **色**: 白=純潔(西)/喪(東アジア)、赤=危険(西)/吉(中国) → 色単独に意味を載せない（WCAG 1.4.1 と合流）。

### 1.5 ハンバーガー等 慣習化アイコンの条件
正しく「メニュー」と認識されるが**条件付き**: 左上配置＋標準スタイル（等長3本線）。枠で囲うと別物と誤認。**40歳以上は49%しか理解しない**。デスクトップのナビバーでは画面幅~3.5%に縮み視認性が急落 → ラベル併記が有効。

## 2. セット内の一貫性軸
「**同じ概念には同じ部品（メタファー）を使う**」一貫性が認知負荷を下げる土台。
- **visual weight/density**: 異サイズでも光学ストローク重量を一定に。
- **level of detail**: 小サイズで詳細削減（Fluent: 12px は情報提示専用・操作には小さすぎ／Carbon: 16/20px を本文タイプに最適化）。
- **aperture/counter（開口部）**: 16px で読めるよう隙間を十分開ける（潰れ防止）。
- **perspective**: 全システムが**フラット・正面・単色**で統一（遠近/スキューモーフィズム不可）。
- **テキスト整列**: Carbon は隣接テキストと**中央揃え**（ベースライン揃えは Don't）、アイコン-テキストのサイズ比を変えない。非対称アイコンは幾何中心でなく光学中心へ（Apple）。

## 3. アイコンファミリー設計（状態・バッジ・方向性）
- **状態（active/inactive）**: Material Fill 軸 0/1（outline=非アクティブ / fill=アクティブ・選択）。SF Symbols は outline=ツールバー向き・fill=タブバー/選択向きでコンテナが自動選択。
- **バッジ/モディファイア（add/remove/edit）**: Fluent は**常に Filled・右下配置**（最良コントラスト）。「ベース不変 + 一定位置・一定スタイルのバッジ」で家族性を担保。
- **方向性・RTL ミラーリング**:
  - **反転する**: 戻る/進む・方向矢印/シェブロン・進捗（右→左充填）・undo/redo・send・テキストを描く図像・リスト順。
  - **反転しない**: **メディア再生（play/早送り — 時間でなくテープの方向）**・**時計回り/円環時間（refresh/history/時計 — 線形時間は反転するが円環時間は不変）**・物理物体・チェック・カメラ・数字・ロゴ・off のスラッシュ。
  - 経験則: 「右手で持てる物体を表すアイコンは反転不要」。
  - **実装**: `transform: scaleX(-1)`（`rotate(180deg)` より推奨）を `[dir=rtl]` で。**原本 SVG は LTR 正準のまま保持し、どれが directional/mirrorable かをメタデータでタグ付け**するのが消費側に親切（本repo なら将来の `mirror: true` フラグ）。

## 4. アクセシビリティ

### 4.1 タッチ/ターゲットサイズ
| 基準 | 数値 |
|---|---|
| WCAG 2.5.8 Target Size Minimum (AA) | **24×24 CSS px**（spacing 例外あり） |
| WCAG 2.5.5 Target Size Enhanced (AAA) | **44×44 CSS px** |
| Apple HIG | iOS/watchOS **44×44pt 推奨**（最小28）、macOS 28（最小20） |
| Material/Android | **48×48dp**、間隔8dp 以上 |
| Carbon | 対話アイコンのタッチターゲット **44px 以上**（CSS パディングで確保） |

**重要**: グリフは 24×24 viewBox でも、**ヒット領域（ボタンのパディング）**が ≥24px(AA)/44px(AAA) を満たす必要。グリフサイズとヒット領域を混同しない。

### 4.2 色だけに依存しない（WCAG 1.4.1 A）
色を情報伝達・操作指示・区別の**唯一の視覚手段**にしない。status 系トークンは hue 単独でなく**形状・ラベル・位置**でも状態を符号化（Carbon: テキストとアイコンの色を一致させ別色にしない）。

### 4.3 コントラスト
- **WCAG 1.4.11 Non-text Contrast (AA)**: 意味を持つグラフィカルオブジェクト/UI 部品は隣接色に **3:1 以上**。
- Carbon/Material 流は**4.5:1**（タイポと同じ基準）。`stroke="currentColor"` でも描画時に最低 3:1 を確保。

### 4.4 テキスト代替（aria）— 原本に焼き込まない
**2バケツ規則**: 意味あり=代替必須／装飾=AT から隠す。**原本 SVG は無装飾・LTR 正準のまま**にし、aria は消費側で付ける。
| 状況 | 推奨属性 |
|---|---|
| 単独で意味あるアイコン | `role="img"` + `<title id>`（最初の子）+ `aria-labelledby`（最も互換性高い） |
| 装飾／隣接テキストと重複 | `aria-hidden="true"`（＋レガシー用 `focusable="false"`） |
| ラベル無しリンク/ボタン | **ボタン/リンク側に `aria-label`（機能を記述）**、内側 SVG は `aria-hidden`（Sara Soueidan の堅実策） |
- 注意: SVG 自体への `aria-label` は一部ブラウザ/SR 組合せで失敗 → `role="img"`+`<title>`+`aria-labelledby` が堅牢。

## 5. アイコン単独 vs ラベル併記
- **既定はラベル併記**。ほぼ全アイコンが曖昧なため。style 軸（rounded/sharp）は*形*を変えるだけで*解釈*は解決しない。
- ラベルは**常時表示**（hover 非依存 — タッチで機能しない）。
- 隠しナビ（ハンバーガー単独）はコンテンツ発見性を20%超下げ、タスクを遅くする。**アイコン+ラベル併用**が一貫して優れる。
- 標準化済み少数（search/home/print/ハンバーガー＋左上）は単独でも可だが、新規・抽象はラベル併記を既定に。

## 出典
- NN/g: nngroup.com/articles/（icon-usability, classifying-icons, icon-testing, how-to-test-digital-icons, hamburger-menu-icon-recognizability, hamburger-menus）
- Material: m2.material.io/design/usability/bidirectionality.html / m3.material.io/foundations/layout/bidirectionality-rtl / support.google.com/accessibility/android/answer/7101858
- Apple: developer.apple.com/design/human-interface-guidelines/（icons, sf-symbols, right-to-left, accessibility）
- Carbon: carbondesignsystem.com/elements/icons/usage
- Fluent/Globalization: fluent2.microsoft.design/iconography / learn.microsoft.com/globalization/fonts-layout（mirroring, images-icons-colors）
- WCAG: w3.org/WAI/WCAG22/Understanding/（use-of-color, non-text-contrast, non-text-content, target-size-minimum, target-size-enhanced）
- a11y 実装: sarasoueidan.com/blog/accessible-icon-buttons / deque.com/blog/creating-accessible-svgs / css-tricks.com/accessible-svgs
