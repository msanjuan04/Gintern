'use client'

import * as React from "react"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GradientButton } from '@/components/ui/gradient-button'
import { cn } from '@/lib/utils'
import { ChevronDown, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  sectionId?: string
  href?: string
  children?: Array<{ label: string; sectionId?: string; serviceId?: string; href?: string }>
}

interface PageNavbarProps {
  navItems: NavItem[]
  scrollToSection?: (sectionId: string, serviceId?: string) => void
  isVisible?: boolean
}

export function PageNavbar({ navItems, scrollToSection, isVisible = true }: PageNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null)
  const pathname = usePathname()

  const handleNavClick = (item: { sectionId?: string; serviceId?: string; href?: string }) => {
    if (item.href) {
      window.location.href = item.href
    } else if (item.sectionId) {
      // Si tenemos scrollToSection, usarlo para scroll en la misma página
      if (scrollToSection) {
        scrollToSection(item.sectionId, item.serviceId)
      } else {
        // Si no, redirigir con hash
        if (item.sectionId === 'contact') {
          window.location.href = '/#contact'
        } else if (item.serviceId) {
          window.location.href = `/#${item.sectionId}#${item.serviceId}`
        } else {
          window.location.href = `/#${item.sectionId}`
        }
      }
    }
    setIsMobileMenuOpen(false)
    setOpenDropdown(null)
  }

  return (
    <>
      {/* Desktop Navigation */}
      <header className={cn(
        "hidden md:block fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800 transition-opacity duration-1000 ease-out",
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>
        <div className="container mx-auto px-6">
          <div className="flex items-center h-16">
            {/* Logo */}
            <div className="flex-1 flex justify-center">
              <Link href="/" className="flex items-center gap-2 group cursor-pointer">
                <img
                  src="/branding/clyra_logo.webp"
                  alt="Clyra"
                  className="h-8 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                />
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-4 flex-1 justify-center">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className="relative h-full flex items-center"
                  onMouseEnter={() => item.children && setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    onClick={() => {
                      if (item.children) {
                        setOpenDropdown(openDropdown === item.label ? null : item.label)
                      } else {
                        handleNavClick(item)
                      }
                    }}
                    className={cn(
                      "px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1",
                      openDropdown === item.label && 'text-white'
                    )}
                  >
                    {item.label}
                    {item.children && (
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform duration-200",
                          openDropdown === item.label && 'rotate-180'
                        )}
                      />
                    )}
                  </button>

                  {/* Dropdown Menu Desktop */}
                  {item.children && openDropdown === item.label && (
                    <div className="absolute top-full left-0 pt-2 w-56 z-[60]">
                      <div className="bg-black/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl py-2 overflow-hidden">
                        {item.children.map((child) => (
                          <button
                            key={child.label}
                            onClick={() => handleNavClick(child)}
                            className="w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 text-left block"
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* CTA Button */}
            <div className="flex-1 flex justify-center">
              <GradientButton
                onClick={() => {
                  if (scrollToSection) {
                    scrollToSection('contact')
                  } else {
                    handleNavClick({ href: '/#contact' })
                  }
                }}
                variant="default"
                className="px-6 py-2.5 text-sm"
              >
                Hablemos
              </GradientButton>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800 h-16">
        <div className="px-4 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/branding/clyra_logo.webp"
              alt="Clyra"
              className="h-7 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-2">
            <GradientButton
              onClick={() => {
                if (scrollToSection) {
                  scrollToSection('contact')
                } else {
                  handleNavClick({ href: '/#contact' })
                }
                setIsMobileMenuOpen(false)
              }}
              variant="default"
              className="!px-3 !py-1.5 !text-xs"
            >
              Reserva tu consulta
            </GradientButton>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-white hover:text-gray-300 transition-colors duration-200"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden fixed inset-0 top-16 z-40 bg-black/80 backdrop-blur-sm overflow-y-auto"
          >
            <div className="flex flex-col items-center justify-center min-h-full p-4">
              <div className="w-full max-w-md space-y-2">
                {navItems.map((item, index) => (
                  <div key={item.label} className="border-b border-white/5 last:border-none pb-2 last:pb-0">
                    <div className="w-full flex items-center justify-between">
                      <button
                        onClick={() => {
                          if (!item.children) {
                            handleNavClick(item)
                          }
                        }}
                        className="flex-1 px-4 py-4 text-left text-gray-300 hover:text-white active:bg-white/5 rounded-lg transition-colors duration-200 flex items-center gap-3 text-lg"
                      >
                        <span
                          className="font-bold"
                          style={{
                            color: '#a78bfa',
                            background: 'linear-gradient(to bottom, #a78bfa, #c4b5fd, #60a5fa, #22d3ee)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >{index + 1}.</span>
                        <span className={cn("font-medium", openDropdown === item.label && 'text-white')}>{item.label}</span>
                      </button>
                      {item.children && (
                        <button
                          onClick={() => {
                            setOpenDropdown(openDropdown === item.label ? null : item.label)
                          }}
                          className="p-4 flex items-center justify-center"
                        >
                          <ChevronDown
                            className={cn(
                              "w-5 h-5 transition-transform duration-200",
                              openDropdown === item.label && 'rotate-180'
                            )}
                          />
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {item.children && openDropdown === item.label && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-8 pr-4 py-2 space-y-1">
                            {item.children.map((child) => (
                              <button
                                key={child.label}
                                onClick={() => handleNavClick(child)}
                                className="w-full px-4 py-3 text-left text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors duration-200 text-sm"
                              >
                                {child.label}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

