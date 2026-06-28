# Y-statement（1文形式 / Olaf Zimmermann）

コミットメッセージ・PR 説明・コード近傍に1文で埋め込む軽量形式。
7要素（最後の because は任意）。

## テンプレート

> In the context of **<ユースケース/コンポーネント>**,
> facing **<非機能的な懸念/必要性>**,
> we decided for **<採用案>**
> and neglected **<不採用案>**,
> to achieve **<得たい品質/便益>**,
> accepting **<受け入れる欠点/帰結>**,
> because **<追加の根拠（任意）>**.

## 記入例

> In the context of **ユーザー認証サービス**,
> facing **複数クライアント（Web/モバイル）でのセッション共有の必要性**,
> we decided for **ステートレスな JWT トークン**
> and neglected **サーバーサイドのセッションストア**,
> to achieve **水平スケールの容易さと低レイテンシ**,
> accepting **トークン失効が即時には効かない点**,
> because **失効はリフレッシュトークンの短い有効期限で緩和できるため**.
