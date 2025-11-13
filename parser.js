const fs = require('fs');
const path = require('path');

/**
 * SQL脚本解析器 - 将SQL建表脚本转换为JSON格式
 */
class SQLParser {
  constructor(sqlFilePath) {
    this.sqlFilePath = sqlFilePath;
    this.database = path.basename(sqlFilePath, '.sql');
    this.tables = [];
  }

  /**
   * 解析SQL文件
   */
  parse() {
    console.log('开始解析SQL文件:', this.sqlFilePath);
    const sqlContent = fs.readFileSync(this.sqlFilePath, 'utf-8');

    // 使用正则表达式匹配所有CREATE TABLE语句
    // 修改正则以正确捕获表注释 - 需要精确匹配 ENGINE到分号之间的内容
    const tableRegex = /CREATE TABLE\s+`?(\w+)`?\s*\(([\s\S]*?)\)\s*ENGINE\s*=\s*\w+\s+CHARACTER SET\s*=\s*\w+\s+COLLATE\s*=\s*\S+(?:\s+COMMENT\s*=\s*'([^']*)')?[^;]*;/gi;

    let match;
    while ((match = tableRegex.exec(sqlContent)) !== null) {
      const tableName = match[1];
      const tableBody = match[2];
      const tableComment = match[3] || '';

      console.log(`解析表: ${tableName}${tableComment ? ' - ' + tableComment : ''}`);

      const table = {
        tableName: tableName,
        comment: tableComment,
        columns: this.parseColumns(tableBody)
      };

      this.tables.push(table);
    }

    console.log(`解析完成，共找到 ${this.tables.length} 个表`);
    return this.tables;
  }

  /**
   * 解析表的字段信息
   */
  parseColumns(tableBody) {
    const columns = [];
    const lines = tableBody.split('\n');

    // 提取主键字段
    const primaryKeys = this.extractPrimaryKeys(tableBody);

    // 解析每一行字段定义
    for (const line of lines) {
      const trimmedLine = line.trim();

      // 跳过空行、PRIMARY KEY定义等
      if (!trimmedLine ||
          trimmedLine.startsWith('PRIMARY KEY') ||
          trimmedLine.startsWith('KEY') ||
          trimmedLine.startsWith('INDEX') ||
          trimmedLine.startsWith('UNIQUE') ||
          trimmedLine.startsWith('CONSTRAINT')) {
        continue;
      }

      // 匹配字段定义：`字段名` 类型 [NULL|NOT NULL] [DEFAULT xxx] [COMMENT '注释']
      const columnRegex = /`(\w+)`\s+([\w()]+(?:\s+(?:CHARACTER SET|COLLATE)\s+\S+)*)\s+(NOT\s+NULL|NULL)?(?:\s+DEFAULT\s+([^,\s]+(?:\s+'[^']*')?))?\s*(?:COMMENT\s+'([^']*)')?/i;

      const match = columnRegex.exec(trimmedLine);
      if (match) {
        const columnName = match[1];
        let columnType = match[2].trim();
        const nullableStr = match[3];
        const comment = match[5] || '';

        // 清理类型定义，移除CHARACTER SET和COLLATE
        columnType = columnType.replace(/\s+CHARACTER SET\s+\S+/gi, '');
        columnType = columnType.replace(/\s+COLLATE\s+\S+/gi, '');
        columnType = columnType.trim();

        // 判断是否可空
        const nullable = !nullableStr || nullableStr.toUpperCase().includes('NULL') && !nullableStr.toUpperCase().includes('NOT');

        // 判断是否为主键
        const isPrimaryKey = primaryKeys.includes(columnName);

        columns.push({
          name: columnName,
          type: columnType,
          nullable: nullable,
          isPrimaryKey: isPrimaryKey,
          comment: comment
        });
      }
    }

    return columns;
  }

  /**
   * 提取主键字段列表
   */
  extractPrimaryKeys(tableBody) {
    const primaryKeys = [];
    const pkRegex = /PRIMARY KEY\s*\((.*?)\)/i;
    const match = pkRegex.exec(tableBody);

    if (match) {
      const pkFields = match[1];
      // 提取所有字段名
      const fieldRegex = /`(\w+)`/g;
      let fieldMatch;
      while ((fieldMatch = fieldRegex.exec(pkFields)) !== null) {
        primaryKeys.push(fieldMatch[1]);
      }
    }

    return primaryKeys;
  }

  /**
   * 生成JSON文件
   */
  toJSON(outputPath) {
    const result = {
      database: this.database,
      tables: this.tables
    };

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`JSON文件已生成: ${outputPath}`);
    console.log(`数据库: ${this.database}`);
    console.log(`表数量: ${this.tables.length}`);

    return result;
  }
}

// 主程序 - 支持多个SQL文件
function main() {
  const sqlDir = path.join(__dirname, 'sql');
  const outputFile = path.join(__dirname, 'output.json');

  // 检查sql目录是否存在
  if (!fs.existsSync(sqlDir)) {
    console.error('SQL目录不存在:', sqlDir);
    process.exit(1);
  }

  try {
    // 读取sql目录下的所有.sql文件
    const sqlFiles = fs.readdirSync(sqlDir).filter(file => file.endsWith('.sql'));

    if (sqlFiles.length === 0) {
      console.error('sql目录下没有找到.sql文件');
      process.exit(1);
    }

    console.log(`找到 ${sqlFiles.length} 个SQL文件\n`);

    const databases = [];

    // 解析每个SQL文件
    for (const sqlFile of sqlFiles) {
      const sqlFilePath = path.join(sqlDir, sqlFile);
      console.log(`\n${'='.repeat(60)}`);

      const parser = new SQLParser(sqlFilePath);
      parser.parse();

      databases.push({
        database: parser.database,
        tables: parser.tables
      });
    }

    // 生成合并的JSON文件
    const result = {
      databases: databases,
      totalDatabases: databases.length,
      totalTables: databases.reduce((sum, db) => sum + db.tables.length, 0)
    };

    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf-8');

    console.log(`\n${'='.repeat(60)}`);
    console.log('\n✅ 所有文件解析完成！');
    console.log(`输出文件: ${outputFile}`);
    console.log(`数据库数量: ${result.totalDatabases}`);
    console.log(`表总数: ${result.totalTables}`);
    console.log('\n各数据库统计:');
    databases.forEach(db => {
      console.log(`  - ${db.database}: ${db.tables.length}个表`);
    });

  } catch (error) {
    console.error('❌ 解析出错:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 执行主程序
if (require.main === module) {
  main();
}

module.exports = SQLParser;
