# Commit Message Convention

手動で作成するコミットメッセージは、次の形式に統一します。

```text
type: short imperative summary
```

例:

```text
contract: define catalog schema
catalog: validate catalog input
storage: persist inventory locally
ui: improve inventory filters
test: add inventory import regression
docs: document local bootstrap
chore: clean obsolete files
ci: verify repository toolchain
build: pin Node toolchain
```

ルール:

- `type` は小文字にします。
- summary は英語の命令形で短く書きます。
- 末尾に句点は付けません。
- 手動コミットでは `[add]` や `[delete]` のような独自プレフィックスを
  使いません。
- Merge commit、revert commit、bot やサービスが自動生成したコミットは、
  生成元の形式をそのまま使って構いません。

使用できる `type`:

- `contract`: repository 間の契約、schema、型定義の変更
- `catalog`: Catalog の取得、変換、検証の変更
- `storage`: browser 内保存、import、export、migration の変更
- `ui`: React UI、表示、操作性の変更
- `test`: テストの追加や修正
- `docs`: ドキュメント変更
- `chore`: 仕様に直接影響しない整理
- `ci`: CI workflow や自動検証の変更
- `build`: build 設定、依存管理、toolchain の変更
