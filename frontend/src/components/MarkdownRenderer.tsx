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
  const imageCountRef = useRef(0)
  const fallbackCountRef = useRef(0)

  // Array of different fallback images to cycle through
  const fallbackImages = [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop&auto=format', // AI/Technology
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&auto=format', // Healthcare/Medical
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop&auto=format', // General Technology
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop&auto=format', // Data/Analytics
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&auto=format', // Business/Strategy
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&auto=format', // Innovation/Creativity
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop&auto=format', // Learning/Education
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop&auto=format', // Team/Collaboration
  ]

  // Function to get the next unique fallback image
  const getNextFallbackImage = (context?: string): string => {
    fallbackCountRef.current += 1
    const index = (fallbackCountRef.current - 1) % fallbackImages.length
    const selectedImage = fallbackImages[index]
    console.log(`Using fallback image ${fallbackCountRef.current}:`, { context, selectedImage, index });
    return selectedImage
  }

  // Enhanced image validation with better DALL-E handling
  const validateImageUrl = (url: string): string => {
    if (!url) {
      console.log('No URL provided, using fallback');
      return getNextFallbackImage('no-url');
    }
    
    console.log('Validating image URL:', url);
    
    // Check if it's a stored image URL (Supabase Storage)
    if (url.includes('supabase') || url.includes('storage.googleapis.com') || url.includes('session-images')) {
      console.log('Stored image detected, using directly');
      return url;
    }
    
    // Check if it's a DALL-E image URL (temporary)
    if (url.includes('dalle') || url.includes('openai') || url.startsWith('https://oaidalleapiprodscus.blob.core.windows.net')) {
      // DALL-E images often expire or have auth issues, so we'll use fallback
      console.log('DALL-E image detected, using fallback due to potential auth issues');
      return getNextFallbackImage('dalle-auth-issue');
    }
    
    // For any other URLs, try to use them directly
    console.log('External image URL detected, using directly');
    return url;
  }

  useEffect(() => {
    // Reset image counters when content changes
    imageCountRef.current = 0;
    fallbackCountRef.current = 0;
    
    // Initialize Mermaid with responsive configuration
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      maxTextSize: 50000,
      maxEdges: 500,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
      },
      sequence: {
        useMaxWidth: true,
      },
      gantt: {
        useMaxWidth: true,
      },
      journey: {
        useMaxWidth: true,
      },
      gitgraph: {
        useMaxWidth: true,
      },
      pie: {
        useMaxWidth: true,
      },
      quadrantChart: {
        useMaxWidth: true,
      },
      xyChart: {
        useMaxWidth: true,
      },
      timeline: {
        useMaxWidth: true,
      },
      mindmap: {
        useMaxWidth: true,
      },
      timeline: {
        useMaxWidth: true,
      },
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
              wrapper.className = 'mermaid-diagram my-4 w-full overflow-x-auto'
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
    <div ref={mermaidRef} className={`markdown-content prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-purple-600 prose-code:bg-purple-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs sm:prose-code:text-sm prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-200 prose-pre:text-xs sm:prose-pre:text-sm prose-pre:overflow-x-auto prose-pre:my-4 prose-blockquote:border-l-4 prose-blockquote:border-yellow-400 prose-blockquote:bg-yellow-50 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:my-4 prose-table:border-collapse prose-table:border prose-table:border-gray-300 prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-4 prose-th:py-2 prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2 prose-img:rounded-lg prose-img:shadow-md prose-img:my-6 prose-img:mx-auto prose-img:max-w-full prose-img:h-auto ${className}`} style={{ overflow: 'hidden' }}>
      <style jsx>{`
        .prose img {
          margin: 1.5rem 1rem;
          shape-outside: margin-box;
        }
        .prose p {
          text-align: justify;
          hyphens: auto;
          word-wrap: break-word;
        }
        .prose h1, .prose h2, .prose h3 {
          clear: both;
          margin-top: 2rem;
        }
        .prose h1:first-child, .prose h2:first-child, .prose h3:first-child {
          margin-top: 0;
        }
        .prose p:first-child {
          margin-top: 0;
        }
        .prose p:last-child {
          margin-bottom: 0;
        }
        /* Better text flow around images */
        .prose p + img {
          margin-top: 0.5rem;
        }
        .prose img + p {
          margin-top: 0.5rem;
        }
        /* Ensure proper spacing around headers */
        .prose h1 + img, .prose h2 + img, .prose h3 + img {
          margin-top: 1rem;
        }
        .prose img + h1, .prose img + h2, .prose img + h3 {
          margin-top: 2rem;
        }
        
        /* Mermaid diagram responsive styles */
        .mermaid-diagram {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          margin: 1rem 0;
          display: flex;
          justify-content: center;
        }
        
        .mermaid-diagram svg {
          max-width: 100%;
          height: auto;
          display: block;
        }
        
        /* Ensure Mermaid diagrams don't overflow on mobile */
        @media (max-width: 768px) {
          .mermaid-diagram {
            margin: 0.5rem -1rem;
            padding: 0 1rem;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          
          .mermaid-diagram svg {
            min-width: 300px;
            max-width: none;
            width: auto;
          }
        }
        
        /* Additional mobile optimizations for very small screens */
        @media (max-width: 480px) {
          .mermaid-diagram {
            margin: 0.5rem -0.5rem;
            padding: 0 0.5rem;
          }
          
          .mermaid-diagram svg {
            min-width: 280px;
          }
        }
        
        /* Code block responsive styles */
        .prose pre {
          font-size: 0.75rem;
          line-height: 1.4;
          padding: 0.75rem;
          margin: 1rem 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 0.375rem;
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
        }
        
        .prose code {
          font-size: 0.75rem;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          background-color: #f1f3f4;
          color: #7c3aed;
        }
        
        /* Mobile code block optimizations */
        @media (max-width: 768px) {
          .prose pre {
            font-size: 0.6875rem;
            padding: 0.5rem;
            margin: 0.75rem -1rem;
            border-radius: 0;
            border-left: none;
            border-right: none;
          }
          
          .prose code {
            font-size: 0.6875rem;
            padding: 0.125rem 0.1875rem;
          }
        }
        
        /* Very small screens */
        @media (max-width: 480px) {
          .prose pre {
            font-size: 0.625rem;
            padding: 0.375rem;
            margin: 0.5rem -0.5rem;
          }
          
          .prose code {
            font-size: 0.625rem;
          }
        }
      `}</style>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt, ...props }) => {
            console.log('Raw image props:', { src, alt, props });
            const validatedSrc = validateImageUrl(src || '');
            
            // Increment image count for alternating alignment
            imageCountRef.current += 1;
            const isEvenImage = imageCountRef.current % 2 === 0;
            const floatClass = isEvenImage ? 'float-left' : 'float-right';
            
            // Smart positioning based on context
            const marginClass = isEvenImage ? 'ml-4 mr-2' : 'mr-4 ml-2';
            
            // Adjust vertical positioning for better integration
            let verticalMargin = 'my-6';
            if (imageCountRef.current === 1) {
              // First image - position it well within the first paragraph
              verticalMargin = 'mt-2 mb-6';
            } else if (imageCountRef.current === 2) {
              // Second image - position it in the middle of content
              verticalMargin = 'my-8';
            } else {
              // Subsequent images - standard spacing
              verticalMargin = 'my-6';
            }
            
            console.log('Rendering image:', { 
              originalSrc: src, 
              validatedSrc, 
              alt, 
              imageNumber: imageCountRef.current,
              alignment: isEvenImage ? 'left' : 'right',
              verticalMargin
            });
            
            return (
              <span className={`${floatClass} ${verticalMargin} ${marginClass} text-center`}>
                <img 
                  src={validatedSrc} 
                  alt="" 
                  className="rounded-lg shadow-lg w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg h-auto"
                  style={{ 
                    maxHeight: '250px', 
                    objectFit: 'contain', 
                    clear: isEvenImage ? 'left' : 'right',
                    shapeOutside: 'margin-box'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.error('Image failed to load:', { 
                      originalSrc: src, 
                      validatedSrc, 
                      alt,
                      naturalWidth: target.naturalWidth,
                      naturalHeight: target.naturalHeight,
                      complete: target.complete,
                      error: e.type,
                      errorEvent: e
                    });
                    
                    // Hide the failed image
                    target.style.display = 'none';
                    
                    // Show the fallback placeholder
                    const fallbackDiv = target.nextElementSibling as HTMLElement;
                    if (fallbackDiv) {
                      fallbackDiv.style.display = 'inline-block';
                    }
                    
                    // If this was a DALL-E image that failed, try to load a fallback image
                    if (src && (src.includes('dalle') || src.includes('openai') || src.startsWith('https://oaidalleapiprodscus.blob.core.windows.net'))) {
                      console.log('DALL-E image failed, attempting to load fallback image');
                      const fallbackImage = getNextFallbackImage('dalle-fallback');
                      target.src = fallbackImage;
                      target.style.display = 'inline-block';
                      if (fallbackDiv) {
                        fallbackDiv.style.display = 'none';
                      }
                    }
                  }}
                  {...props}
                />
                <span 
                  className="hidden bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center"
                  style={{ 
                    maxHeight: '350px', 
                    display: 'none', 
                    maxWidth: '350px', 
                    clear: isEvenImage ? 'left' : 'right',
                    shapeOutside: 'margin-box'
                  }}
                >
                  <span className="block text-gray-500 text-lg mb-2">🖼️</span>
                  <span className="block text-gray-600 font-medium text-sm">Image not available</span>
                </span>
              </span>
            );
          },
          h1: ({ children, ...props }) => (
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-6 mt-8 border-b-2 border-purple-200 pb-2" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-lg md:text-2xl font-semibold text-gray-900 mb-4 mt-6" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-base md:text-xl font-medium text-gray-900 mb-3 mt-5" {...props}>
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p className="text-gray-700 leading-relaxed mb-4 text-justify text-xs md:text-base" {...props}>
              {children}
            </p>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-yellow-400 bg-yellow-50 pl-6 py-4 my-6 rounded-r-lg" {...props}>
              {children}
            </blockquote>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-outside mb-4 ml-6 space-y-2" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-outside mb-4 ml-6 space-y-2" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-gray-700 leading-relaxed pl-2 text-xs md:text-base" {...props}>
              {children}
            </li>
          ),
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-6 -mx-4 sm:mx-0">
              <table className="min-w-full border-collapse border border-gray-300 text-sm sm:text-base" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th className="border border-gray-300 bg-gray-50 px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-900 text-xs sm:text-sm" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-gray-700 text-xs sm:text-sm" {...props}>
              {children}
            </td>
          ),
          pre: ({ children, ...props }) => (
            <div className="overflow-x-auto -mx-4 sm:mx-0 my-4">
              <pre className="bg-gray-100 border border-gray-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm font-mono leading-relaxed overflow-x-auto" {...props}>
                {children}
              </pre>
            </div>
          ),
          code: ({ children, className, ...props }) => {
            const isInline = !className?.includes('language-')
            if (isInline) {
              return (
                <code className="bg-purple-100 text-purple-600 px-1 py-0.5 rounded text-xs sm:text-sm font-mono" {...props}>
                  {children}
                </code>
              )
            }
            return (
              <code className="text-xs sm:text-sm font-mono" {...props}>
                {children}
              </code>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
