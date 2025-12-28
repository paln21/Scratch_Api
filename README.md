# Scratch API Tool (Node.js)

[English](#english) | [日本語](#japanese)

---

<a name="english"></a>
## 🇬🇧 English

### Overview
This is a Command Line Interface (CLI) tool built with Node.js to interact with the Scratch API.
You can log in using your Scratch username/password or use an existing `X-Token` to access data such as unread message counts, user profiles, and project statistics.

**Features:**
* **Bilingual Support:** Select English or Japanese at startup.
* **Authentication Methods:**
    * Login with Username & Password (handles CSRF & Session Cookies).
    * Manual Authentication using an existing `X-Token`.
* **Functions:**
    * Check unread message count.
    * View user profile information.
    * Get project statistics (Views, Loves, Favorites) by ID.

### Prerequisites
* **Node.js**: (Version 12.x or higher is recommended)

### Installation

1.  Clone this repository or download the source code.
2.  Open your terminal in the project directory.
3.  Install the required dependencies:

```bash
npm install axios axios-cookie-jar-support tough-cookie inquirer@8
Note: We specify inquirer@8 to ensure compatibility with CommonJS (require).
```
### Usage
Run the script with the following command:

```Bash
node index.js
```
### Steps:
* Select Language: Choose English.
* Select Authentication:
    * Login: Enter your Scratch username and password.
    * Token: Enter your username and paste your X-Token.
    * Select Action: Use the arrow keys to choose an action from the menu.

### Disclaimer
* Security
    * This tool runs locally on your machine.
    * Your password is sent directly to Scratch's servers for login and is never saved to any file or sent to third parties.
    * However, please use it at your own risk.
    * API Usage: This tool uses the Scratch API.
    * Please use it responsibly and avoid sending excessive requests (spamming) that could burden the Scratch servers.
* Translate By Gemini

<a name="japanese"></a>

## 🇯🇵 日本語
### 概要
Node.jsで作成された、Scratch APIを操作するためのコマンドラインツール(CLI)です。 ユーザー名とパスワードでログインするか、既存の X-Token を使用して、未読メッセージ数やプロフィール、プロジェクトの統計情報などを取得できます。

**特徴:**
* **多言語対応:** 起動時に日本語か英語を選択できます。
* **認証方法:** 
    * ユーザー名とパスワードによるログイン（CSRFトークン/Cookie自動処理）
    * 既存の X-Token を直接入力しての認証
* **機能:**
    * 未読メッセージ数の確認
    * ユーザープロフィール情報の表示
    * プロジェクトIDを指定して統計情報（参照数、ハート、スター）を取得

### 前提条件
 * Node.js: (バージョン12.x以上推奨)

### インストール方法
1. このリポジトリをクローンするか、ソースコードをダウンロードします。
2. ターミナル（コマンドプロンプト）でプロジェクトのフォルダを開きます。
3. 必要なライブラリをインストールします:

```Bash
npm install axios axios-cookie-jar-support tough-cookie inquirer@8
```
注意: require 構文で動作させるため、inquirer はバージョン8を指定しています。

### 使い方
以下のコマンドでツールを起動します:
```Bash
node index.js
```
### 操作手順:
* 言語選択: 日本語 を選択します。
* 認証方法の選択:
    * ログイン: Scratchのユーザー名とパスワードを入力します。
    * Token: ユーザー名と、取得済みの X-Token を貼り付けます。
    * アクション選択: 矢印キーで実行したい操作を選んでエンターキーを押します。

### 免責事項・注意点
* セキュリティ
    * このツールはPC上でローカルに動作します。
    * 入力したパスワードはログインのためにScratchサーバーへ送信されます。
    * ファイルに保存されたり第三者に送信されることはありません。
    * 使用は自己責任です。
    * Scratchのサーバーに負荷をかけるような過剰なアクセスは**控えてください。**

