'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const mermaidRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    })

    // Render Mermaid diagrams
    const renderMermaid = async () => {
      if (mermaidRef.current) {
        const mermaidElements = mermaidRef.current.querySelectorAll('pre code.language-mermaid')
        for (let i = 0; i < mermaidElements.length; i++) {
          const element = mermaidElements[i] as HTMLElement
          const graphDefinition = element.textContent || ''
          
          if (graphDefinition.trim()) {
            try {
              const { svg } = await mermaid.render(`mermaid-${i}`, graphDefinition)
              const wrapper = document.createElement('div')
              wrapper.innerHTML = svg
              wrapper.className = 'mermaid-diagram my-4'
              element.parentElement?.replaceWith(wrapper)
            } catch (error) {
              console.error('Mermaid rendering error:', error)
              // Keep the original code block if rendering fails
            }
          }
        }
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(renderMermaid, 100)
    return () => clearTimeout(timer)
  }, [content])

  return (
    <div ref={mermaidRef} className={`prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-purple-600 prose-code:bg-purple-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-200 prose-blockquote:border-l-4 prose-blockquote:border-yellow-400 prose-blockquote:bg-yellow-50 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:my-4 prose-table:border-collapse prose-table:border prose-table:border-gray-300 prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-4 prose-th:py-2 prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2 ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
