# GitHub 公開手順

## 1. GitHub でリポジトリを作成

1. https://github.com/new を開く
2. Repository name: `chromeeqanddynamics`
3. **Public** を選択
4. README / .gitignore / License は **追加しない**（ローカルに既にあるため）
5. **Create repository**

## 2. ローカルで初回 push

PowerShell でこのフォルダを開き:

```powershell
cd D:\work\dev_plugins\chrome-audio-effects-extension

git init
git add .
git commit -m "Initial release: AuraAudio EQ & Dynamics v1.0"
git branch -M main
git remote add origin https://github.com/Shohei-Tsuchiya/chromeeqanddynamics.git
git push -u origin main
```

`<YOUR_GITHUB_USER>` を自分の GitHub ユーザー名に置き換えてください。

## 3. 公開後にやること

- README の作者リンクや Issues を有効化
- Chrome Web Store の **Privacy policy URL** に  
  `https://github.com/Shohei-Tsuchiya/chromeeqanddynamics/blob/main/PRIVACY.md`  
  を設定
- （任意）`manifest.json` に `homepage_url` を追加して再パッケージ

```json
"homepage_url": "https://github.com/Shohei-Tsuchiya/chromeeqanddynamics"
```

## 4. 更新リリースの流れ

1. `manifest.json` の `version` を上げる（例: `1.0` → `1.0.1`）
2. 変更を commit & push
3. `scripts\package-extension.ps1` で ZIP 再生成
4. Developer Dashboard で新バージョンをアップロード

## GitHub CLI を使う場合（任意）

```powershell
winget install GitHub.cli
gh auth login
gh repo create chromeeqanddynamics --public --source=. --remote=origin --push
```
