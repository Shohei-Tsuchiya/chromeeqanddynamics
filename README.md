# AuraAudio EQ & Dynamics

Chrome 拡張機能。Web ページ上の `<audio>` / `<video>` に **4バンド・パラメトリック EQ**、**コンプレッサー**、**リミッター** を Web Audio API でリアルタイム適用します。

**リポジトリ:** https://github.com/Shohei-Tsuchiya/chromeeqanddynamics

## 機能

- **4-Band Parametric EQ** — 各バンドの周波数・Q・ゲインを独立調整。EQ カーブをポップアップ上で可視化
- **Compressor** — Threshold / Ratio / Attack / Release / Input & Output Gain
- **Limiter** — Threshold / Output Gain
- **プリセット** — 3 スロットに設定を保存・読み込み
- **マスター ON/OFF** — ツールバーアイコンが状態に連動（有効: 青 / 無効: グレー）

## インストール（開発者モード）

1. このリポジトリをクローンまたは ZIP で取得
2. Chrome で `chrome://extensions` を開く
3. **デベロッパーモード** を ON
4. **パッケージ化されていない拡張機能を読み込む** → このフォルダを選択

## 使い方

1. 拡張機能アイコンをクリックしてポップアップを開く
2. EQ / Comp / Limiter を調整（各ブロックの **ACTIVE** で個別バイパス）
3. マスタースイッチで全体 ON/OFF
4. 音が出ない場合は **対象ページを再読み込み**（Web Audio のユーザー操作要件のため）

## プロジェクト構成

```
manifest.json      MV3 マニフェスト
background.js      ツールバーアイコン切替
content.js         Web Audio グラフ（EQ / Comp / Limiter）
settings.js        デフォルト設定・ストレージキー
popup.html/css/js  設定 UI
icon*.png          拡張アイコン
generate-icons.js  アイコン生成（開発用・Node.js 不要）
```

## アイコンの再生成

```powershell
node generate-icons.js
```

## Chrome Web Store 用パッケージ

```powershell
powershell -ExecutionPolicy Bypass -File scripts\package-extension.ps1
```

`dist/aura-audio-eq-dynamics-v1.0.zip` が生成されます。

## 権限について

| 権限 | 理由 |
|------|------|
| `storage` | 設定とプリセットを端末内に保存 |
| `<all_urls>` content script | ページ内メディアの音声を Web Audio で処理 |

外部サーバーへの通信は行いません。詳細は [PRIVACY.md](PRIVACY.md) を参照してください。

## ライセンス

[MIT License](LICENSE)

## 作者

Sound creator / composer — ゲーム音楽・アンビエント制作
