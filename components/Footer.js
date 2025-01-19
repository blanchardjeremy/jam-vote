import Link from 'next/link'
import { socialLinks } from '@/lib/routes'
import { CodeBracketIcon } from '@heroicons/react/24/outline'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            <a href={socialLinks.github.path} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 transition-colors">View code on GitHub</a>
            {' • '}
            Built by <a href="https://blanchardjeremy.com/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 transition-colors">Jeremy Blanchard</a>
          </div>
        </div>
      </div>
    </footer>
  )
} 