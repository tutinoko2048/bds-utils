## リリース手順
### bds-updater
- updater-coreのpackage.jsonのversionを更新 (推奨: `bun pm version`)
  - updater-cli, updater-executableはこれを参照する
- bun iを実行してロックファイルも更新
- タグ `updater@{version}` を作成
  - `git tag updater@{version}`
  - `git push --tags`
- GitHub Actionでnpmへの公開とリリースの作成、executableのアップロードが動く

### bds-utils
- cliのpackage.jsonのversionを更新 (推奨: `bun pm version`)
- bun iを実行してロックファイルも更新
- タグ `utils@{version}` を作成
  - `git tag utils@{version}`
  - `git push --tags`
- GitHub Actionでnpmへの公開とリリースの作成、executableのアップロードが動く
