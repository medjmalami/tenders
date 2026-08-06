import { Document, Page, pdf, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { type MdNode, parseMarkdown } from './markdown-ast'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', lineHeight: 1.5 },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 16 },
  h1: { fontSize: 18, fontWeight: 700, marginTop: 16, marginBottom: 8 },
  h2: { fontSize: 15, fontWeight: 700, marginTop: 14, marginBottom: 6 },
  h3: { fontSize: 13, fontWeight: 700, marginTop: 12, marginBottom: 6 },
  h4: { fontSize: 12, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  paragraph: { marginBottom: 8 },
  listItem: { flexDirection: 'row', marginBottom: 4 },
  bullet: { width: 16 },
  listItemContent: { flex: 1 },
  blockquote: { borderLeftWidth: 2, borderLeftColor: '#94a3b8', paddingLeft: 10, marginBottom: 8, color: '#475569' },
  code: { fontFamily: 'Courier', backgroundColor: '#f1f5f9', padding: 8, marginBottom: 8, fontSize: 10 },
  table: { marginBottom: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  tableRow: { flexDirection: 'row' },
  tableCellHeader: { flex: 1, padding: 6, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 700 },
  tableCell: { flex: 1, padding: 6, borderWidth: 1, borderColor: '#cbd5e1' },
  hr: { borderBottomWidth: 1, borderColor: '#cbd5e1', marginVertical: 10 },
})

const HEADING_STYLES: Record<number, any> = { 1: styles.h1, 2: styles.h2, 3: styles.h3, 4: styles.h4, 5: styles.h4, 6: styles.h4 }

interface Marks {
  bold?: boolean
  italics?: boolean
  code?: boolean
}

// Generates unique keys independent of array position — avoids using the
// list index as a React key, which breaks if nodes are ever inserted/reordered.
function createIdGenerator() {
  let counter = 0
  return () => `n${counter++}`
}

function inlineToTextRuns(nodes: MdNode[] = [], marks: Marks = {}, nextId: () => string): ReactElement[] {
  const elements: ReactElement[] = []
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        elements.push(
          <Text
            key={nextId()}
            style={{
              fontWeight: marks.bold ? 700 : 400,
              fontStyle: marks.italics ? 'italic' : 'normal',
              fontFamily: marks.code ? 'Courier' : undefined,
            }}
          >
            {node.value ?? ''}
          </Text>
        )
        break
      case 'strong':
        elements.push(...inlineToTextRuns(node.children, { ...marks, bold: true }, nextId))
        break
      case 'emphasis':
        elements.push(...inlineToTextRuns(node.children, { ...marks, italics: true }, nextId))
        break
      case 'inlineCode':
        elements.push(
          <Text key={nextId()} style={{ fontFamily: 'Courier', backgroundColor: '#f1f5f9' }}>
            {node.value ?? ''}
          </Text>
        )
        break
      case 'break':
        elements.push(<Text key={nextId()}>{'\n'}</Text>)
        break
      case 'link':
        elements.push(...inlineToTextRuns(node.children, marks, nextId))
        break
      default:
        if (node.children) elements.push(...inlineToTextRuns(node.children, marks, nextId))
        else if (node.value) elements.push(<Text key={nextId()}>{node.value}</Text>)
    }
  }
  return elements
}

function listItemToElements(node: MdNode, ordered: boolean, index: number, depth: number, nextId: () => string): ReactElement[] {
  const marker = ordered ? `${index + 1}.` : '\u2022'
  const elements: ReactElement[] = []
  let firstParagraph = true
  for (const child of node.children ?? []) {
    if (child.type === 'paragraph') {
      elements.push(
        <View key={nextId()} style={[styles.listItem, { marginLeft: depth * 16 }]}>
          <Text style={styles.bullet}>{firstParagraph ? marker : ''}</Text>
          <Text style={styles.listItemContent}>{inlineToTextRuns(child.children, {}, nextId)}</Text>
        </View>
      )
      firstParagraph = false
    } else if (child.type === 'list') {
      elements.push(...listToElements(child, depth + 1, nextId))
    }
  }
  return elements
}

function listToElements(node: MdNode, depth: number, nextId: () => string): ReactElement[] {
  const elements: ReactElement[] = []
  let index = 0
  for (const item of node.children ?? []) {
    elements.push(...listItemToElements(item, !!node.ordered, index, depth, nextId))
    index += 1
  }
  return elements
}

function tableToElement(node: MdNode, nextId: () => string): ReactElement {
  const rows = node.children ?? []
  return (
    <View key={nextId()} style={styles.table}>
      {rows.map((row, rowIndex) => (
        <View key={nextId()} style={styles.tableRow}>
          {(row.children ?? []).map((cell) => (
            <View key={nextId()} style={rowIndex === 0 ? styles.tableCellHeader : styles.tableCell}>
              <Text>{inlineToTextRuns(cell.children, {}, nextId)}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

function blockToElements(node: MdNode, nextId: () => string): ReactElement[] {
  switch (node.type) {
    case 'heading': {
      const level = Math.min(Math.max(node.depth ?? 1, 1), 6)
      return [
        <Text key={nextId()} style={HEADING_STYLES[level]}>
          {inlineToTextRuns(node.children, {}, nextId)}
        </Text>,
      ]
    }
    case 'paragraph':
      return [
        <Text key={nextId()} style={styles.paragraph}>
          {inlineToTextRuns(node.children, {}, nextId)}
        </Text>,
      ]
    case 'list':
      return listToElements(node, 0, nextId)
    case 'table':
      return [tableToElement(node, nextId)]
    case 'blockquote':
      return [
        <View key={nextId()} style={styles.blockquote}>
          {(node.children ?? []).flatMap((child) => blockToElements(child, nextId))}
        </View>,
      ]
    case 'code':
      return [
        <Text key={nextId()} style={styles.code}>
          {node.value ?? ''}
        </Text>,
      ]
    case 'thematicBreak':
      return [<View key={nextId()} style={styles.hr} />]
    default:
      return node.children ? node.children.flatMap((c) => blockToElements(c, nextId)) : []
  }
}

function ProposalPdfDocument({ markdown, title }: { markdown: string; title?: string }) {
  const tree = parseMarkdown(markdown)
  const nextId = createIdGenerator()
  const blocks = (tree.children ?? []).flatMap((node) => blockToElements(node, nextId))
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {title && <Text style={styles.title}>{title}</Text>}
        {blocks}
      </Page>
    </Document>
  )
}

export async function markdownToPdfBlob(markdown: string, title?: string): Promise<Blob> {
  const instance = pdf(<ProposalPdfDocument markdown={markdown} title={title} />)
  return instance.toBlob()
}
