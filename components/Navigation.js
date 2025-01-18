'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MusicalNoteIcon, BookOpenIcon, PlusIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from '@/lib/utils'
import { routes } from '@/lib/routes'
import { Button } from '@/components/ui/button'
import CreateJamModal from './CreateJamModal'
import { useRouter } from 'next/navigation'

const icons = {
  music: MusicalNoteIcon,
  library: BookOpenIcon
}

export function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const router = useRouter()

  const handleCreateJam = (newJam) => {
    setIsCreateModalOpen(false)
    router.push(`/jams/${newJam._id}`)
  }

  return (
    <div className="border-b bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl font-bold mr-8">Music Jam</span>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <NavigationMenu>
                <NavigationMenuList>
                  {routes.map((route) => {
                    const Icon = icons[route.icon]
                    return (
                      <NavigationMenuItem key={route.path}>
                        <Link href={route.path} legacyBehavior passHref>
                          <NavigationMenuLink
                            className={cn(
                              navigationMenuTriggerStyle(),
                              pathname === route.path && "bg-accent text-accent-foreground"
                            )}
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {route.name}
                          </NavigationMenuLink>
                        </Link>
                      </NavigationMenuItem>
                    )
                  })}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* New Jam Button (Desktop) */}
            <div className="hidden md:block">
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                variant="outline"
                size="sm"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                New Jam
              </Button>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                className="px-0"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">Open menu</span>
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {routes.map((route) => {
              const Icon = icons[route.icon]
              return (
                <Link
                  key={route.path}
                  href={route.path}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm rounded-md',
                    pathname === route.path
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {route.name}
                </Link>
              )
            })}
            {/* New Jam Button (Mobile) */}
            <Button
              onClick={() => {
                setIsCreateModalOpen(true)
                setIsMobileMenuOpen(false)
              }}
              variant="secondary"
              size="sm"
              className="w-full justify-start"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Jam
            </Button>
          </div>
        </div>
      )}

      <CreateJamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateJam={handleCreateJam}
      />
      
    </div>
  )
} 