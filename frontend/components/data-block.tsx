'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface DataBlockProps {
  data: Record<string, any> | null
  title?: string
  level?: number
}

export function DataBlock({ data, title, level = 0 }: DataBlockProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        {title ? `${title}: ` : ''}No data available
      </div>
    )
  }

  const toggleExpand = (key: string) => {
    const newExpanded = new Set(expandedKeys)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedKeys(newExpanded)
  }

  const isNested = (value: any) =>
    value !== null &&
    typeof value === 'object' &&
    (Array.isArray(value) || Object.keys(value).length > 0)


  return (
    <div className={`space-y-2 text-sm ${level > 0 ? 'border-l border-border pl-4 my-2' : ''}`}>
      {title && level === 0 && (
        <h4 className="font-semibold text-foreground">{title}</h4>
      )}
      {Object.entries(data).map(([key, value]) => {
        const nested = isNested(value)
        const isExpanded = expandedKeys.has(key)

        if (nested) {
          return (
            <div key={key} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleExpand(key)}
                className="flex items-center gap-2 text-foreground hover:text-primary transition-colors text-sm"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="font-medium">{key}:</span>
              </button>
              {isExpanded && (
                <div className="ml-4">
                  {Array.isArray(value) ? (
                    <div className="space-y-2">
                      {value.map((item, idx) => {
                        const itemKey =
                          item && typeof item === 'object' && 'id' in item
                            ? `${key}-${(item as Record<string, any>).id}`
                            : `${key}-${idx}-${typeof item === 'object' ? JSON.stringify(item) : String(item)}`
                        return (
                          <div key={itemKey} className="border-l border-border pl-3">
                            {typeof item === 'object' && item !== null ? (
                              <DataBlock data={item} level={level + 1} />
                            ) : (
                              <span className="text-muted-foreground">[{idx}] {String(item)}</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <DataBlock data={value} level={level + 1} />
                  )}
                </div>
              )}
            </div>
          )
        }

        return (
          <div key={key} className="flex gap-3 items-start py-1">
            <span className="font-medium text-foreground min-w-40">{key}:</span>
            <span className="text-muted-foreground break-words flex-1">
              {value === null ? (
                <span className="italic">null</span>
              ) : value === undefined ? (
                <span className="italic">undefined</span>
              ) : typeof value === 'boolean' ? (
                <span className={value ? 'text-green-600' : 'text-red-600'}>
                  {String(value)}
                </span>
              ) : (
                String(value)
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
