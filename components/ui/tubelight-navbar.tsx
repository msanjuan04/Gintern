"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
  variant?: 'fixed' | 'inline'
}

export function NavBar({ items, className, variant = 'fixed' }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0].name)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Detect active tab based on current path
  useEffect(() => {
    const currentPath = window.location.pathname
    const activeItem = items.find(item => {
      const url = item.url.replace('#', '').replace('/', '')
      return currentPath === item.url || currentPath.includes(url)
    })
    if (activeItem) {
      setActiveTab(activeItem.name)
    }
  }, [items])

  return (
    <div
      className={cn(
        variant === 'fixed' 
          ? "fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-6 sm:pt-6"
          : "relative flex justify-center",
        className,
      )}
    >
      <div className="flex items-center gap-3 bg-black/80 border border-gray-800 backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
              <Link
                key={item.name}
                href={item.url}
                onClick={() => {
                  setActiveTab(item.name)
                  if (item.url.startsWith('#')) {
                    const element = document.querySelector(item.url)
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }
                }}
                className={cn(
                  "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                  "text-gray-400 hover:text-white",
                  isActive && "bg-gray-900/50 text-white",
                )}
              >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-purple-500/10 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-purple-500 rounded-t-full">
                    <div className="absolute w-12 h-6 bg-purple-500/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-purple-500/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-purple-500/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

