---
name: opm-core
description: "open-process-miningの共有リソースを提供する内部スキルです。他のopm系スキルから参照されます。直接トリガーされることは想定していません。"
user-invokable: false
---

# open-process-mining 共有リソース

open-process-mining (OPM) のデータパイプライン構築に必要な仕様・パターン集を提供します。

## 提供リソース

| ファイル | 内容 |
| --- | --- |
| `references/data-pipeline-patterns.md` | dbt staging/mart モデル、dlt ソース、CSV の具体的なパターン集 |

## 他スキルからの参照方法

```markdown
パターン集は `../opm-core/references/data-pipeline-patterns.md` を参照してください。
```
