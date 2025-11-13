# SQL脚本转JSON可视化工具

这是一个将MySQL建表脚本转换为JSON数据并提供可视化界面查看表结构的工具。

## 📁 文件说明

- `parser.js` - SQL脚本解析器（Node.js）
- `viewer.html` - HTML可视化界面
- `output.json` - 解析生成的JSON数据
- `sql/` - SQL脚本文件目录

## 🚀 使用方法

### 1. 解析SQL脚本

将你的SQL脚本文件放到 `sql/` 目录下，然后运行解析器：

```bash
node parser.js
```

这将会：
- 读取 `sql/global_mtlp.sql` 文件
- 解析所有的 CREATE TABLE 语句
- 生成 `output.json` 文件

### 2. 查看可视化界面

用浏览器打开 `viewer.html` 文件即可查看表结构：

```bash
# Windows
start viewer.html

# Mac
open viewer.html

# Linux
xdg-open viewer.html
```

或者直接双击 `viewer.html` 文件。
