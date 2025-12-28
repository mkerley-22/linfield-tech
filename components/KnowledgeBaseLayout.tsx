'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function KnowledgeBaseLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Check if we're on a Knowledge Base page
  const isKnowledgeBaseActive = 
    pathname?.startsWith('/pages') || 
    pathname?.startsWith('/categories') ||
    pathname?.startsWith('/search')

  useEffect(() => {
    // Add class to body when Knowledge Base is active
    if (isKnowledgeBaseActive) {
      document.body.classList.add('knowledge-base-active')
    } else {
      document.body.classList.remove('knowledge-base-active')
    }
    
    return () => {
      document.body.classList.remove('knowledge-base-active')
    }
  }, [isKnowledgeBaseActive])

  return <>{children}</>
}

