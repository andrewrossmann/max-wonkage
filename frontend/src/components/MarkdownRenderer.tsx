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
    <div ref={mermaidRef} className={`prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-purple-600 prose-code:bg-purple-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-200 prose-blockquote:border-l-4 prose-blockquote:border-yellow-400 prose-blockquote:bg-yellow-50 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:my-4 prose-table:border-collapse prose-table:border prose-table:border-gray-300 prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-4 prose-th:py-2 prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2 prose-img:rounded-lg prose-img:shadow-md prose-img:my-6 prose-img:mx-auto prose-img:max-w-full prose-img:h-auto ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt, ...props }) => (
            <div className="my-8 text-center">
              <img 
                src={src} 
                alt={alt} 
                className="rounded-lg shadow-lg max-w-full h-auto mx-auto"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
                {...props}
              />
              {alt && (
                <span className="block text-sm text-gray-600 mt-2 italic">{alt}</span>
              )}
            </div>
          ),
          h1: ({ children, ...props }) => (
            <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-8 border-b-2 border-purple-200 pb-2" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-6" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-xl font-medium text-gray-900 mb-3 mt-5" {...props}>
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p className="text-gray-700 leading-relaxed mb-4" {...props}>
              {children}
            </p>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-yellow-400 bg-yellow-50 pl-6 py-4 my-6 rounded-r-lg" {...props}>
              {children}
            </blockquote>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-2" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-gray-700 leading-relaxed" {...props}>
              {children}
            </li>
          ),
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full border-collapse border border-gray-300" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th className="border border-gray-300 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-900" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border border-gray-300 px-4 py-3 text-gray-700" {...props}>
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
