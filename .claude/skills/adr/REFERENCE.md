# ADR リファレンス

SKILL.md の補足。判断基準・運用ルール・形式比較・ツール・アンチパターンの詳細。

---

## 1. 判断基準：いつ ADR を書くか

### Nygard の「アーキテクチャ的に重要な決定」= 次に影響する決定

**構造 / 非機能特性 / 依存関係 / インターフェース / 構築技法**

### ASR テスト（Zimmermann）— 1つでも該当すれば書く

1. 高い事業価値またはリスクに紐づく
2. 重要ステークホルダー（スポンサー・コンプライアンス監査等）の関心事
3. 既存アーキテクチャの水準から大きく逸脱する品質要求
4. 予測/制御が難しい外部依存を導入・利用する
5. システム横断的な影響（セキュリティ・監視・認証など）
6. チームにとって初めての種類（first-of-a-kind）
7. 過去に問題（障害・予算超過・顧客不満）を起こした領域

### 実務的リトマス試験

「6か月後に入る新エンジニアが『なぜこうしたのか？』と疑問に思うか？」→ Yes なら書く。

### タイミング = Last Responsible Moment

「決定しないコスト」が「決定するコスト」を上回る直前まで遅らせる。早すぎる固定化による手戻りを避けつつ、停滞を招く前に決める。

### 書かないもの

些末・ルーチン・コードレベルで容易に元に戻せる決定（例: クラス名リネーム）、スタイル/整形。決定ログが100件を超えると読まれなくなる。**量より質**。

---

## 2. Status（ステータス）の運用

| Status | 意味 | 遷移 |
|:---|:---|:---|
| **Proposed** | 記述完了・レビュー待ち。**自由に編集してよい唯一の状態** | → Accepted / Rejected |
| **Accepted** | 合意成立・発効。日付と関係者を追記 | → Deprecated / Superseded |
| **Rejected** | 却下。**削除せず理由を残す**（蒸し返し防止） | 終端 |
| **Deprecated** | 無効化したが**後継なし** | 終端 |
| **Superseded by ADR-XXXX** | 新 ADR が置換 | 終端（新へリンク） |

### 不変性（Immutability）— 運用の要石

承認済み ADR は**編集も削除もしない**（誤字・リンク修正、supersede 時の Status/リンク更新を除く）。番号も再利用しない。決定を変えたいときは**新しい ADR を作って supersede** する。これが決定ログの信頼性を担保し、陳腐化と根拠喪失の両方を防ぐ。

---

## 3. 命名規則・ディレクトリ構成

```
docs/adr/                                   # 現代で最多。他に doc/adr/, docs/decisions/
  0001-record-architecture-decisions.md     # 最初は「ADRを使う決定」のメタADR
  0002-use-postgresql-for-primary-store.md
  0003-adopt-event-driven-messaging.md
  README.md                                 # 索引（ADL）
```

- 連番は**ゼロ埋め4桁**（事実上の標準）。単調増加・**再利用しない**。
- タイトルは **kebab-case**、`.md`。動詞の現在形を推奨（`choose-...`, `use-...`, `adopt-...`）。
- **1ファイル1決定**。

---

## 4. 形式（テンプレート）の比較

軽量 ←→ 重量: **Y-statements（1文）< Nygard（5項目）< MADR（任意項目つき）< Tyree & Akerman（14項目）**

| 形式 | フィールド | 向き |
|:---|:---|:---|
| **Nygard** | Title / Status / Context / Decision / Consequences | 標準・推奨デフォルト。簡潔で十分 |
| **MADR** | フロントマター(status/date/decision-makers/consulted/informed) + Context and Problem Statement / Decision Drivers / Considered Options / Decision Outcome(+Consequences/Confirmation) / Pros and Cons of the Options / More Information | 複数選択肢を比較検討した決定 |
| **Y-statement** | In the context of … facing … we decided for … and neglected … to achieve … accepting … (because …) | コミットメッセージ・インライン埋め込み |
| **Tyree & Akerman** | Issue/Decision/Status/Group/Assumptions/Constraints/Positions/Argument/Implications/Related decisions/requirements/artifacts/principles/Notes | 網羅的だが重い。源流。通常は不要 |

実テンプレートは `templates/` にある。

---

## 5. ツール

| ツール | 形式 | 概要 |
|:---|:---|:---|
| **adr-tools** (npryce) | bash CLI / Nygard | 事実上の標準。`adr new "Title"`（自動採番）、`adr new -s 9 "Title"`（**supersede 自動: 旧の Status と相互リンクを自動更新**）、`adr generate toc`（目次）、`adr generate graph`（関係図） |
| **Log4brains** | Node CLI + 静的サイト / MADR | `log4brains preview` でホットリロード Web UI、`build` で GitHub Pages 等へ公開。タイムライン・全文検索つきナレッジベース |
| **adr-manager** | ブラウザ GUI / MADR | adr.github.io/adr-manager。GitHub に OAuth 接続、CLI 不要で MADR を編集。非開発者向け |
| **adr-log** | npm / 索引生成 | `<!-- adrlog -->`〜`<!-- adrlogstop -->` マーカー間に索引を注入・再生成 |
| **pyadr / adr-tools-python** | Python / Nygard | 原典互換の Python port |

ツール一覧: https://adr.github.io/adr-tooling/

導入は任意。ツール無しでも、テンプレートをコピーして手で連番・索引を管理すれば十分運用できる。

---

## 6. アンチパターンと対策

| アンチパターン | 対策 |
|:---|:---|
| 承認済み ADR をその場で書き換える（履歴破壊） | 不変として扱い、**新 ADR で supersede** しリンク |
| 陳腐化（実装は移行済みなのに ADR は旧構成のまま） | コード隣に置いて同期。現実が変わったら supersede |
| 事後の追認（rubber-stamping） | 選択肢が**まだ開いている決定中**に書く |
| 曖昧で検証不能（「クラウドネイティブにする」等） | 具体的・テスト可能に。「〜する」で明確に |
| 複数決定の詰め込み | **1 ADR 1 決定** |
| 背景/代替案の欠落（決定だけ） | Context（力学）と検討した代替案を必須化 |
| ネガティブな帰結の省略 | 帰結はポジ/ネガ/中立すべて記載 |
| 誰も読まない | 主要ドキュメントから参照、軽量に保つ、読み合わせレビュー |
| 過剰文書化（>100件） | 重要性ゲートで取捨選択 |

---

## 7. supersede（置換）運用の具体手順

ADR A を新 ADR B が置き換えるとき、**双方向リンク**を記録する:

1. **新 B** を起票し、本文に `Supersedes [ADR-A](AAAA-....md)` を記載。
2. **旧 A** の Status を `Superseded by [ADR-B](BBBB-....md)` に書き換える（許可された唯一の本文変更）。
3. 索引（README）で A の Status を更新、B を追加。

完全な置換でない関係（Amends / Clarifies など）は、本文に注記してリンクで表現する。adr-tools を使う場合 `adr new -s <番号>` がこの相互更新を自動化する。

---

## 主要な情報源

- Michael Nygard "Documenting Architecture Decisions" (2011): https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- ADR コミュニティ（テンプレ/ツール一覧）: https://adr.github.io/
- MADR: https://adr.github.io/madr/ ・ https://github.com/adr/madr
- Olaf Zimmermann（Y-statements / ASRテスト / Last Responsible Moment）: https://ozimmer.ch/practices/2020/04/27/ArchitectureDecisionMaking.html
- AWS Prescriptive Guidance（ライフサイクル/不変性）: https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/
- ThoughtWorks Technology Radar（Lightweight ADRs, Adopt）: https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records
- Joel Parker Henderson（テンプレ集）: https://github.com/joelparkerhenderson/architecture-decision-record
