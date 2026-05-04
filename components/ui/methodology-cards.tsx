"use client"

import { Check, Target, GitBranch, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface MethodologyFeature {
  name: string
  description: string
  included: boolean
}

interface MethodologyCard {
  name: string
  subtitle: string
  description: string
  features: MethodologyFeature[]
  highlight?: boolean
  badge?: string
  icon: React.ReactNode
  color: "purple" | "blue"
  exampleUrl?: string
  exampleImage?: string
}

interface MethodologyCardsProps {
  methodologies: MethodologyCard[]
  className?: string
}

function MethodologyCards({ methodologies, className }: MethodologyCardsProps) {
  const getColorClasses = (color: "purple" | "blue", isHighlight: boolean) => {
    if (color === "purple") {
      return {
        text: "text-purple-300 dark:text-purple-300",
        iconBg: "bg-purple-500/20 dark:bg-purple-500/20",
        iconColor: "text-purple-400 dark:text-purple-400",
        checkColor: "text-purple-400 dark:text-purple-400",
      }
    } else {
      return {
        text: "text-blue-300 dark:text-blue-300",
        iconBg: "bg-blue-500/20 dark:bg-blue-500/20",
        iconColor: "text-blue-400 dark:text-blue-400",
        checkColor: "text-blue-400 dark:text-blue-400",
      }
    }
  }

  const buttonStyles = {
    default: cn(
      "h-12 bg-black/50 dark:bg-white/5",
      "hover:bg-black/70 dark:hover:bg-white/10",
      "text-white dark:text-white",
      "border border-gray-800 dark:border-gray-700",
      "hover:border-gray-700 dark:hover:border-gray-600",
      "shadow-sm hover:shadow-md",
      "text-sm font-medium",
    ),
    highlight: cn(
      "h-12 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500",
      "hover:from-purple-700 hover:to-blue-700 dark:hover:from-purple-600 dark:hover:to-blue-600",
      "text-white",
      "shadow-[0_4px_20px_rgba(139,92,246,0.3)]",
      "hover:shadow-[0_4px_25px_rgba(139,92,246,0.4)]",
      "font-semibold text-base",
    ),
  }

  const badgeStyles = cn(
    "px-2 py-0.5 text-xs font-medium",
    "text-gray-300",
    "rounded-md",
  )

  return (
    <section
      className={cn(
        "relative bg-black text-white",
        "pt-8 pb-12 px-0 md:px-4 md:pt-8 md:pb-24",
        "overflow-visible",
        className,
      )}
    >
      <div className="w-full max-w-6xl md:mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 pt-0 md:pt-6">
          {methodologies.map((methodology, index) => {
            const colors = getColorClasses(methodology.color, methodology.highlight || false)
            
            return (
              <div key={methodology.name} className="relative group cursor-pointer">
                {/* Vertical separator line - only between cards on desktop */}
                {index > 0 && index % 2 !== 0 && (
                  <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px z-20" style={{ backgroundColor: 'rgba(40,40,40,0.6)' }} />
                )}
                
                {/* Left border line - all cards on mobile, first column on desktop */}
                <div className={`absolute left-0 top-0 bottom-0 w-px z-20 ${index % 2 === 0 ? 'md:block' : 'md:hidden'} block`} style={{ backgroundColor: 'rgba(40,40,40,0.6)' }} />
                
                {/* Right border line - all cards on mobile, last column on desktop */}
                <div className={`absolute right-0 top-0 bottom-0 w-px z-20 ${index % 2 === 1 ? 'md:block' : 'md:hidden'} block`} style={{ backgroundColor: 'rgba(40,40,40,0.6)' }} />
                
                <div
                  className={cn(
                    "relative h-full backdrop-blur-2xl border-0 overflow-visible transition-all duration-300 group-hover:bg-black/95",
                    "flex flex-col",
                  )}
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(5,5,5,0.98) 50%, rgba(0,0,0,0.95) 100%)',
                    boxShadow: `
                      0 4px 20px rgba(0,0,0,0.5),
                      0 0 40px rgba(0,0,0,0.3),
                      inset 0 1px 0 rgba(255,255,255,0.15), inset 0 0.5px 0 rgba(255,255,255,0.2)
                    `,
                  }}
                >
                  {/* Top border line */}
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ backgroundColor: 'rgba(40,40,40,0.6)' }} />
                  
                  {/* Bottom border line */}
                  <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: 'rgba(40,40,40,0.6)' }} />
                  
                  {methodology.badge && (
                    <div className="absolute -top-3 sm:-top-4 left-4 sm:left-6 z-50" style={{ pointerEvents: 'none' }}>
                      <Badge className={cn(
                        badgeStyles, 
                        "shadow-lg",
                        methodology.color === "purple" 
                          ? "bg-purple-900 border border-purple-700 shadow-purple-900/50" 
                          : "bg-gray-900 border border-gray-700 shadow-gray-900/50"
                      )} style={{
                        boxShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)'
                      }}>{methodology.badge}</Badge>
                    </div>
                  )}
                  
                  <div className="relative z-10 p-4 sm:p-6 md:p-8 flex-1 pt-6 sm:pt-8">
                  <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                    <div className={cn("p-2 sm:p-3 rounded-xl shrink-0", colors.iconBg)}>
                      {methodology.icon}
                    </div>
                    <div className="text-right flex-1 sm:flex-none">
                      <h3 className={cn("text-lg sm:text-xl md:text-2xl font-bold", colors.text)}>
                        {methodology.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                        {methodology.subtitle}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-4 sm:mb-6 text-xs sm:text-sm leading-relaxed">
                    {methodology.description}
                  </p>

                  <div className="space-y-3 sm:space-y-4">
                    {methodology.features.map((feature) => (
                      <div key={feature.name} className="flex gap-2 sm:gap-4">
                        <div
                          className={cn(
                            "mt-0.5 sm:mt-1 p-0.5 rounded-full transition-colors duration-200 shrink-0",
                            feature.included
                              ? colors.checkColor
                              : "text-gray-600 dark:text-gray-600",
                          )}
                        >
                          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-gray-200">
                            {feature.name}
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 leading-snug">
                            {feature.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Example Section */}
                  {methodology.exampleUrl && methodology.exampleImage && (
                    <div className="mt-6 pt-6 border-t border-gray-800">
                      <div className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Ejemplo Real</div>
                      <Link 
                        href={methodology.exampleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block"
                      >
                        <div className="relative rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-300 shadow-lg">
                          <img
                            src={methodology.exampleImage}
                            alt={methodology.exampleUrl}
                            className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                            <div className="flex items-center gap-2 text-white text-xs sm:text-sm font-medium">
                              <span className="truncate">{methodology.exampleUrl.replace(/^https?:\/\//, '')}</span>
                              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )}
                  </div>
                  
                  {/* Hover glow effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: methodology.color === 'purple' 
                        ? 'radial-gradient(circle at center, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.05) 50%, transparent 80%)'
                        : 'radial-gradient(circle at center, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 50%, transparent 80%)',
                    }}
                  />
                  
                  {/* Hover border glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      boxShadow: methodology.color === 'purple'
                        ? 'inset 0 0 40px rgba(139,92,246,0.2), 0 0 60px rgba(139,92,246,0.15)'
                        : 'inset 0 0 40px rgba(59,130,246,0.2), 0 0 60px rgba(59,130,246,0.15)',
                    }}
                  />
                  
                  {/* Animated gradient overlay on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: methodology.color === 'purple'
                        ? 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.05) 50%, rgba(34,211,238,0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(34,211,238,0.05) 50%, rgba(34,211,238,0.1) 100%)',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export { MethodologyCards }
export type { MethodologyCard, MethodologyFeature }

