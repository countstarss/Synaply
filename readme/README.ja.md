<p align="center">
  <img src="../public/synaply-logo.png" alt="Synaply logo" width="120" />
</p>

<h1 align="center">Synaply</h1>

<p align="center">
  小規模スタートアップチームのためのリモートコラボレーションソフトウェア。
</p>

<p align="center">
  <a href="../README.md">English</a> ·
  <a href="./README.zh-CN.md">简体中文</a> ·
  <a href="./README.ko.md">한국어</a> ·
  <a href="./README.ja.md">日本語</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-active%20development-0a7ea4">
  <img alt="Frontend" src="https://img.shields.io/badge/frontend-Next.js%2015-111111?logo=nextdotjs">
  <img alt="Backend" src="https://img.shields.io/badge/backend-NestJS%2010-e0234e?logo=nestjs">
  <img alt="Database" src="https://img.shields.io/badge/database-PostgreSQL%20%2B%20Supabase-3ecf8e?logo=supabase">
  <img alt="ORM" src="https://img.shields.io/badge/ORM-Prisma-2d3748?logo=prisma">
  <img alt="API" src="https://img.shields.io/badge/API-REST%20%2B%20Swagger-f26b00">
  <img alt="License" src="https://img.shields.io/badge/license-ELv2-0a7ea4">
</p>

## 概要

<p align="center">
  <img alt="Synaply product preview" src="../public/synaply-1.png" />
</p>

Synaply は、小規模スタートアップチームがより速くリモートコラボレーションできるようにするためのソフトウェアです。目的は単にタスクを増やして管理することではなく、プロジェクト、課題、ワークフロー、ドキュメント、インボックス更新をひとつの実行文脈にまとめ、確認の往復を減らし、引き継ぎと前進をより明確にすることです。

これは汎用的なプロジェクト管理スイートではありません。より少ない摩擦とより高い明確さで仕事をデリバリーまで進めることに集中したプロダクトです。

## なぜ Synaply なのか

リモートチームが失速する理由は、十分なタスクを作れないからではないことがほとんどです。問題は次のようなものです。

- 引き継ぎの責任が曖昧になる
- ブロッカーが見えにくい
- 意思決定の文脈が散らばる
- 今何を優先すべきかが分かりにくい

Synaply はこうした瞬間を構造化します。

- `Project` で範囲と方向を定義する
- `Issue` で実行可能な仕事を持つ
- `Workflow` で進行と引き継ぎを見えるようにする
- `Doc` で文脈と判断を残す
- `Inbox` で変化と次のアクションを集約する

## コアモデル

Synaply のコアチェーンは次の通りです。

`Project -> Issue -> Workflow -> Doc -> Inbox`

このチェーンがプロダクトの重心です。新しい機能はこの流れを強化すべきであり、プロダクトを内蔵チャット、重い計画ツール、エンタープライズ向けのワークフロー自動化へ引っ張るべきではありません。

## Synaply に含まれるもの

- チーム実行のためのプロジェクトとワークスペース構造
- 担当者、優先度、ワークフロー状態を持つ課題管理
- 視覚的なワークフロー編集とステップのオーケストレーション
- 独立したサイロではなく、実行対象に結びついたドキュメント
- 非同期調整のためのインボックスとアクティビティ画面
- 補助的なワークフローを支える AI 実行と AI スレッドモジュール
- コラボレーションループを支える Team、Comment、Calendar、Task モジュール
- 国際化ルートと多言語プロダクト画面

## アーキテクチャ

Synaply は単一リポジトリの pnpm workspace モノレポとして構成されています。

- [`apps/frontend`](../apps/frontend): Next.js アプリケーション
- [`apps/backend`](../apps/backend): NestJS API サービス
- [`supabase`](../supabase): ローカル Supabase 設定、マイグレーション、シードデータ

大まかな役割分担は次の通りです。

- フロントエンドはプロダクト UI、クライアント状態、ドキュメント編集、ワークフロー可視化、国際化ルートを担当します。
- バックエンドはプロジェクト、課題、ワークフロー、ドキュメント、インボックス、認証、AI 実行などのドメイン API を提供します。
- Supabase は認証と PostgreSQL ベースのローカル開発インフラを提供します。

## 技術スタック

### プロダクトとプラットフォーム

- Frontend: Next.js 15, React 19, TypeScript
- Backend: NestJS 10, REST APIs, Swagger
- Database: PostgreSQL
- Auth and local infra: Supabase
- ORM: Prisma 7

### UI とクライアント体験

- Tailwind CSS 4
- Radix UI primitives
- shadcn/ui スタイルのコンポーネント構成
- Framer Motion
- Sonner
- next-intl

### コラボレーションと編集

- リッチドキュメント編集のための BlockNote
- ワークフロー可視化のための React Flow
- 協調編集とローカルファースト編集を支える Yjs、`y-websocket`、`y-indexeddb`
- インタラクションパターンのための `@dnd-kit/react`

### AI とデータレイヤー

- Anthropic 互換のカスタム AI ランタイム
- TanStack Query
- Zustand
- Dexie

## 主なオープンソースライブラリ

コードベースの中で特に目立つ主要なオープンソース要素は次の通りです。

- `next`, `react`, `typescript`
- `@nestjs/*`
- `@prisma/client`, `prisma`
- `@supabase/supabase-js`, `@supabase/ssr`
- `@blocknote/core`, `@blocknote/react`, `@blocknote/mantine`
- `reactflow`
- `next-intl`
- `framer-motion`
- `@tanstack/react-query`
- `zustand`, `dexie`
- `@radix-ui/react-*`

## クイックスタート

### 前提条件

- Node.js 20.19+ または 22.12+
- pnpm
- Supabase CLI

### 1. リポジトリをクローンする

```bash
git clone <your-repo-url>
cd Synaply
```

### 2. ローカル Supabase スタックを起動する

リポジトリルートで次を実行します。

```bash
supabase start
```

このプロジェクトにはローカル開発に必要な Supabase 設定、マイグレーション、シードデータが [`supabase`](../supabase) に含まれています。

### 3. 環境変数を設定する

バックエンド:

```bash
cp apps/backend/.env.example apps/backend/.env
```

フロントエンド:

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
```

重要な値:

- Backend uses `PORT`, `CORS_ORIGINS`, `DATABASE_URL`, `SUPABASE_URL`, `JWT_SECRET`
- Frontend uses `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BACKEND_URL`
- AI 関連のフロントエンドサーバー環境変数として `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`, または `ANTHROPIC_API_KEY` を利用できます

### 4. 依存関係をインストールする

リポジトリルートで workspace 全体の依存関係を一度にインストールします。

```bash
pnpm install
```

### 5. サービスを起動する

バックエンド、1つ目のターミナル:

```bash
pnpm dev:backend
```

フロントエンド、2つ目のターミナル:

```bash
pnpm dev:frontend
```

### 6. ローカルアプリを開く

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend health: [http://localhost:5678/health](http://localhost:5678/health)
- Backend Swagger: [http://localhost:5678/api](http://localhost:5678/api)
- Supabase Studio: [http://127.0.0.1:54323](http://127.0.0.1:54323)

## リポジトリ構成

```text
Synaply/
├── supabase/             # ローカル Supabase 設定、マイグレーション、シードデータ
├── apps/backend/      # NestJS バックエンドサービス
├── apps/frontend/     # Next.js フロントエンドアプリケーション
├── DEPLOYMENT.md         # デプロイメモ
├── AGENTS.md             # プロダクトとエージェント向けガイド
└── notes/                # プロダクトと計画メモ
```

## API と開発エントリーポイント

- REST health check: `GET /health`
- Swagger docs: `/api`
- フロントエンドの国際化アプリルートは [`apps/frontend/src/app/[locale]`](../apps/frontend/src/app/%5Blocale%5D) にあります

## デプロイ

詳細なデプロイ手順とローカル実行方法は [`DEPLOYMENT.md`](../DEPLOYMENT.md) を参照してください。

Synaply を GitHub で公開リリースする準備をしている場合は [`OPEN_SOURCE_READINESS.md`](../OPEN_SOURCE_READINESS.md) も確認してください。

## プロジェクトの状態

Synaply は現在もアクティブに開発中です。リポジトリには主要なプロダクト構成要素がすでに含まれていますが、README はすべてのワークフローが最終確定したという宣言ではなく、プロダクトの地図として読むのが適切です。

現在の最重要方向性は次の通りです。

- `Project -> Issue -> Workflow -> Doc -> Inbox` のチェーンを強化する
- 引き継ぎとブロッカーをより明示的にする
- プロダクトをチャット中心のツールにせず、非同期のチーム可視性を高める

## コントリビューション

コントリビューション、Issue、そして焦点の定まったプロダクトフィードバックを歓迎します。

コントリビュータ向けのワークフローと期待値については [`CONTRIBUTING.md`](../CONTRIBUTING.md) を参照してください。

貢献を考えている場合は、次のような改善を優先してください。

- 役割をまたぐ引き継ぎをより明確にする
- リモート協業で繰り返される状況確認や追いかけを減らす
- プロジェクト、課題、ワークフロー、ドキュメントの共有文脈をより強くする

コアの協業ループが十分に強くなる前に、Synaply を大規模な管理スイートへ広げるのは避けるべきです。

## ライセンス

Synaply は [`Elastic License 2.0`](../LICENSE) の下で提供されています。

つまり、このリポジトリは公開されていてソース利用可能ですが、OSI 承認のオープンソースプロジェクトとして説明すべきではありません。

ELv2 の下では、内部利用、改変、再配布が認められます。Synaply 自体をホスト型またはマネージドサービスとして提供するには、ELv2 を超える権利が必要であり、別途商用ライセンスで扱う想定です。

セキュリティ報告の方法については [`SECURITY.md`](../SECURITY.md) を参照してください。
