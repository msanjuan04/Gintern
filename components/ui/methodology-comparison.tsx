import { Check, Minus, DollarSign, Target, GitBranch, MessageSquare, Settings, Palette, Rocket, Calendar, Clock, Package, FileText, CheckCircle2, RefreshCw, Users, LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ComparisonFeature {
  name: string
  icon: LucideIcon
  predictiva: boolean | string
  agil: boolean | string
}

const features: ComparisonFeature[] = [
  {
    name: "Presupuesto",
    icon: DollarSign,
    predictiva: "Cerrado",
    agil: "Por Fases",
  },
  {
    name: "Alcance",
    icon: Target,
    predictiva: "Definido al inicio",
    agil: "Evolutivo",
  },
  {
    name: "Flexibilidad",
    icon: GitBranch,
    predictiva: false,
    agil: true,
  },
  {
    name: "Feedback",
    icon: MessageSquare,
    predictiva: "Al final",
    agil: "Continuo",
  },
  {
    name: "Control",
    icon: Settings,
    predictiva: "Fechas fijas",
    agil: "Por hitos",
  },
  {
    name: "Prototipado previo",
    icon: Palette,
    predictiva: true,
    agil: true,
  },
  {
    name: "Ideal para",
    icon: Rocket,
    predictiva: "Landing Pages, Webs",
    agil: "SaaS, Software complejo",
  },
  {
    name: "Reuniones",
    icon: Calendar,
    predictiva: "Cada semana",
    agil: "Cada semana",
  },
  {
    name: "Duración ideal",
    icon: Clock,
    predictiva: "2-8 semanas",
    agil: "2-6 meses",
  },
  {
    name: "Entregas",
    icon: Package,
    predictiva: "Una entrega final",
    agil: "Incrementales",
  },
  {
    name: "Planificación",
    icon: FileText,
    predictiva: "Detallada al inicio",
    agil: "Adaptativa",
  },
  {
    name: "Testing",
    icon: CheckCircle2,
    predictiva: "Al final",
    agil: "Continuo",
  },
  {
    name: "Gestión de cambios",
    icon: RefreshCw,
    predictiva: "Limitada",
    agil: "Bienvenida",
  },
  {
    name: "Colaboración cliente",
    icon: Users,
    predictiva: "Inicio y fin",
    agil: "Constante",
  },
]

function MethodologyComparison() {
  return (
    <div className="w-full py-10 lg:py-20">
      <div className="container mx-auto">
        <div className="flex text-center justify-center items-center gap-4 flex-col mb-12">
          <Badge variant="outline" className="border-purple-500/30 text-purple-300">
            Comparativa
          </Badge>
          <div className="flex gap-2 flex-col">
            <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl text-center font-bold">
              Comparativa de{" "}
              <span
                style={{
                  color: "#a78bfa",
                  background: "linear-gradient(to bottom, #a78bfa, #c4b5fd, #60a5fa, #22d3ee)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Enfoques
              </span>
            </h2>
            <p className="text-lg leading-relaxed tracking-tight text-gray-400 max-w-xl text-center">
              Entiende las diferencias entre nuestras metodologías
            </p>
          </div>
        </div>

        {/* Mobile Layout - Tabla */}
        <div className="md:hidden w-full overflow-hidden bg-black" style={{ border: '1px solid #1a1a1a', borderRadius: '8px' }}>
          {/* Headers */}
          <div className="grid grid-cols-3" style={{ borderBottom: '1px solid #1a1a1a' }}>
            <div className="px-3 py-3 bg-gradient-to-br from-gray-950/50 to-black" style={{ borderRight: '1px solid #1a1a1a' }}>
              <b className="text-sm text-gray-200">Características</b>
              <p className="text-[10px] text-gray-400 mt-1 leading-tight">Aspectos clave de comparación</p>
            </div>
            <div className="px-3 py-3 bg-gradient-to-br from-purple-900/20 to-black text-center" style={{ borderRight: '1px solid #1a1a1a' }}>
              <p className="text-sm font-bold text-purple-300">Predictiva</p>
            </div>
            <div className="px-3 py-3 bg-gradient-to-br from-blue-900/20 to-black text-center">
              <p className="text-sm font-bold text-blue-300">Ágil</p>
            </div>
          </div>

          {/* Features rows */}
          {features.map((feature) => (
            <div key={feature.name} className="grid grid-cols-3 last:border-b-0" style={{ borderBottom: '1px solid #1a1a1a' }}>
              {/* Feature name */}
              <div className="px-3 py-3 text-gray-300 text-sm font-medium flex items-center gap-2" style={{ borderRight: '1px solid #1a1a1a' }}>
                <feature.icon className="w-3.5 h-3.5 text-white flex-shrink-0" />
                {feature.name}
              </div>

              {/* Predictiva value */}
              <div className="px-3 py-3 flex justify-center items-center" style={{ borderRight: '1px solid #1a1a1a' }}>
                {typeof feature.predictiva === "boolean" ? (
                  feature.predictiva ? (
                    <Check className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Minus className="w-4 h-4 text-gray-600" />
                  )
                ) : (
                  <p className="text-xs text-gray-300 text-center">{feature.predictiva}</p>
                )}
              </div>

              {/* Ágil value */}
              <div className="px-3 py-3 flex justify-center items-center">
                {typeof feature.agil === "boolean" ? (
                  feature.agil ? (
                    <Check className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Minus className="w-4 h-4 text-gray-600" />
                  )
                ) : (
                  <p className="text-xs text-gray-300 text-center">{feature.agil}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:grid text-left w-full grid-cols-3 overflow-hidden bg-black" style={{ border: '1px solid #1a1a1a', borderRadius: '8px' }}>
          {/* Headers */}
          <div className="px-6 py-6 bg-gradient-to-br from-gray-950/50 to-black" style={{ borderBottom: '1px solid #1a1a1a', borderRight: '1px solid #1a1a1a' }}>
            <b className="text-gray-200 text-lg">Características</b>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">Aspectos clave de comparación</p>
          </div>

          <div className="px-6 py-6 gap-2 flex flex-col bg-gradient-to-br from-purple-900/20 to-black" style={{ borderBottom: '1px solid #1a1a1a', borderRight: '1px solid #1a1a1a' }}>
            <p className="text-2xl font-bold text-purple-300">Predictiva</p>
            <p className="text-xs text-purple-400">(Waterfall)</p>
            <p className="text-sm text-gray-400 mt-2">
              Ideal para proyectos donde sabes lo que quieres y necesitas rapidez.
            </p>
          </div>

          <div className="px-6 py-6 gap-2 flex flex-col bg-gradient-to-br from-blue-900/20 to-black" style={{ borderBottom: '1px solid #1a1a1a' }}>
            <p className="text-2xl font-bold text-blue-300">Ágil</p>
            <p className="text-xs text-blue-400">(Iterativa / Incremental)</p>
            <p className="text-sm text-gray-400 mt-2">
              Ideal para plataformas complejas que requieren flexibilidad.
            </p>
          </div>

          {/* Features rows */}
          {features.map((feature) => (
            <div key={feature.name} className="contents">
              {/* Feature name - Primera columna */}
              <div className="px-6 py-4 text-gray-300 font-medium flex items-center gap-3" style={{ borderBottom: '1px solid #1a1a1a', borderRight: '1px solid #1a1a1a' }}>
                <feature.icon className="w-4 h-4 text-white flex-shrink-0" />
                {feature.name}
              </div>

              {/* Predictiva value - Segunda columna */}
              <div className="px-6 py-4 flex justify-center items-center" style={{ borderBottom: '1px solid #1a1a1a', borderRight: '1px solid #1a1a1a' }}>
                {typeof feature.predictiva === "boolean" ? (
                  feature.predictiva ? (
                    <Check className="w-5 h-5 text-purple-400" />
                  ) : (
                    <Minus className="w-5 h-5 text-gray-600" />
                  )
                ) : (
                  <p className="text-sm text-gray-300 text-center">{feature.predictiva}</p>
                )}
              </div>

              {/* Ágil value - Tercera columna */}
              <div className="px-6 py-4 flex justify-center items-center" style={{ borderBottom: '1px solid #1a1a1a' }}>
                {typeof feature.agil === "boolean" ? (
                  feature.agil ? (
                    <Check className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Minus className="w-5 h-5 text-gray-600" />
                  )
                ) : (
                  <p className="text-sm text-gray-300 text-center">{feature.agil}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export { MethodologyComparison }

