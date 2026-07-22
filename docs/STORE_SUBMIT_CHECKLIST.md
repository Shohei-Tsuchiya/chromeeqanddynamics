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

### 短い説明（日本語・132文字以内）

```
YouTubeなどの音をスタジオ品質に。4バンドEQ・コンプ・リミッターをリアルタイム適用。プリセット対応。初回はタブ再読み込みまたはブラウザ再起動を。
```

### 短い説明（英語・132文字以内）

```
Studio EQ, compressor & limiter for YouTube & more. Real-time Web Audio + presets. After install, reload the tab or restart Chrome.
```

### 詳細説明（日本語）

```
AuraAudio EQ & Dynamics は、ブラウザで再生する音声・動画を、スタジオ品質のサウンドに整える Chrome 拡張機能です。

YouTube、音楽配信、ゲーム実況、動画サイトなど、タブ内の音を Web Audio API でリアルタイム処理。面倒な外部ソフトは不要です。ポップアップを開いて ENABLE にするだけで、4バンド EQ・コンプレッサー・リミッターを直感的にコントロールできます。

━━━━━━━━━━━━━━━━
【初回インストール時のお願い】
━━━━━━━━━━━━━━━━
インストール直後は、必ず次のいずれかを行ってください。
・対象タブ（YouTube など）を再読み込みする
・または Chrome を再起動する

その後、拡張機能アイコンをクリック → ENABLE → ページ内を一度クリック（または再生し直し）すると効果が始まります。

━━━━━━━━━━━━━━━━
【主な機能】
━━━━━━━━━━━━━━━━
■ 4バンド・パラメトリック EQ
・周波数 / Q / ゲインをバンドごとに独立調整
・ゲイン範囲 ±24 dB、Q は 0.1〜2.0（中心 1.0 で操作しやすい設計）
・ライブ EQ カーブ表示で、音の変化を目で確認

■ コンプレッサー
・スレッショルド、レシオ、アタック、リリース
・入力ゲイン / 出力ゲインで音量とダイナミクスを整える

■ リミッター
・ピークを抑えてクリップを防止
・出力ゲイン調整に対応

■ プリセット管理
・お気に入り設定を 3 スロットに保存・呼び出し

■ マスター ON / OFF
・ツールバーから全体のバイパス切替
・アイコンの色で状態を表示（有効: 青 / 無効: グレー）
・Chrome 再起動後は自動で DISABLE（意図しない処理を防止）

━━━━━━━━━━━━━━━━
【使い方】
━━━━━━━━━━━━━━━━
1. 音を処理したいページで拡張機能アイコンをクリック
2. マスターを ENABLE にする
3. ページ内を一度クリックするか、再生を再開する
4. EQ / Comp / Limiter を調整（各ブロックの ACTIVE で個別バイパスも可能）

無効化時はエフェクトのみ OFF（音は継続）。完全に通常再生へ戻す場合は、ページを再読み込みしてください。

━━━━━━━━━━━━━━━━
【プライバシー】
━━━━━━━━━━━━━━━━
・個人データの収集・送信・販売は一切行いません
・設定は端末内にのみ保存
・分析・広告・トラッキングなし
・処理はポップアップを開いたタブのみ（activeTab）

詳細はストア掲載のプライバシーポリシーをご覧ください。
```

### 詳細説明（英語）

```
AuraAudio EQ & Dynamics brings studio-quality sound shaping to audio and video playing in Chrome.

Process YouTube, music streaming, game streams, and more in real time with the Web Audio API — no external audio software required. Open the popup, turn ENABLE on, and fine-tune a 4-band parametric EQ, compressor, and limiter with a clear visual interface.

━━━━━━━━━━━━━━━━
FIRST INSTALL — IMPORTANT
━━━━━━━━━━━━━━━━
Right after installing, please do one of the following:
• Reload the tab you want to process (e.g. YouTube), OR
• Restart Chrome

Then click the extension icon → set ENABLE → click once inside the page (or restart playback) to begin processing.

━━━━━━━━━━━━━━━━
FEATURES
━━━━━━━━━━━━━━━━
• 4-Band Parametric EQ
  - Independent Frequency / Q / Gain per band
  - Gain range ±24 dB; Q from 0.1 to 2.0 (centered at 1.0 for easier control)
  - Live EQ curve visualizer

• Compressor
  - Threshold, Ratio, Attack, Release
  - Input and output gain for level and dynamics control

• Limiter
  - Peak protection to help prevent clipping
  - Output gain control

• Presets
  - Save and recall up to 3 favorite setups

• Master ON / OFF
  - Bypass all processing from the toolbar
  - Icon color shows status (enabled: blue / disabled: gray)
  - Automatically returns to DISABLED after a Chrome restart

━━━━━━━━━━━━━━━━
HOW TO USE
━━━━━━━━━━━━━━━━
1. Open the page you want to process and click the extension icon
2. Turn the master switch to ENABLE
3. Click once on the page (or resume playback)
4. Adjust EQ / Comp / Limiter (use ACTIVE on each block for per-effect bypass)

When disabled, effects are off but audio continues. Refresh the page to return fully to native playback.

━━━━━━━━━━━━━━━━
PRIVACY
━━━━━━━━━━━━━━━━
• No personal data is collected, transmitted, or sold
• Settings stay on your device only
• No analytics, ads, or tracking
• Processing runs only on the tab where you open the popup (activeTab)

See the privacy policy linked on this listing for details.
```

### 画像アップロード（サイズ厳守）

| Dashboard の項目 | 使うファイル | サイズ |
|-----------------|-------------|--------|
| **ショップアイコン**（Store icon） | `store-assets/screenshots/store-icon-128x128.png` | **128×128** |
| **スクリーンショット** | `store-assets/screenshots/screenshot-1280x800.png` | **1280×800** |
| **小プロモタイル**（Small promo tile・必須） | `store-assets/screenshots/promo-small-440x280.png` | **440×280** |
| **マーキープロモタイル**（Marquee・任意） | `store-assets/screenshots/promo-marquee-1400x560.png` または `.jpg` | **1400×560**（24bit PNG / JPEG） |

> **注意:** `screenshot-1280x800.png` は **スクリーンショット欄** 用です。**ショップアイコン欄には使えません**（128×128 が必要）。

再生成: `powershell -ExecutionPolicy Bypass -File scripts\generate-store-images.ps1`

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
