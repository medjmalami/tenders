import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

// Minimal mdast node shape — avoids pulling in @types/mdast as a hard dependency
interface MdNode {
  type: string
  value?: string
  depth?: number
  ordered?: boolean
  children?: MdNode[]
}

function parseMarkdown(markdown: string): MdNode {
  const processor = unified().use(remarkParse).use(remarkGfm)
  return processor.parse(markdown) as unknown as MdNode
}

interface Marks {
  bold?: boolean
  italics?: boolean
  code?: boolean
}

function inlineToRuns(nodes: MdNode[] = [], marks: Marks = {}): TextRun[] {
  const runs: TextRun[] = []
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        runs.push(
          new TextRun({
            text: node.value ?? '',
            bold: marks.bold,
            italics: marks.italics,
            font: marks.code ? 'Courier New' : undefined,
          })
        )
        break
      case 'strong':
        runs.push(...inlineToRuns(node.children, { ...marks, bold: true }))
        break
      case 'emphasis':
        runs.push(...inlineToRuns(node.children, { ...marks, italics: true }))
        break
      case 'inlineCode':
        runs.push(new TextRun({ text: node.value ?? '', font: 'Courier New' }))
        break
      case 'break':
        runs.push(new TextRun({ text: '', break: 1 }))
        break
      case 'link':
        runs.push(...inlineToRuns(node.children, marks))
        break
      default:
        if (node.children) runs.push(...inlineToRuns(node.children, marks))
        else if (node.value) runs.push(new TextRun({ text: node.value, bold: marks.bold, italics: marks.italics }))
    }
  }
  return runs
}

const HEADING_LEVELS = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
  HeadingLevel.HEADING_5,
  HeadingLevel.HEADING_6,
]

function listItemToParagraphs(node: MdNode, ordered: boolean, depth: number): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const bulletOptions = ordered
    ? { numbering: { reference: 'ordered-list', level: depth } }
    : { bullet: { level: depth } }

  for (const child of node.children ?? []) {
    if (child.type === 'paragraph') {
      paragraphs.push(new Paragraph({ children: inlineToRuns(child.children), ...bulletOptions }))
    } else if (child.type === 'list') {
      paragraphs.push(...listToParagraphs(child, depth + 1))
    } else if (child.children) {
      paragraphs.push(new Paragraph({ children: inlineToRuns(child.children), ...bulletOptions }))
    }
  }
  return paragraphs
}

function listToParagraphs(node: MdNode, depth = 0): Paragraph[] {
  const paragraphs: Paragraph[] = []
  for (const item of node.children ?? []) {
    paragraphs.push(...listItemToParagraphs(item, !!node.ordered, depth))
  }
  return paragraphs
}

function tableToDocxTable(node: MdNode): Table {
  const rows = (node.children ?? []).map((row, rowIndex) => {
    const cellCount = row.children?.length || 1
    const cells = (row.children ?? []).map(
      (cell) =>
        new TableCell({
          children: [new Paragraph({ children: inlineToRuns(cell.children) })],
          width: { size: Math.floor(100 / cellCount), type: WidthType.PERCENTAGE },
        })
    )
    return new TableRow({ children: cells, tableHeader: rowIndex === 0 })
  })
  return new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } })
}

function blockToDocxElements(node: MdNode): (Paragraph | Table)[] {
  switch (node.type) {
    case 'heading': {
      const level = Math.min(Math.max((node.depth ?? 1) - 1, 0), 5)
      return [new Paragraph({ heading: HEADING_LEVELS[level], children: inlineToRuns(node.children) })]
    }
    case 'paragraph':
      return [new Paragraph({ children: inlineToRuns(node.children) })]
    case 'list':
      return listToParagraphs(node)
    case 'table':
      return [tableToDocxTable(node)]
    case 'blockquote':
      return (node.children ?? []).flatMap((child) => {
        if (child.type === 'paragraph') {
          return [new Paragraph({ children: inlineToRuns(child.children), indent: { left: 720 } })]
        }
        return blockToDocxElements(child)
      })
    case 'code':
      return [new Paragraph({ children: [new TextRun({ text: node.value ?? '', font: 'Courier New' })] })]
    case 'thematicBreak':
      return [new Paragraph({ text: '' })]
    default:
      return node.children ? node.children.flatMap(blockToDocxElements) : []
  }
}

export async function markdownToDocxBlob(markdown: string, title?: string): Promise<Blob> {
  const tree = parseMarkdown(markdown)
  const children = (tree.children ?? []).flatMap(blockToDocxElements)

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'ordered-list',
          levels: [
            { level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START },
            { level: 1, format: 'decimal', text: '%2.', alignment: AlignmentType.START },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: title
          ? [
            new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: title, bold: true })] }),
            ...children,
          ]
          : children,
      },
    ],
  })

  return Packer.toBlob(doc)
}
