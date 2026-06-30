# AuraAudio EQ & Dynamics

Chrome 拡張機能。Web ページ上の `<audio>` / `<video>` に **4バンド・パラメトリック EQ**、**コンプレッサー**、**リミッター** を Web Audio API でリアルタイム適用します。

**Chrome Web Store:** https://chromewebstore.google.com/detail/auraaudio-eq-dynamics/bhndlolhfaliajeemcpdebgcbcbagcpi  
**リポジトリ:** https://github.com/Shohei-Tsuchiya/chromeeqanddynamics

## 機能

- **4-Band Parametric EQ** — 各バンドの周波数・Q・ゲインを独立調整。EQ カーブをポップアップ上で可視化
- **Compressor** — Threshold / Ratio / Attack / Release / Input & Output Gain
- **Limiter** — Threshold / Output Gain
- **プリセット** — 3 スロットに設定を保存・読み込み
- **マスター ON/OFF** — ツールバーアイコンが状態に連動（有効: 青 / 無効: グレー）

## インストール（Chrome Web Store）

1. [AuraAudio EQ & Dynamics](https://chromewebstore.google.com/detail/auraaudio-eq-dynamics/bhndlolhfaliajeemcpdebgcbcbagcpi) を開く
2. **Chrome に追加** をクリック
3. 音が出ない場合は、対象ページを再読み込み

## インストール（開発者モード）

1. このリポジトリをクローンまたは ZIP で取得
2. Chrome で `chrome://extensions` を開く
3. **デベロッパーモード** を ON
4. **パッケージ化されていない拡張機能を読み込む** → このフォルダを選択

## 使い方

1. 音を処理したいページで **拡張機能アイコンをクリック**（ポップアップを開くとそのタブで処理が開始）
2. EQ / Comp / Limiter を調整（各ブロックの **ACTIVE** で個別バイパス）
3. マスタースイッチで全体 ON/OFF（**OFF 時は Web Audio を使わず、ページを更新すれば通常再生に戻ります**）
4. 有効化後に音が出ない場合は **対象ページを再読み込み**

## v1.0.1 の変更点

- マスター OFF 時は `<video>` / `<audio>` をフックしない（YouTube の途切れ対策）
- ポップアップを開いたタブのみ処理（`activeTab` + `scripting`）
- `AudioContext` に `latencyHint: 'playback'` を指定
- YouTube 向け DOM スキャンを軽量化

## プロジェクト構成

```
manifest.json      MV3 マニフェスト
background.js      タブ管理・スクリプト注入
content.js         Web Audio グラフ（on-demand 注入）
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

`dist/aura-audio-eq-dynamics-v1.0.1.zip` が生成されます。

## 権限について

| 権限 | 理由 |
|------|------|
| `storage` | 設定とプリセットを端末内に保存 |
| `activeTab` | ユーザーがポップアップを開いたタブのみにアクセス |
| `scripting` | 対象タブへ音声処理スクリプトを注入 |

外部サーバーへの通信は行いません。詳細は [PRIVACY.md](PRIVACY.md) を参照してください。

## ライセンス

[MIT License](LICENSE)

## 作者

Sound creator / composer — ゲーム音楽・アンビエント制作
