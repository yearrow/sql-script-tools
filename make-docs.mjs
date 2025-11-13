import fs from 'fs';
import { 
  Document, 
  Packer, 
  Paragraph, 
  Table, 
  TableRow, 
  TableCell, 
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  VerticalAlign,
  HeadingLevel
} from 'docx';

/**
 * 读取 JSON 文件
 */
function readSchemaFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`读取文件失败: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 创建表头行
 */
function createTableHeader() {
  return new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: '字段名', bold: true })],
          alignment: AlignmentType.CENTER,
        })],
        shading: { fill: 'D9E2F3' },
        verticalAlign: VerticalAlign.CENTER,
        width: { size: 20, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: '数据类型', bold: true })],
          alignment: AlignmentType.CENTER,
        })],
        shading: { fill: 'D9E2F3' },
        verticalAlign: VerticalAlign.CENTER,
        width: { size: 15, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: '可空', bold: true })],
          alignment: AlignmentType.CENTER,
        })],
        shading: { fill: 'D9E2F3' },
        verticalAlign: VerticalAlign.CENTER,
        width: { size: 10, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: '主键', bold: true })],
          alignment: AlignmentType.CENTER,
        })],
        shading: { fill: 'D9E2F3' },
        verticalAlign: VerticalAlign.CENTER,
        width: { size: 10, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: '说明', bold: true })],
          alignment: AlignmentType.CENTER,
        })],
        shading: { fill: 'D9E2F3' },
        verticalAlign: VerticalAlign.CENTER,
        width: { size: 45, type: WidthType.PERCENTAGE },
      }),
    ],
  });
}

/**
 * 创建数据行
 */
function createTableRow(column, index) {
  const shading = index % 2 === 0 ? { fill: 'FFFFFF' } : { fill: 'F8F9FA' };
  
  return new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: column.name })],
        })],
        shading,
        verticalAlign: VerticalAlign.CENTER,
      }),
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: column.type })],
        })],
        shading,
        verticalAlign: VerticalAlign.CENTER,
      }),
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: column.nullable ? '是' : '否' })],
          alignment: AlignmentType.CENTER,
        })],
        shading,
        verticalAlign: VerticalAlign.CENTER,
      }),
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: column.isPrimaryKey ? '是' : '否' })],
          alignment: AlignmentType.CENTER,
        })],
        shading,
        verticalAlign: VerticalAlign.CENTER,
      }),
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: column.comment || '' })],
        })],
        shading,
        verticalAlign: VerticalAlign.CENTER,
      }),
    ],
  });
}

/**
 * 创建表格
 */
function createTable(columns) {
  const rows = [createTableHeader()];
  
  columns.forEach((column, index) => {
    rows.push(createTableRow(column, index));
  });

  return new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
  });
}

/**
 * 生成 Word 文档
 */
async function generateWordDocument(schema, outputPath) {
  const sections = [];

  // 添加标题
  sections.push(
    new Paragraph({
      text: '数据库表结构文档',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // 遍历所有数据库
  for (const db of schema.databases) {
    sections.push(
      new Paragraph({
        text: `数据库: ${db.database}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      })
    );

    // 遍历所有表
    for (const table of db.tables) {
      sections.push(
        new Paragraph({
          text: `表名: ${table.tableName}`,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );

      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: '表说明: ', bold: true }),
            new TextRun({ text: table.comment || '无' }),
          ],
          spacing: { after: 200 },
        })
      );

      // 添加字段表格
      sections.push(createTable(table.columns));

      // 表之间添加间距
      sections.push(
        new Paragraph({
          text: '',
          spacing: { after: 400 },
        })
      );
    }
  }

  // 创建文档
  const doc = new Document({
    sections: [{
      properties: {},
      children: sections,
    }],
  });

  // 生成并保存文档
  try {
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Word 文档已成功生成: ${outputPath}`);
  } catch (error) {
    console.error(`❌ 生成文档失败: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 主函数
 */
async function main() {
  const inputFile = process.argv[2] || './output.json';
  const outputFile = process.argv[3] || './database_schema.docx';

  console.log(`📖 读取文件: ${inputFile}`);
  const schema = readSchemaFile(inputFile);

  console.log(`📝 生成 Word 文档...`);
  await generateWordDocument(schema, outputFile);
}

main();