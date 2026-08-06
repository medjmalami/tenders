import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

export interface MdNode {
  type: string
  value?: string
  depth?: number
  ordered?: boolean
  children?: MdNode[]
}

export function parseMarkdown(markdown: string): MdNode {
  const processor = unified().use(remarkParse).use(remarkGfm)
  return processor.parse(markdown) as unknown as MdNode
}
