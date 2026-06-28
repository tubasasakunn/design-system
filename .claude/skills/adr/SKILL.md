---
name: adr
description: ADR（Architecture Decision Record / アーキテクチャ意思決定記録）の作成・管理を支援します。設計上の意思決定を記録したい、なぜこの技術/構成を選んだか残したい、ADRを書きたい/起票したい、過去の決定を変更（supersede）したい、決定ログ（ADL）を整備したい場合に使用してください。
---

# ADR（意思決定記録）の作成・管理

## 概要

ADR は「1つの重要なアーキテクチャ意思決定」を、その**背景（Context）**・**決定（Decision）**・**帰結（Consequences）**とともに記録する軽量な Markdown 文書です。コードは「何を作ったか」を示しますが「なぜそう決めたか」は残りません。ADR がその「なぜ」をソース管理下に残し、決定の蒸し返し・盲目的な踏襲/破壊を防ぎます。

このスキルは「ADR を書くべきかの判断 → セットアップ → 起票 → supersede → 索引更新」までの一連の運用を支援します。

## まず判断：これは ADR にすべき決定か

書く前に**重要性ゲート**を通す。1つでも該当すれば ADR を書く価値がある（詳細は [REFERENCE.md](REFERENCE.md) の「判断基準」）。

- 影響領域: **構造 / 非機能特性 / 依存関係 / インターフェース / 構築技法** のいずれかに影響するか（Nygard の5次元）
- リトマス試験: **「6か月後に入る新メンバーが『なぜこうした？』と疑問に思うか？」** → Yes なら書く
- 元に戻すコストが高い、初めての種類、過去に問題を起こした領域 → 書く

**書かない**: 些末・ルーチン・容易に元に戻せる・スタイル/整形レベルの決定。量より質（決定ログが100件を超えると誰も読まなくなる）。

## ワークフロー

ユーザーの要求に応じて該当するステップへ。

### A. セットアップ（初回のみ）

1. 既存の ADR 置き場を探す: `docs/adr/`, `doc/adr/`, `docs/decisions/` を確認。
2. 無ければ `docs/adr/` を作成（最も一般的）。プロジェクトに既存慣例があればそれに従う。
3. メタ ADR `0001-record-architecture-decisions.md` を作成（「ADR を採用するという決定」自体を記録）。テンプレは `templates/nygard.md` を流用。
4. 索引 `docs/adr/README.md` を作成（`templates/index-readme.md`）。

### B. 新規 ADR を起票

1. 形式を選ぶ（デフォルトは **Nygard 形式**。詳細な比較検討が必要なら **MADR**）。迷ったら Nygard。
2. 次の連番を決める: 既存ファイルの最大番号 +1、**ゼロ埋め4桁**。番号は再利用しない。
3. ファイル名 = `NNNN-kebab-case-title.md`（例 `0007-use-postgresql-for-primary-store.md`）。
4. テンプレートをコピーして記入:
   - Nygard → `templates/nygard.md`
   - MADR（フル） → `templates/madr.md` / 最小 → `templates/madr-minimal.md`
   - 1文形式 → `templates/y-statement.md`
5. 初期 Status は `Proposed`。合意が取れたら `Accepted`（日付・関係者を追記）。
6. **Context は中立・価値判断を含まない事実**で、**Decision は能動態のフル文「〜する（We will …）」**で、**Consequences はポジ/ネガ/中立すべて**書く。
7. 索引（README）に1行追記。

### C. 既存の決定を変更する（supersede）

**最重要原則＝不変性**: 承認済み ADR は編集も削除もしない（誤字・リンク修正を除く）。決定を変えるときは:

1. 新しい ADR を起票（上記 B）。
2. 新 ADR に `Supersedes ADR-XXXX`（旧へのリンク）を記載。
3. 旧 ADR の Status を `Superseded by ADR-YYYY`（新へのリンク）に書き換える。← この相互リンク更新だけは旧 ADR への許可された変更。
4. 置換ではなく無効化（後継なし）なら旧 ADR を `Deprecated` にする。
5. 索引を更新。

### D. 索引（ADL）を整備

`docs/adr/README.md` に「番号・タイトル・Status」を列挙。`templates/index-readme.md` を参照。ツールで自動化する場合は [REFERENCE.md](REFERENCE.md) の「ツール」節（adr-tools, Log4brains, adr-log）を参照。

## クイックリファレンス

| やりたいこと | 形式 | テンプレート |
|:---|:---|:---|
| 標準的な決定を記録（推奨デフォルト） | Nygard | `templates/nygard.md` |
| 複数選択肢を比較検討して決めた | MADR フル | `templates/madr.md` |
| 軽く1件だけ残す | MADR 最小 | `templates/madr-minimal.md` |
| コミットメッセージ等に1文で埋め込む | Y-statement | `templates/y-statement.md` |

**Status 遷移**: `Proposed → Accepted → (Deprecated | Superseded by ADR-XXXX)`。Proposed だけが自由編集可。Accepted 以降は不変、変更は supersede で。

## 詳細ドキュメント

- [REFERENCE.md](REFERENCE.md) — 判断基準（ASRテスト）、Status 運用、命名規則、形式比較、ツール、アンチパターン、supersede 運用
- `templates/` — そのままコピーして使える各形式のテンプレート

## 終了条件

- [ ] 「ADR にすべきか」の重要性ゲートを通した（不要なら書かないと明言した）
- [ ] ADR 置き場が存在し、連番・命名規則（`NNNN-kebab-title.md`）に従っている
- [ ] Context / Decision / Consequences（または選択した形式の必須項目）が埋まっている
- [ ] Status が設定されている（新規は Proposed か Accepted）
- [ ] supersede の場合、新旧 ADR の相互リンクと旧 Status を更新した
- [ ] 索引（README）に反映した
