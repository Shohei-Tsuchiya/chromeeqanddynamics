# Chrome Web Store 提出チェックリスト

**ZIP:** `dist/aura-audio-eq-dynamics-v1.0.zip`  
**プライバシーポリシー:** https://github.com/Shohei-Tsuchiya/chromeeqanddynamics/blob/main/PRIVACY.md  
**スクリーンショット:** `store-assets/screenshots/`（生成後）

---

## 1. 新規アイテム作成

1. [Developer Dashboard](https://chrome.google.com/webstore/devconsole) → **新しいアイテム**（New item）
2. ZIP をアップロード: `D:\work\dev_plugins\chrome-audio-effects-extension\dist\aura-audio-eq-dynamics-v1.0.zip`

---

## 2. ストアの掲載情報（Store listing）

| フィールド | 入力内容 |
|-----------|---------|
| **言語** | Japanese（日本語）を追加。English も追加可 |
| **拡張機能名** | `AuraAudio EQ & Dynamics` |
| **説明（短い）** | 下記「短い説明」をコピー |
| **説明（詳しい）** | 下記「詳細説明（日本語）」をコピー |
| **カテゴリ** | `Productivity` または `Entertainment` |
| **言語（English 欄がある場合）** | 下記英語文案を使用 |

### 短い説明（132文字以内）

```
Web Audio向け4バンドEQ・コンプ・リミッター。リアルタイム処理と3スロットプリセット対応。
```

### 詳細説明（日本語）

```
AuraAudio EQ & Dynamics は、Web ページの音声・動画にスタジオ品質のダイナミクス処理をリアルタイムで適用する Chrome 拡張機能です。

【主な機能】
• 4バンド・パラメトリック EQ — 周波数・Q・ゲインをバンドごとに調整。EQ カーブを可視化
• コンプレッサー — スレッショルド、レシオ、アタック、リリース、入出力ゲイン
• リミッター — ピーク保護
• プリセット 3 スロット — お気に入りの設定を保存・呼び出し
• マスター ON/OFF — ツールバーから全体のバイパス切替（アイコンで状態表示）

【動作】
ページ内のメディア要素の音声を Web Audio API で処理します。設定は端末内にのみ保存され、外部サーバーへ送信されません。

【注意】
インストール直後に音が出ない場合は、ページを一度再読み込みしてください。

【プライバシー】
分析・トラッキング・クラウド同期は一切行いません。
```

### 詳細説明（English・任意）

```
AuraAudio EQ & Dynamics brings studio-style dynamics processing to any tab playing audio or video.

FEATURES
• 4-Band Parametric EQ — adjust frequency, Q, and gain per band with a live curve visualizer
• Compressor — threshold, ratio, attack, release, input/output gain
• Limiter — protect peaks with threshold and output gain
• 3 preset slots — save and recall your favorite chains
• Master bypass — toggle all processing from the toolbar; icon reflects on/off state

Settings are stored locally on your device only — no data is sent to external servers.
If audio is silent after installing, refresh the page once.
```

### スクリーンショット

- 最低 **1 枚** アップロード（1280×800 推奨）
- `store-assets/screenshots/screenshot-1280x800.png` を使用

### 掲載アイコン

- 自動で ZIP 内 `icon.png`（128px）が使われます

---

## 3. プライバシー（Privacy）

| 項目 | 選択・入力 |
|------|-----------|
| **プライバシーポリシー URL** | `https://github.com/Shohei-Tsuchiya/chromeeqanddynamics/blob/main/PRIVACY.md` |
| **単一用途（Single purpose）** | 下記をコピー |
| **データの使用** | **個人データを収集していない**（Does not collect personal data） |
| **storage 権限** | 設定・プリセットを端末内に保存するため |
| **ホスト権限（http/https）** | ページ内の audio/video を Web Audio で処理するため |

### Single purpose

```
Apply parametric EQ, compression, and limiting to audio and video playback in web browser tabs using the Web Audio API.
```

### ホスト権限の説明（審査フォームに表示された場合）

```
This extension processes audio from media elements on web pages. Content scripts on http/https URLs are required to connect page media to the Web Audio processing graph. No page content is collected or transmitted.
```

---

## 4. 配布（Distribution）

| 項目 | 設定 |
|------|------|
| **公開範囲** | Public（一般公開） |
| **料金** | Free（無料） |
| **地域** | すべての地域（または必要に応じて限定） |

---

## 5. アカウント（Account）— 完了済み

- **EEA 消費者保護:** 非取引業者 ✓

---

## 6. 審査に提出

1. 各タブのエラー（赤い警告）をすべて解消
2. **Submit for review**（審査に提出）
3. 審査: 通常 **1〜3 営業日**

---

## 審査後

公開されたらストア URL を README に追記できます。  
更新時は `manifest.json` の version を上げ → ZIP 再生成 → Dashboard で新パッケージをアップロード。
