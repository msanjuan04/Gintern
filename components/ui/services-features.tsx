"use client"

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Rocket, Building2, Zap, Check, ArrowUpRight } from 'lucide-react'
import { ReactNode } from 'react'
import Link from 'next/link'
import { GradientButton } from '@/components/ui/gradient-button'

interface ServiceCardProps {
  children: ReactNode
  className?: string
  color?: 'purple' | 'blue' | 'cyan'
}

const ServiceCard = ({ children, className, color = 'purple' }: ServiceCardProps) => {
  const colorClasses = {
    purple: {
      border: 'border-purple-500/20',
      borderHover: 'group-hover:border-purple-500/60',
      gradient: 'from-purple-900/10 to-black',
      glow: 'group-hover:shadow-[0_0_60px_rgba(147,51,234,0.5),0_0_100px_rgba(147,51,234,0.3)]',
      bgHover: 'group-hover:from-purple-900/20',
    },
    blue: {
      border: 'border-blue-500/20',
      borderHover: 'group-hover:border-blue-500/60',
      gradient: 'from-blue-900/10 to-black',
      glow: 'group-hover:shadow-[0_0_60px_rgba(59,130,246,0.5),0_0_100px_rgba(59,130,246,0.3)]',
      bgHover: 'group-hover:from-blue-900/20',
    },
    cyan: {
      border: 'border-cyan-500/20',
      borderHover: 'group-hover:border-cyan-500/60',
      gradient: 'from-cyan-900/10 to-black',
      glow: 'group-hover:shadow-[0_0_60px_rgba(34,211,238,0.5),0_0_100px_rgba(34,211,238,0.3)]',
      bgHover: 'group-hover:from-cyan-900/20',
    }
  }

  const currentColors = colorClasses[color]

  return (
    <div
      className={cn(
        'group relative border bg-gradient-to-b w-full',
        currentColors.gradient,
        currentColors.bgHover,
        currentColors.border,
        currentColors.borderHover,
        currentColors.glow,
        'shadow-md group-hover:shadow-2xl transition-all duration-500 ease-out',
        'text-white',
        className
      )}
      style={{
        backgroundColor: '#000000',
        backgroundImage: `linear-gradient(to bottom, ${color === 'purple' ? 'rgba(88, 28, 135, 0.1)' : color === 'blue' ? 'rgba(30, 58, 138, 0.1)' : 'rgba(22, 78, 99, 0.1)'}, #000000)`,
        transition: 'all 0.5s ease-out',
      }}
    >
      <CardDecorator color={color} />
      {children}
    </div>
  )
}

const CardDecorator = ({ color = 'purple' }: { color?: 'purple' | 'blue' | 'cyan' }) => {
  const borderColor = {
    purple: 'border-purple-500/30 group-hover:border-purple-500/80 group-hover:shadow-[0_0_10px_rgba(147,51,234,0.6)]',
    blue: 'border-blue-500/30 group-hover:border-blue-500/80 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.6)]',
    cyan: 'border-cyan-500/30 group-hover:border-cyan-500/80 group-hover:shadow-[0_0_10px_rgba(34,211,238,0.6)]',
  }[color]

  return (
    <>
      <span className={cn('absolute -left-px -top-px block size-2 border-l-2 border-t-2 transition-all duration-500 ease-out', borderColor)}></span>
      <span className={cn('absolute -right-px -top-px block size-2 border-r-2 border-t-2 transition-all duration-500 ease-out', borderColor)}></span>
      <span className={cn('absolute -bottom-px -left-px block size-2 border-b-2 border-l-2 transition-all duration-500 ease-out', borderColor)}></span>
      <span className={cn('absolute -bottom-px -right-px block size-2 border-b-2 border-r-2 transition-all duration-500 ease-out', borderColor)}></span>
    </>
  )
}

interface CardHeadingProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color?: 'purple' | 'blue' | 'cyan'
}

const CardHeading = ({ icon: Icon, title, description, color = 'purple' }: CardHeadingProps) => {
  const iconColor = {
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    cyan: 'text-cyan-400',
  }[color]

  return (
    <div className="px-3 pt-3 pb-2 md:p-6">
      <div className={cn('flex items-center gap-1.5 md:gap-2 mb-2 md:mb-4', iconColor)}>
        <Icon className="size-3 md:size-5 flex-shrink-0" />
        <span className="text-[10px] md:text-sm font-medium">{title}</span>
      </div>
      <p className="mt-1 md:mt-2 text-sm md:text-2xl font-semibold text-white">{description}</p>
    </div>
  )
}

interface FeaturesListProps {
  features: string[]
  color?: 'purple' | 'blue' | 'cyan'
}

const FeaturesList = ({ features, color = 'purple' }: FeaturesListProps) => {
  const checkColor = {
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    cyan: 'text-cyan-400',
  }[color]

  return (
    <div className="px-3 md:px-6 pb-3 md:pb-6 space-y-1.5 md:space-y-3">
      {features.map((feature, index) => (
        <div key={index} className="flex items-start gap-1.5 md:gap-3">
          <Check className={cn('w-3 h-3 md:w-5 md:h-5 flex-shrink-0 mt-0.5', checkColor)} />
          <span className="text-[10px] md:text-sm text-gray-300 leading-relaxed text-left">{feature}</span>
        </div>
      ))}
    </div>
  )
}

export function ServicesFeatures() {
  return (
    <section id="servicios" className="bg-black py-8 md:py-24 px-0 md:px-4 sm:px-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-0">
        {/* Header */}
        <div className="text-center mb-8 md:mb-16 max-w-3xl mx-auto">
          <h2 className="text-xl md:text-4xl font-bold mb-2 md:mb-6">
            <span className="text-white">Soluciones Digitales </span>
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
              para tu negocio
            </span>
          </h2>
          <p className="text-sm md:text-lg text-gray-400 max-w-2xl mx-auto">
            Desde validar tu idea hasta automatizar toda tu empresa. Desarrollamos tecnología con un enfoque estratégico, transparente y sin sorpresas.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-3 mb-12 md:mb-16 lg:max-w-[95%] xl:max-w-[90%] mx-auto">
          {/* Card 1: Landing Pages */}
          <ServiceCard color="purple" className="w-full">
            <CardHeader className="pb-1 md:pb-3">
              <CardHeading
                icon={Rocket}
                title="Landing Pages & Waitlists"
                description="Validación rápida para lanzamientos e ideas"
                color="purple"
              />
            </CardHeader>
            <CardContent className="px-0">
              <div className="px-3 md:px-6 mb-3 md:mb-4">
                <p className="text-[10px] md:text-sm text-gray-400 leading-relaxed text-left">
                  Necesitas moverte rápido. Creamos una página de aterrizaje moderna, visualmente impactante y optimizada para que tus visitantes se conviertan en suscriptores o clientes.
                </p>
              </div>
              <FeaturesList features={[
                "Diseño Premium con animaciones modernas",
                "Captación de datos con formularios integrados",
                "Entrega rápida: prototipo y desarrollo en tiempo récord",
                "Pago seguro: 50% al ver prototipo, 50% al entregar"
              ]} color="purple" />
              <div className="px-3 md:px-6 pb-3 md:pb-6">
                <Separator className="mb-3 md:mb-4" style={{ backgroundColor: '#1a1a1a' }} />
                <div className="text-xs text-gray-500 mb-3 font-medium">Ejemplo:</div>
                <Link
                  href="https://wentapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="relative rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-300">
                    <img
                      src="/portfolio/wentapp_preview.webp"
                      alt="WentApp - Landing Page"
                      className="w-full h-auto object-cover group-hover:opacity-90 transition-opacity duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center gap-2 text-white text-sm font-medium">
                        <span>wentapp.com</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </ServiceCard>

          {/* Card 2: SaaS */}
          <ServiceCard color="cyan" className="w-full">
            <CardHeader className="pb-1 md:pb-3">
              <CardHeading
                icon={Zap}
                title="Plataformas SaaS y Software a Medida"
                description="Automatización y transformación digital"
                color="cyan"
              />
            </CardHeader>
            <CardContent className="px-0">
              <div className="px-3 md:px-6 mb-3 md:mb-4">
                <p className="text-[10px] md:text-sm text-gray-400 leading-relaxed text-left">
                  ¿Tu empresa depende de hojas de Excel infinitas? Creamos el software a medida que tu negocio necesita para automatizar tareas y escalar sin límites.
                </p>
              </div>
              <FeaturesList features={[
                "Automatización completa: el software trabaja por ti, sin intervención manual",
                "A medida: herramienta construida específicamente para TU flujo de trabajo",
                "Metodología ágil: desarrollamos por fases con tu aprobación en cada paso",
                "Evolutivo y escalable: crece y mejora contigo según las necesidades de tu negocio"
              ]} color="cyan" />
              <div className="px-3 md:px-6 pb-3 md:pb-6">
                <Separator className="mb-3 md:mb-4" style={{ backgroundColor: '#1a1a1a' }} />
                <div className="text-xs text-gray-500 mb-3 font-medium">Ejemplo:</div>
                <Link
                  href="https://udbsports.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="relative rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-300">
                    <img
                      src="/portfolio/udbsports_preview.webp"
                      alt="UDBSports - Plataforma SaaS"
                      className="w-full h-auto object-cover group-hover:opacity-90 transition-opacity duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center gap-2 text-white text-sm font-medium">
                        <span>udbsports.com</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </ServiceCard>

          {/* Card 3: Webs Corporativas */}
          <ServiceCard color="blue" className="w-full">
            <CardHeader className="pb-1 md:pb-3">
              <CardHeading
                icon={Building2}
                title="Web Corporativa Profesional"
                description="Presencia digital completa para tu empresa"
                color="blue"
              />
            </CardHeader>
            <CardContent className="px-0">
              <div className="px-3 md:px-6 mb-3 md:mb-4">
                <p className="text-[10px] md:text-sm text-gray-400 leading-relaxed text-left">
                  Tu web es tu carta de presentación 24/7. Diseñamos sitios web completos que transmiten profesionalidad, organizan tu información y generan confianza inmediata.
                </p>
              </div>
              <FeaturesList features={[
                "Estructura completa: Inicio, Servicios, Equipo, Contacto",
                "Adaptabilidad perfecta en móviles, tablets y ordenadores",
                "Acompañamiento con reuniones de seguimiento",
                "Mantenimiento: nos ocupamos de que tu web nunca falle (30 días gratis post-lanzamiento)"
              ]} color="blue" />
              <div className="px-3 md:px-6 pb-3 md:pb-6">
                <Separator className="mb-3 md:mb-4" style={{ backgroundColor: '#1a1a1a' }} />
                <div className="text-xs text-gray-500 mb-3 font-medium">Ejemplo:</div>
                <Link
                  href="https://seesproduction.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="relative rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-300">
                    <img
                      src="/portfolio/seesproduction_preview.webp"
                      alt="SeesProduction - Web Corporativa"
                      className="w-full h-auto object-cover group-hover:opacity-90 transition-opacity duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center gap-2 text-white text-sm font-medium">
                        <span>seesproduction.com</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </ServiceCard>
        </div>

      </div>
    </section>
  )
}