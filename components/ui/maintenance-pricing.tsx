"use client"

import { ArrowUpRight, CircleCheck } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { GradientButton } from "@/components/ui/gradient-button"
import { cn } from "@/lib/utils"

interface PricingFeature {
  text: string
}

interface PricingPlan {
  id: string
  name: string
  description: string
  shortDescription?: string
  monthlyPrice: string
  yearlyPrice: string
  features: PricingFeature[]
  button: {
    text: string
    url: string
  }
  color?: 'green' | 'blue' | 'purple'
}

interface MaintenancePricingProps {
  heading?: string
  description?: string
  plans?: PricingPlan[]
}

const MaintenancePricing = ({
  heading = "No te dejamos solo después del lanzamiento",
  description = "Tu negocio no para, tu web tampoco debería. Elige el plan que mejor se adapte a tu ritmo.",
  plans = [
    {
      id: "basic",
      name: "Plan Web Básico",
      description: "Ideal para: Webs presenciales",
      shortDescription: "Mantenimiento esencial para webs que necesitan estar siempre online y seguras.",
      monthlyPrice: "25€",
      yearlyPrice: "250€",
      features: [
        { text: "Monitorización 12/5" },
        { text: "Copias de seguridad semanales" },
        { text: "Certificados de Seguridad" },
        { text: "Resolución de caídas" },
      ],
      button: {
        text: "Saber más",
        url: "/#contact",
      },
      color: 'green'
    },
    {
      id: "plus",
      name: "Plan Web Plus",
      description: "Ideal para: Negocios en crecimiento",
      shortDescription: "Todo el mantenimiento básico más actualizaciones y cambios pequeños en web cuando los necesites.",
      monthlyPrice: "50€",
      yearlyPrice: "500€",
      features: [
        { text: "Todo lo del Básico" },
        { text: "Cambios de textos e imágenes" },
        { text: "Actualización de Plugins" },
        { text: "Soporte por Email prioritario" },
      ],
      button: {
        text: "Saber más",
        url: "/#contact",
      },
      color: 'blue'
    },
    {
      id: "saas",
      name: "SaaS Ops",
      description: "Ideal para: Software y Apps",
      shortDescription: "Soporte técnico completo para aplicaciones críticas que requieren disponibilidad 24/7.",
      monthlyPrice: "300€",
      yearlyPrice: "3000€",
      features: [
        { text: "Soporte Técnico Crítico" },
        { text: "Mantenimiento de Servidores" },
        { text: "Optimización de Base de Datos" },
        { text: "Backups Diarios" },
        { text: "Gestión de Incidencias" },
      ],
      button: {
        text: "Saber más",
        url: "/#contact",
      },
      color: 'purple'
    },
  ],
}: MaintenancePricingProps) => {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section id="mantenimiento" className="py-12 md:py-24 bg-black">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 md:gap-6 text-center mb-8 md:mb-16">
          <h2 className="text-xl md:text-4xl font-bold">
            <span className="text-white">No te dejamos solo </span>
            <span
              className="drop-shadow-lg"
              style={{
                color: '#a78bfa',
                background: 'linear-gradient(to bottom, #a78bfa, #c4b5fd, #60a5fa, #22d3ee)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              después del lanzamiento
            </span>
          </h2>
          <p className="text-sm md:text-lg text-gray-400 max-w-2xl px-2">{description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const colorClasses = {
              green: {
                border: 'border-green-500/20',
                borderFull: 'border-green-500/20',
                badge: 'bg-green-500/20 text-green-400',
                check: 'text-green-400'
              },
              blue: {
                border: 'border-blue-500/20',
                borderFull: 'border-blue-500/20',
                badge: 'bg-blue-500/20 text-blue-400',
                check: 'text-blue-400'
              },
              purple: {
                border: 'border-purple-500/20',
                borderFull: 'border-purple-500/20',
                badge: 'bg-purple-500/20 text-purple-400',
                check: 'text-purple-400'
              }
            }
            const colors = colorClasses[plan.color || 'green']

            return (
              <div key={plan.id} className="relative group cursor-pointer">
                {/* Vertical separator line - only between cards on desktop */}
                {index > 0 && index % 3 !== 0 && (
                  <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px z-20" style={{ backgroundColor: 'rgba(40,40,40,0.6)' }} />
                )}

                {/* Left border line - all cards on mobile, first column on desktop */}
                <div className={`absolute left-0 top-0 bottom-0 w-px z-20 ${index % 3 === 0 ? 'md:block' : 'md:hidden'} block`} style={{ backgroundColor: 'rgba(40,40,40,0.6)' }} />

                {/* Right border line - all cards on mobile, last column on desktop */}
                <div className={`absolute right-0 top-0 bottom-0 w-px z-20 ${index % 3 === 2 ? 'md:block' : 'md:hidden'} block`} style={{ backgroundColor: 'rgba(40,40,40,0.6)' }} />

                <div
                  className={cn(
                    'relative h-full backdrop-blur-2xl border-0 overflow-hidden transition-all duration-300 group-hover:bg-black/95',
                    'flex flex-col justify-between text-left bg-black text-white'
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

                  <div className="relative z-10 flex flex-col space-y-1.5 p-6">
                    <div className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-medium mb-3 ${colors.badge}`}>
                      {plan.description}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                      {plan.name}
                    </h3>
                  </div>
                  {plan.shortDescription && (
                    <div className="relative z-10 px-6 pb-3">
                      <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                        {plan.shortDescription}
                      </p>
                    </div>
                  )}
                  <div className="relative z-10 p-6 pt-0 mb-6">
                    <Separator className="mb-3 sm:mb-4" style={{ backgroundColor: '#1a1a1a' }} />
                    <ul className="space-y-3 sm:space-y-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CircleCheck className={`size-5 flex-shrink-0 mt-0.5 ${colors.check}`} />
                          <span className="text-sm text-gray-300">{feature.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Hover glow effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: plan.color === 'green'
                        ? 'radial-gradient(circle at center, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 50%, transparent 80%)'
                        : plan.color === 'blue'
                          ? 'radial-gradient(circle at center, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 50%, transparent 80%)'
                          : 'radial-gradient(circle at center, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.05) 50%, transparent 80%)',
                    }}
                  />

                  {/* Hover border glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      boxShadow: plan.color === 'green'
                        ? 'inset 0 0 40px rgba(34,197,94,0.2), 0 0 60px rgba(34,197,94,0.15)'
                        : plan.color === 'blue'
                          ? 'inset 0 0 40px rgba(59,130,246,0.2), 0 0 60px rgba(59,130,246,0.15)'
                          : 'inset 0 0 40px rgba(139,92,246,0.2), 0 0 60px rgba(139,92,246,0.15)',
                    }}
                  />

                  {/* Animated gradient overlay on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: plan.color === 'green'
                        ? 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(59,130,246,0.05) 50%, rgba(34,211,238,0.1) 100%)'
                        : plan.color === 'blue'
                          ? 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(34,211,238,0.05) 50%, rgba(139,92,246,0.1) 100%)'
                          : 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.05) 50%, rgba(34,211,238,0.1) 100%)',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center p-4 sm:p-6 max-w-2xl mx-auto relative" style={{ backgroundColor: '#000000', border: '1px solid #1a1a1a' }}>
          {/* Card Decorator - mismo estilo que servicios */}
          <span className="absolute -left-px -top-px block size-2 border-l-2 border-t-2" style={{ borderColor: '#1a1a1a' }}></span>
          <span className="absolute -right-px -top-px block size-2 border-r-2 border-t-2" style={{ borderColor: '#1a1a1a' }}></span>
          <span className="absolute -bottom-px -left-px block size-2 border-b-2 border-l-2" style={{ borderColor: '#1a1a1a' }}></span>
          <span className="absolute -bottom-px -right-px block size-2 border-b-2 border-r-2" style={{ borderColor: '#1a1a1a' }}></span>

          <div className="relative z-10">
            <p className="text-sm sm:text-base text-gray-400 mb-2">
              <strong className="text-gray-200">¿Necesitas algo nuevo?</strong>
            </p>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
              El mantenimiento cubre el correcto funcionamiento de lo que ya existe. Si tu negocio evoluciona y necesitas nuevas secciones, funcionalidades o un rediseño, estaremos encantados de preparar un presupuesto a medida.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export { MaintenancePricing }

