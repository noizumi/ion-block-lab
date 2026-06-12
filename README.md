# イオンブロック・ラボ

陽イオンと陰イオンのブロックを「価数＝幅」で組み合わせ、組成式と物質名を学ぶWebアプリ。
中学校理科（イオン結合性の物質）向け。iPad横画面での利用を主に想定。

## ファイル構成

```
ion-block-lab/
├ index.html              … エントリHTML（フォント読み込み・タイトル）
├ package.json            … 依存関係とスクリプト
├ vite.config.js          … ビルド設定（base をリポジトリ名に合わせる）
├ .gitignore
├ .github/workflows/deploy.yml … GitHub Actions 自動デプロイ（方法B）
└ src/
   ├ main.jsx             … Reactのマウント
   └ App.jsx              … アプリ本体（全ロジック・全UI）
```

## ローカルでの動作確認

```bash
npm install
npm run dev        # http://localhost:5173 で起動
```

## GitHub Pages へのデプロイ

事前に `vite.config.js` の `base` を公開URLに合わせて変更すること
（リポジトリ名が ion-block-lab なら "/ion-block-lab/" のまま）。

### 方法A：gh-pages パッケージ（element-quiz と同様の手軽な方法）

```bash
npm run deploy
```

`gh-pages` ブランチに dist が公開されます。初回はリポジトリの
Settings → Pages → Source を「Deploy from a branch」、Branch を
`gh-pages` / `(root)` に設定してください。

### 方法B：GitHub Actions（push するだけで自動デプロイ）

1. Settings → Pages → Source を「GitHub Actions」に設定
2. main ブランチに push すると `.github/workflows/deploy.yml` が
   自動でビルド・公開します

## 調整しやすい設定値（src/App.jsx）

- `TA_SET` … タイムアタックの出題構成（★1/★2/★3の問題数）
- `TA_MISS_LIMIT` … 記録対象外となるミス数
- `gradeForSeconds()` … SS/S/A/B/C のタイム閾値
- `QUIZ` … 出題リスト（イオンの組と難易度）
- `FACTS` … 結合成功時に表示する豆知識
- `MAX_BLOCKS` … 1種類のイオンにつき置けるブロックの上限
- `ELEMENTS` … 電荷クイズの元素データ（ans の値は授業での扱いに合わせて変更可）
- `gradeForChargeSeconds()` … 電荷クイズのタイム閾値
- `TA_CELEB_MS` / `CHARGE_CELEB_MS` … 正解表示の時間（この間タイムは停止）
- ベスト記録は localStorage（キー: `ionblock_best_v1` / `ionblock_charge_best_v1`）に端末ローカルで保存
