# MHWILDS 所持品チェッカー

MHWILDS の装備品や固定護石・鑑定護石について、所持状況をブラウザ内で
整理するための静的 Web アプリです。現在は React、TypeScript、Vite による
開発基盤と準備中画面だけを提供しています。

## 目的

- 検証可能な静的 Web アプリの基盤を用意する
- 所持情報を将来ブラウザ内だけに保存できる構成にする
- レビュー済みの契約を通じて、将来ゲームカタログを参照できるようにする

## 対象外

- アカウント、サーバー DB、Cookie、テレメトリー
- 実ゲームデータをこのリポジトリの正本として複製すること
- `mhwilds_skill_sim` の依存関係化、clone、fetch、submodule 化
- 現段階での Cloudflare 公開やデプロイ

## リポジトリ内ツールチェーン

Node.js は `24.18.0`、npm は `11.16.0` に固定しています。2026-07-24
時点でサポート中の LTS であり、Vite 8 と ESLint 10 の runtime 条件を
満たすためです。Node.js や npm の system installation、nvm、fnm、Volta、
global pip/npm は使用しません。

bootstrap は POSIX の system Python 3.10 以上からリポジトリ直下に `.venv`
を作成します。hash 固定した `nodeenv 1.10.0` をその仮想環境へ導入し、
`nodeenv --python-virtualenv` で固定版 Node.js/npm を同じ `.venv` に
インストールします。pip の bootstrap wheel と Node.js 公式 archive は、
固定 SHA-256 を検証したものだけを使用します。対応環境は Linux/WSL の
x64 と arm64 です。

Windows では PowerShell や native Python ではなく WSL から実行してください。
native Windows の Python 仮想環境は `.venv/Scripts` となり、このリポジトリが
要求する `.venv/bin` レイアウトを満たしません。shell の activate や rc の変更は
不要です。

```sh
./scripts/bootstrap.sh
./scripts/npmw ci
```

`scripts/nodew` と `scripts/npmw` は、それぞれ `.venv/bin/node` と
`.venv/bin/npm` を直接実行します。system Node/npm への fallback はありません。
pip、npm、一時ファイル、XDG、Corepack、Playwright の可変データはすべて
リポジトリ内の `.cache/` に限定されます。

## 開発

```sh
./scripts/npmw run dev
```

既定の公開 base path は `/game-guide/mhwilds-inventory-checker/` です。将来の
公開先を検証するときだけ、同一 origin の絶対 path を build 時に上書きできます。

```sh
VITE_BASE_PATH=/preview/inventory/ ./scripts/npmw run build
```

値は先頭と末尾が `/` である必要があり、URL、query、fragment、
バックスラッシュ、制御文字は受け付けません。

## 検証

```sh
./scripts/npmw run test
./scripts/npmw run lint
./scripts/npmw run typecheck
./scripts/npmw run build
./scripts/npmw run verify
```

`verify` は unit test、lint、typecheck、production build の順で実行します。
標準の再現検証は `bootstrap.sh`、`npmw ci`、`npmw run verify` の順です。

## 生成物

`.venv/`、`.cache/`、`node_modules/`、`dist/`、`coverage/`、`.build/`、
TypeScript build metadata、browser 生成物は commit しません。

## 参照リポジトリ

`trinitrotorol/mhwilds_skill_sim` は公開 GitHub の HTTPS read-only 情報と
`git ls-remote` だけで参照します。clone、shallow clone、fetch、submodule、
書き込みは行いません。必要な一時参照ファイルは
`.cache/reference-files/` にだけ保存します。

参照時点と採否は [docs/reference-baseline.md](docs/reference-baseline.md) に
記録しています。これはゲームデータや契約の正本ではありません。

commit message は [COMMIT_CONVENTION.md](COMMIT_CONVENTION.md) に従います。
