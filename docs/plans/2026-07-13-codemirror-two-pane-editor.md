# エディタをCodeMirror 6 + 2ペイン構成に移行

## 概要・やりたいこと

現在のノートエディタ(Vditor IRモード、Typoraライク1カラム)は、Markdown⇄DOM同期に起因する編集バグが多い(箇条書きが削除できない等)。ラッパー側でカーソル復元・スクロール退避などのワークアラウンドを重ねてきたが(計1,000行超)、根本原因はIR方式そのものにあるため、**編集と表示を分離した2ペイン構成**に移行する。

- 左ペイン: CodeMirror 6によるプレーンMarkdown編集
- 右ペイン: 既存 `MarkdownViewer`(公開ページと同一のレンダラ)によるプレビュー

これにより「編集中に見える姿 = 公開後の姿」が保証され、IR方式の同期バグが原理的に消える。

## 前提・わかっていること

### 現状

- エディタ: Vditor v3.11.2(IRモード)+ 自前ラッパー `apps/web/src/components/editor/vditor-editor.tsx`(633行)
- 使用箇所は2つ: `app/(authenticated)/notes/[uuid]/page.tsx` と `components/new-note-form.tsx`。ほかにPoCページ `app/(authenticated)/poc/editor/page.tsx`
- 公開ページ(`/p/[uuid]`, `/articles/[uuid]`)は `components/markdown-viewer.tsx` の `variant="public"`(Zenn風 `znc` + ベアリンクの `LinkCard` 化)で描画。エディタとは完全に別実装
- 添付ファイルのMarkdownは標準記法(`![name](url)` / `[📄 name](url)`)なのでreact-markdownでそのまま描画可能
- `lib/markdown-table.ts`(218行)は純粋なテキスト操作なので新エディタでもそのまま使える
- `globals.css` にVditor向け上書きが36箇所以上ある
- auto-save(`useAutoSave`)・Cmd+S・離脱警告はページ側の実装でエディタ非依存

### /dig での決定事項

| 論点 | 決定 |
|---|---|
| 表示モード | Edit / Split / View の3モード切替。localStorageに永続化、デスクトップ初期値はSplit。モバイルは1ペイン+タブ切替 |
| Split時の幅 | コンテナを900px制限から広げて左右50%。Edit/View時は現行どおり中央寄せ900px |
| プレビュー | `MarkdownViewer variant="public"` を流用(DOM/レンダリングは公開ページと同一)。更新は300msデバウンス |
| プレビューの配色 | `.znc` は `color: #333` などライトテーマ前提のため、ダークなワークスペース上では**プレビュー面自体をライト背景のカード**にする(公開ページと文字通り同じ見た目になる)。zncのダーク対応CSSは作らない |
| LinkCardのOGP連打対策 | デバウンスだけでは再マウント時に再fetchされる(`link-card.tsx` はマウントごとにuseEffectでfetch、キャッシュなし)ため、**OGP結果をURL単位でモジュールレベルキャッシュ**する(公開ページ側にもそのまま効く) |
| スクロール同期 | 割合ベースの一方向(エディタ→プレビュー) |
| 引き継ぐ機能 | 画像/ファイルのペースト・D&Dアップロード、URL自動リンク化、テーブル操作UI(TableToolbar)、フローティングツールバー(Cmd+/) |
| CodeMirror構成 | `@codemirror/lang-markdown`(ハイライト+リスト自動継続)+ ワークスペースCSS変数に合わせたカスタムダークテーマ + 記法ショートカット(Cmd+B等) |
| 撤去 | Vditor依存・vditor-editor.tsx・関連CSS・poc/editorページを完全削除 |
| ドキュメント | ADR 0014を新規作成(0010をsupersede)。日本語下書き → `.private/` → 英語版を `docs/adr/` |
| PR | 1PRで一括 |

### 受け入れ条件

- 箇条書きの削除(backspace)が正常に動くこと
- 基本編集操作の確認: 日本語IME入力、リスト継続、コードブロック、テーブル編集、画像ペースト、undo/redo
- 公開ページの表示は現状から変化しないこと
- Split / Edit / View の各モードで、タイトル・子ノート・本文の縦スクロールと最小高さが崩れないこと

## 実装計画

### Phase 1: CodeMirrorエディタのコア実装 [AI🤖]

- [x] `codemirror` / `@codemirror/lang-markdown` / `@codemirror/language-data` 等の依存を追加し、`vditor` を削除
- [x] `components/editor/codemirror-editor.tsx` を新規作成
  - value/onChange のcontrolledインターフェース(現 `VditorEditorProps` 相当)
  - **controlled更新の方針**: EditorViewは一度だけ生成し、`updateListener` からref経由で最新のonChangeを呼ぶ。prop `value` は「現在のdocと異なる外部更新」のときのみ `dispatch` で反映し、通常入力ではdocを再設定しない(React再描画ごとの全置換は選択範囲・Undo履歴・IME変換を壊すため)
  - `@codemirror/lang-markdown` によるハイライト+Enterでのリスト自動継続
  - ワークスペースCSS変数(`--workspace-*`)に合わせたカスタムダークテーマ
  - 記法ショートカット: Cmd+B(太字)、Cmd+Shift+X(打消し)等
  - 行折り返し(`EditorView.lineWrapping`)
- [x] ペースト/D&Dアップロードを移植(マーカーハック・TreeWalkerカーソル復元は廃止)
  - **非同期完了時の挿入位置ズレ対策**: 挿入予約位置をStateField + placeholder decorationで追跡し、アップロード中の編集・undoはCodeMirrorのposition mappingで自動追従させる
  - 成功時はマップ済み位置でplaceholderをMarkdownに置換、失敗時はplaceholderを除去してエラー表示。複数同時アップロードも各予約が独立して動くこと
- [x] URL自動リンク化を移植: URLペースト時に `[url](url)` へ変換

### Phase 2: 2ペインレイアウトとモード切替 [AI🤖]

- [x] `components/editor/markdown-workspace.tsx`(仮称)を作成: Edit / Split / View の3モード
  - モード切替UIをエディタ上部に配置、選択をlocalStorageに永続化(デスクトップ初期値: Split)
  - **hydration mismatch回避**: localStorageの読取はマウント後のuseEffectで行い、初期描画はデフォルト値で行う
  - Split時はコンテナ幅を広げて左右50%、Edit/View時は中央寄せ900px
  - モバイル(ブレークポイント未満)は1ペイン+タブ切替
- [x] プレビューペイン: `MarkdownViewer variant="public"` を300msデバウンスで描画
  - `.znc` はライトテーマ前提(`color: #333`)のため、プレビュー面をライト背景のカード(公開ページと同じ配色)として描画する
- [x] LinkCardにOGPのURL単位モジュールレベルキャッシュを追加(プレビュー再描画での再マウント時にfetchが再実行されるのを防ぐ)
  - 結果だけでなく進行中リクエストも共有する(`Map<url, Promise<OgpData>>`): 同URLのLinkCardが同時にマウントされても fetch は1本
  - 失敗時はキャッシュエントリを削除し、次回マウントで再試行可能にする
- [x] スクロール同期: エディタのスクロール割合をプレビューに一方向反映
- [x] `notes/[uuid]/page.tsx` と `new-note-form.tsx` を新コンポーネントに差し替え

### Phase 3: 付加機能の移植 [AI🤖]

- [x] TableToolbar移植: テーブル判定はCodeMirrorの**構文木**を使う(現 `use-table-detection.ts` のDOM探索は廃止)
  - `markdown({ base: markdownLanguage })` でGFM拡張を有効化すると構文木に `Table` ノードが載るため、カーソル位置の `syntaxTree` を遡って `Table` ノード内か判定する。「行に `|` を含む」だけの判定はしない(コードブロック・引用・通常文のパイプを誤検知するため)
  - `Table` ノードのfrom/toからテーブル範囲を直接取得し、`markdown-table.ts` の操作を適用。操作後のカーソルは「操作前と同じ行・列のセル先頭」に復元する
- [x] `markdown-table.ts` の表候補判定(`|` を含む行、`markdown-table.ts:66` 付近)も、構文木由来の範囲を受け取る形に整理して誤検知経路を塞ぐ
- [x] フローティングツールバー(Cmd+/)移植: 挿入系アクションをCodeMirrorトランザクションで実装

### Phase 4: Vditor撤去とドキュメント [AI🤖]

- [x] `vditor-editor.tsx`・`use-table-detection.ts`(DOM版)・`poc/editor` ページを削除
- [x] `globals.css` のVditor向け上書きを削除: `.vditor*` 系に加え、Vditor専用の `.note-editor` ルール(globals.css:219-300前後)も対象。新エディタで流用するルールがないか確認してから消す
- [x] `package.json` から `vditor` を削除し、未使用依存がないか確認
- [x] ユニットテスト追加(vitestを最小構成で導入。webアプリには現在テスト基盤がない)。誤検知防止の責務はレイヤーで分離する:
  - 構文木→Table範囲抽出ヘルパー: コードブロック内・引用内・通常文のパイプをテーブルとして扱わないこと(構文木を持つのはこの層なので、誤検知テストはここで保証)
  - `markdown-table.ts`: 正しい表範囲を渡された前提での抽出・置換・行列操作(純粋な文字列ユーティリティとしてテスト)
  - アップロード予約位置のposition mappingヘルパー: 挿入中の編集・undo・複数同時アップロードで位置が正しく追従すること
- [x] ADR下書き(日本語)を `.private/` に作成 → 英語版 `docs/adr/0014-*.md` をコミット、`0010` のStatusを `Superseded by 0014` に更新

### 動作確認 [AI🤖 + 人間👨‍💻]

- [x] [AI🤖] `npm run lint` / `npm run build` / ユニットテスト(vitest 22件)が通ること
- [x] [AI🤖] agent-browserで各モードのレイアウト確認: Split/Edit/Viewそれぞれでタイトル・子ノート・本文の縦スクロールと最小高さが崩れないこと(モバイル375pxはEdit/Viewタブのみ表示も確認)
- [x] [AI🤖] agent-browserで基本操作を確認: 箇条書きの入力と削除(Backspace12回で行が綺麗に消える)、リスト自動継続、コードブロック内パイプの誤検知なし、テーブル操作UI(行追加+celldown整形)、undo、Cmd+B、Cmd+/ツールバー、モード切替+localStorage永続化、スクロール同期(51%→50.7%)、公開ページの表示が不変であること
- [ ] [人間👨‍💻] 日本語IME入力(漢字変換・変換候補位置)の目視確認
- [ ] [人間👨‍💻] 画像ペースト(クリップボードのスクリーンショット)の確認
- [ ] [人間👨‍💻] 数日実運用して操作感を確認

## ログ

### 試したこと・わかったこと
- アップロードのplaceholder decorationは、予約位置を含む範囲が削除されるとRangeSetのmapで自動除去される（位置がclampされるのではなくnullになる）。エディタ側は「現在カーソル位置にフォールバック」で対応し、テストでこの仕様を明文化した
- `markdown-table.ts` の行スキャン系関数（extractTableAtCursor / replaceTableInMarkdown / toTableCursor / toFullCursor / getCursorPositionInMarkdown）は構文木ヘルパー導入で全て未使用になったため削除。celldownラッパー（applyTableOperation）だけ残した
- Next 16のeslint(react-hooks新ルール)は「render中のref書き込み」「effect内の同期setState」をエラーにする。前者はモード条件をpropで渡す形に、後者はssr:false前提のlazy initializerでlocalStorage/matchMediaを読む形に変更した
- ブラウザ検証で発見・修正したバグ2件: ① CodeMirrorの`defaultKeymap`は`Mod-/`を`toggleComment`に割り当てており、Cmd+/がツールバー起動とHTMLコメント挿入の両方を発火していた → keymapで`Mod-/`を先取りして握りつぶす。② `EditorView.domEventHandlers`はcontentDOMに登録されるがscrollイベントは`.cm-scroller`で発生しバブルしないため、スクロール同期が一度も発火していなかった → `view.scrollDOM`に直接リスナーを張る

### 方針変更
- Phase 3（テーブルUI・フローティングツールバー移植）はエディタコンポーネント本体と密結合のためPhase 1と同時に実装した（進行順の変更のみ、内容の変更なし）
