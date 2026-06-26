# Chrome Web Store 掲載文案（AuraAudio EQ & Dynamics）

GitHub 公開後、プライバシーポリシー URL に  
`https://github.com/Shohei-Tsuchiya/chromeeqanddynamics/blob/main/PRIVACY.md`  
を指定してください。

---

## 基本情報

| 項目 | 内容 |
|------|------|
| 拡張機能名（日本語） | AuraAudio EQ & Dynamics |
| 拡張機能名（英語） | AuraAudio EQ & Dynamics |
| カテゴリ | Productivity または Entertainment |
| 言語 | 日本語（primary）、English |

---

## 短い説明（132文字以内・英語推奨）

```
4-band parametric EQ, compressor & limiter for web audio. Real-time Web Audio processing with presets.
```

## 詳細説明（英語）

```
AuraAudio EQ & Dynamics brings studio-style dynamics processing to any tab playing audio or video.

FEATURES
• 4-Band Parametric EQ — adjust frequency, Q, and gain per band with a live curve visualizer
• Compressor — threshold, ratio, attack, release, input/output gain
• Limiter — protect peaks with threshold and output gain
• 3 preset slots — save and recall your favorite chains
• Master bypass — toggle all processing from the toolbar; icon reflects on/off state

HOW IT WORKS
The extension intercepts media elements on web pages and routes audio through a Web Audio graph. Settings are stored locally on your device only — no data is sent to external servers.

NOTE
If audio is silent after installing, refresh the page once so the browser can start the audio context.

PRIVACY
No analytics, no tracking, no cloud sync. See the privacy policy linked on this listing.
```

## 詳細説明（日本語・ストアの日本語欄用）

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

---

## Single purpose（単一目的の説明）

```
Apply parametric EQ, compression, and limiting to audio and video playback in web browser tabs using the Web Audio API.
```

---

## 権限の正当化（審査用メモ）

| 権限 | 説明 |
|------|------|
| `storage` | EQ / コンプ / リミッター設定と 3 つのプリセットスロットを端末内に保存するため |
| Host permission（http/https） | ページ上の `<audio>` / `<video>` 要素を Web Audio グラフに接続し、リアルタイムでエフェクトを適用するため |

---

## スクリーンショット（必須）

最低 **1 枚**（推奨 3〜5 枚、1280×800 または 640×400）。

### 撮影手順

1. YouTube など音楽が流れるページを開く
2. 拡張ポップアップを開き、EQ カーブが見える状態にする
3. Windows: `Win + Shift + S` で範囲キャプチャ
4. 推奨ショット:
   - メイン UI 全体（EQ カーブ + 3 ブロック）
   - EQ バンド調整中（カーブが変化している状態）
   - プリセット管理セクション
   - マスター OFF 時のグレーアイコン（小プロモ用 440×280 も任意）

保存先: `store-assets/screenshots/`（Git には含めなくて OK）

---

## プロモーション用タイル（任意）

- **Small promo tile:** 440 × 280 px
- **Marquee promo tile:** 1400 × 560 px

`icon.png` をベースに Canva 等で「AuraAudio EQ & Dynamics」のテキストを添えると十分です。

---

## アップロード手順

1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) にログイン  
   （初回は **$5 の開発者登録料** が必要）
2. **New item** → `dist/aura-audio-eq-dynamics-v1.0.zip` をアップロード
3. ストア掲載情報・スクリーンショット・プライバシーポリシー URL を入力
4. **Privacy practices** で「ユーザー個人データを収集しない」を選択
5. **Submit for review**（通常 1〜3 営業日）

---

## 審査で聞かれやすい点

- **広い host permission:** 任意のサイトのメディアにエフェクトをかける拡張のため http/https 全体が必要。Single purpose と権限説明を明記。
- **音が出ない:** ユーザー向けに README / ストア説明に「ページ再読み込み」を記載済み。
