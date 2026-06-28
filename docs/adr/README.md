# Architecture Decision Records

このディレクトリはプロジェクトのアーキテクチャ意思決定記録（ADR）を保持する。
ADR とは何か・なぜ使うかは [ADR-0001](0001-record-architecture-decisions.md) を参照。

新しい決定は ADR を追加して記録する。既存の決定を変えるときは編集せず、
新しい ADR を作って旧 ADR を supersede する（不変性の原則）。

## 一覧

| # | タイトル | Status |
|:--|:---------|:-------|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](0002-icon-house-signature-treatment.md) | 全アイコンに一律のハウス署名トリートメントを焼き込む | Accepted |
<!-- 新しい ADR を起票したらこの表に1行追加する。
     supersede したら旧行の Status を「Superseded by [ADR-XXXX](XXXX-....md)」に更新する。 -->

## 規約

- ファイル名: `NNNN-kebab-case-title.md`（連番はゼロ埋め4桁・再利用しない）
- 1ファイル1決定
- Status: `Proposed → Accepted → (Deprecated | Superseded by ADR-XXXX)`
