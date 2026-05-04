"use client"

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Shield, MessageSquare, Heart, DollarSign, CheckCircle2, Rocket, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

export function ServicesGrid() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="bg-black pt-6 pb-12 md:pt-8 md:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
          {/* Card 1: Cero Sorpresas - Large */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-3"
          >
          <Card className="group overflow-hidden bg-black border sm:rounded-none h-full flex flex-col" style={{ backgroundColor: '#000000', borderColor: '#1a1a1a', borderWidth: '1px' }}>
            <CardHeader>
              <div className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  <h3 className="text-white text-base sm:text-lg md:text-xl font-bold">1. Cero Sorpresas en el Presupuesto</h3>
                </div>
                <p className="text-gray-400 mt-2 w-full text-xs sm:text-sm leading-relaxed">
                  Trabajamos con <span className="text-white">transparencia radical</span>. En proyectos web, el precio suele ser <span className="text-white">cerrado</span>. En desarrollos complejos, trabajamos por <span className="text-white">fases aprobadas</span> por ti. Sabrás siempre cuánto inviertes y qué obtienes.
                </p>
              </div>
            </CardHeader>
            <div className="relative h-fit pl-3 sm:pl-4 md:pl-8 pb-3 sm:pb-4">
              <div className="absolute -inset-3 sm:-inset-4 [background:radial-gradient(75%_95%_at_50%_0%,transparent,rgba(0,0,0,1)_100%)]"></div>
              <div className="bg-black overflow-hidden border-l border-t border-gray-800 pl-2 pt-2 rounded-tl-lg">
                <div className="bg-gradient-to-br from-green-900/20 to-black p-3 sm:p-4 md:p-5 rounded-lg border border-green-500/20">
                  <div className="space-y-3">
                    {/* Budget header */}
                    <div className="flex items-center justify-between gap-3 pb-2 border-b border-green-500/20">
                      <div className="flex items-center gap-2.5">
                        <motion.div 
                          className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500/30 to-green-600/20 border border-green-500/40 flex items-center justify-center shadow-sm"
                          animate={{ 
                            boxShadow: [
                              '0 0 0px rgba(34, 197, 94, 0.4)',
                              '0 0 8px rgba(34, 197, 94, 0.6)',
                              '0 0 0px rgba(34, 197, 94, 0.4)'
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <DollarSign className="w-4 h-4 text-green-400" />
                          </motion.div>
                        </motion.div>
                        <div className="flex-1 space-y-1">
                          <div className="h-1.5 bg-green-400/40 rounded w-20"></div>
                          <div className="h-1 bg-green-500/25 rounded w-12"></div>
                        </div>
                      </div>
                      <div className="px-2 py-1 rounded bg-green-500/20 border border-green-500/30">
                        <span className="text-[10px] font-semibold text-green-400">€</span>
                      </div>
                    </div>
                    {/* Budget items */}
                    <div className="space-y-1.5">
                      <motion.div 
                        className="flex items-center justify-between gap-2 p-1.5 rounded bg-gray-900/30 border border-gray-800/50 hover:border-green-500/30 transition-colors"
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <motion.div
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                          >
                            <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                          </motion.div>
                          <div className="flex-1 space-y-0.5">
                            <motion.div 
                              className="h-1 bg-gray-600/40 rounded"
                              animate={{ width: ['100%', '95%', '100%'] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            ></motion.div>
                            <motion.div 
                              className="h-0.5 bg-gray-700/30 rounded"
                              animate={{ width: ['66%', '70%', '66%'] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                            ></motion.div>
                          </div>
                        </div>
                        <div className="text-[9px] font-medium text-green-400">2.500€</div>
                      </motion.div>
                      <motion.div 
                        className="flex items-center justify-between gap-2 p-1.5 rounded bg-gray-900/30 border border-gray-800/50 hover:border-green-500/30 transition-colors"
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <motion.div
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                          >
                            <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                          </motion.div>
                          <div className="flex-1 space-y-0.5">
                            <motion.div 
                              className="h-1 bg-gray-600/40 rounded"
                              animate={{ width: ['83%', '88%', '83%'] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            ></motion.div>
                            <motion.div 
                              className="h-0.5 bg-gray-700/30 rounded"
                              animate={{ width: ['50%', '55%', '50%'] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                            ></motion.div>
                          </div>
                        </div>
                        <div className="text-[9px] font-medium text-green-400">1.800€</div>
                      </motion.div>
                      <motion.div 
                        className="flex items-center justify-between gap-2 p-1.5 rounded bg-gray-900/30 border border-gray-800/50 hover:border-green-500/30 transition-colors"
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <motion.div
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                          >
                            <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                          </motion.div>
                          <div className="flex-1 space-y-0.5">
                            <motion.div 
                              className="h-1 bg-gray-600/40 rounded"
                              animate={{ width: ['66%', '71%', '66%'] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            ></motion.div>
                            <motion.div 
                              className="h-0.5 bg-gray-700/30 rounded"
                              animate={{ width: ['40%', '45%', '40%'] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.3 }}
                            ></motion.div>
                          </div>
                        </div>
                        <div className="text-[9px] font-medium text-green-400">950€</div>
                      </motion.div>
                    </div>
                    {/* Total */}
                    <div className="pt-1.5 border-t border-green-500/20">
                      <motion.div 
                        className="flex items-center justify-between p-1.5 rounded bg-gradient-to-r from-green-500/10 to-transparent"
                        animate={{ 
                          background: [
                            'linear-gradient(to right, rgba(34, 197, 94, 0.1), transparent)',
                            'linear-gradient(to right, rgba(34, 197, 94, 0.2), transparent)',
                            'linear-gradient(to right, rgba(34, 197, 94, 0.1), transparent)'
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <motion.div 
                          className="h-1.5 bg-green-400/50 rounded"
                          animate={{ width: ['4rem', '4.5rem', '4rem'] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        ></motion.div>
                        <motion.div 
                          className="text-xs font-bold text-green-400"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          5.250€
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          </motion.div>

          {/* Card 2: Hablamos tu idioma - Right Side */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
          <Card className="group overflow-hidden bg-black border sm:rounded-none h-full flex flex-col" style={{ backgroundColor: '#000000', borderColor: '#1a1a1a', borderWidth: '1px' }}>
            <CardHeader>
              <div className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  <h3 className="text-white text-base sm:text-lg md:text-xl font-bold">2. Hablamos tu idioma, no "Código"</h3>
                </div>
                <p className="text-gray-400 mt-2 w-full text-xs sm:text-sm leading-relaxed">
                  Conocemos la tecnología, pero nos comunicamos en <span className="text-white">términos de negocio</span>. Te explicamos cada paso de forma sencilla para que siempre tengas el <span className="text-white">control</span> de tu proyecto.
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pb-3 sm:pb-4">
              <div className="relative mb-3 sm:mb-4 md:mb-0">
                <div className="absolute -inset-3 sm:-inset-4 [background:radial-gradient(50%_75%_at_75%_50%,transparent,rgba(0,0,0,1)_100%)]"></div>
                <div className="aspect-76/59 overflow-hidden border border-gray-800 rounded-r-lg bg-gradient-to-br from-blue-900/20 to-black p-3 sm:p-4 md:p-5">
                  {/* Language translation illustration */}
                  <div className="h-full flex flex-col justify-center space-y-3">
                    {/* Two panels: Code vs Business */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Code panel */}
                      <div className="bg-gray-900/50 rounded-lg p-2 border border-gray-800/60">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/40"></div>
                          <div className="text-[8px] text-gray-500 font-mono">code.ts</div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1 bg-red-400/30 rounded w-full font-mono text-[7px] text-red-400/60">async function</div>
                          <div className="h-1 bg-gray-700/40 rounded w-3/4 font-mono text-[7px] text-gray-500">return fetch(...)</div>
                          <div className="h-1 bg-gray-700/40 rounded w-2/3 font-mono text-[7px] text-gray-500">{`}`}</div>
                        </div>
                      </div>
                      
                      {/* Business panel */}
                      <div className="bg-blue-500/10 rounded-lg p-2 border border-blue-500/30">
                        <div className="flex items-center gap-1.5 mb-2">
                          <MessageSquare className="w-3 h-3 text-blue-400" />
                          <div className="text-[8px] text-blue-400 font-medium">Negocio</div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1 bg-blue-400/40 rounded w-full"></div>
                          <div className="h-1 bg-blue-400/30 rounded w-3/4"></div>
                          <div className="h-1 bg-blue-400/20 rounded w-2/3"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Arrow pointing right */}
                    <div className="flex items-center justify-center py-1">
                      <motion.div 
                        className="flex items-center gap-1.5"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <motion.div 
                          className="h-0.5 bg-blue-500/30 rounded"
                          animate={{ width: ['2rem', '2.5rem', '2rem'], opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        ></motion.div>
                        <motion.div 
                          className="w-0 h-0 border-l-[4px] border-l-blue-400/50 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        ></motion.div>
                      </motion.div>
                    </div>
                    
                    {/* Result: Clear communication */}
                    <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/5 rounded-lg p-2 border border-blue-500/30">
                        <div className="flex items-center gap-2 mb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                          <div className="text-[8px] text-blue-400 font-semibold">Entendimiento claro</div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1 bg-blue-300/40 rounded w-full"></div>
                          <div className="h-1 bg-blue-300/30 rounded w-5/6"></div>
                        </div>
                      </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Card 3: No desaparecemos - Bottom Left */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2"
          >
          <Card className="group overflow-hidden bg-black border sm:rounded-none h-full flex flex-col" style={{ backgroundColor: '#000000', borderColor: '#1a1a1a', borderWidth: '1px' }}>
            <CardHeader>
              <div className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                  <h3 className="text-white text-base sm:text-lg md:text-xl font-bold">3. No desaparecemos tras la entrega</h3>
                </div>
                <p className="text-gray-400 mt-2 w-full text-xs sm:text-sm leading-relaxed">
                  Buscamos <span className="text-white">relaciones a largo plazo</span>. Ofrecemos planes de mantenimiento y evolución para que tu plataforma esté siempre <span className="text-white">segura, actualizada y operativa</span> mientras tú te enfocas en vender.
                </p>
              </div>
            </CardHeader>
            <CardContent className="relative flex-1 flex flex-col pl-3 sm:pl-4 md:pl-8 pb-3 sm:pb-4">
              <div className="absolute -inset-3 sm:-inset-4 [background:radial-gradient(75%_95%_at_50%_0%,transparent,rgba(0,0,0,1)_100%)]"></div>
              <div className="bg-black overflow-hidden border-l border-t border-gray-800 pl-2 pt-2 rounded-tl-lg">
                {/* Long-term relationship illustration */}
                <div className="bg-gradient-to-br from-pink-900/20 to-black p-2 sm:p-3 md:p-4 rounded-lg border border-pink-500/20">
                  <div className="space-y-3">
                    {/* Timeline representation */}
                    <div className="relative">
                      <motion.div 
                        className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500/15 via-pink-500/10 to-pink-500/15 transform -translate-y-1/2"
                        animate={{ 
                          background: [
                            'linear-gradient(to right, rgba(236, 72, 153, 0.15), rgba(236, 72, 153, 0.1), rgba(236, 72, 153, 0.15))',
                            'linear-gradient(to right, rgba(236, 72, 153, 0.25), rgba(236, 72, 153, 0.15), rgba(236, 72, 153, 0.25))',
                            'linear-gradient(to right, rgba(236, 72, 153, 0.15), rgba(236, 72, 153, 0.1), rgba(236, 72, 153, 0.15))'
                          ]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      ></motion.div>
                      <div className="flex items-center justify-between relative z-10">
                        <motion.div 
                          className="flex flex-col items-center gap-1"
                          animate={{ scale: [1, 1.1, 1], y: [0, -2, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                        >
                          <motion.div 
                            className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500/30 to-pink-600/20 border border-pink-500/50 flex items-center justify-center shadow-sm"
                            animate={{ 
                              boxShadow: [
                                '0 0 0px rgba(236, 72, 153, 0.5)',
                                '0 0 8px rgba(236, 72, 153, 0.8)',
                                '0 0 0px rgba(236, 72, 153, 0.5)'
                              ]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-pink-400" />
                          </motion.div>
                          <div className="text-[7px] text-pink-400/70 font-medium">Inicio</div>
                        </motion.div>
                        <motion.div 
                          className="flex flex-col items-center gap-1"
                          animate={{ scale: [1, 1.1, 1], y: [0, -2, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
                        >
                          <motion.div 
                            className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500/40 to-pink-600/30 border border-pink-500/60 flex items-center justify-center shadow-sm"
                            animate={{ 
                              boxShadow: [
                                '0 0 0px rgba(236, 72, 153, 0.6)',
                                '0 0 10px rgba(236, 72, 153, 0.9)',
                                '0 0 0px rgba(236, 72, 153, 0.6)'
                              ]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
                          >
                            <Heart className="w-3.5 h-3.5 text-pink-400" />
                          </motion.div>
                          <div className="text-[7px] text-pink-400/70 font-medium">Apoyo</div>
                        </motion.div>
                        <motion.div 
                          className="flex flex-col items-center gap-1"
                          animate={{ scale: [1, 1.1, 1], y: [0, -2, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
                        >
                          <motion.div 
                            className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500/50 to-pink-600/40 border border-pink-500/70 flex items-center justify-center shadow-sm"
                            animate={{ 
                              boxShadow: [
                                '0 0 0px rgba(236, 72, 153, 0.7)',
                                '0 0 12px rgba(236, 72, 153, 1)',
                                '0 0 0px rgba(236, 72, 153, 0.7)'
                              ]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
                          >
                            <Shield className="w-3.5 h-3.5 text-pink-400" />
                          </motion.div>
                          <div className="text-[7px] text-pink-400/70 font-medium">Crecimiento</div>
                        </motion.div>
                      </div>
                    </div>
                    
                    {/* Support features */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-2 bg-gradient-to-r from-gray-900/40 to-gray-900/20 rounded p-1.5 border border-gray-800/60 hover:border-pink-500/40 transition-colors">
                        <div className="w-5 h-5 rounded bg-pink-500/20 border border-pink-500/40 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-2.5 h-2.5 text-pink-400" />
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <div className="h-1 bg-gray-500/40 rounded w-full"></div>
                          <div className="h-0.5 bg-gray-600/30 rounded w-3/4"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-gradient-to-r from-gray-900/40 to-gray-900/20 rounded p-1.5 border border-gray-800/60 hover:border-pink-500/40 transition-colors">
                        <div className="w-5 h-5 rounded bg-pink-500/20 border border-pink-500/40 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-2.5 h-2.5 text-pink-400" />
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <div className="h-1 bg-gray-500/40 rounded w-5/6"></div>
                          <div className="h-0.5 bg-gray-600/30 rounded w-2/3"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-gradient-to-r from-gray-900/40 to-gray-900/20 rounded p-1.5 border border-gray-800/60 hover:border-pink-500/40 transition-colors">
                        <div className="w-5 h-5 rounded bg-pink-500/20 border border-pink-500/40 flex items-center justify-center flex-shrink-0">
                          <Rocket className="w-2.5 h-2.5 text-pink-400" />
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <div className="h-1 bg-gray-500/40 rounded w-4/6"></div>
                          <div className="h-0.5 bg-gray-600/30 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Card 4: Resultados que Importan - Bottom Right */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-3"
          >
          <Card className="group overflow-hidden bg-black border sm:rounded-none h-full flex flex-col" style={{ backgroundColor: '#000000', borderColor: '#1a1a1a', borderWidth: '1px' }}>
            <CardHeader>
              <div className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Rocket className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  <h3 className="text-white text-base sm:text-lg md:text-xl font-bold">4. Resultados que Importan</h3>
                </div>
                <p className="text-gray-400 mt-2 w-full text-xs sm:text-sm leading-relaxed">
                  No solo desarrollamos, optimizamos para <span className="text-white">resultados</span>. Cada proyecto está pensado para generar <span className="text-white">valor real</span>: más conversiones, mejor experiencia de usuario y crecimiento sostenible de tu negocio.
                </p>
              </div>
            </CardHeader>
            <div className="relative flex-1 flex flex-col pl-3 sm:pl-4 md:pl-8 pb-3 sm:pb-4">
              <div className="absolute -inset-3 sm:-inset-4 [background:radial-gradient(75%_95%_at_50%_0%,transparent,rgba(0,0,0,1)_100%)]"></div>
              <div className="bg-black overflow-hidden border-l border-t border-gray-800 pl-2 pt-2 rounded-tl-lg">
                <div className="bg-gradient-to-br from-purple-900/20 to-black p-3 sm:p-4 md:p-5 rounded-lg border border-purple-500/20">
                  <div className="space-y-3">
                    {/* Dashboard header */}
                    <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/30 to-purple-600/20 border border-purple-500/40 flex items-center justify-center shadow-sm">
                          <Rocket className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="h-1.5 bg-purple-400/50 rounded w-20"></div>
                          <div className="h-1 bg-purple-500/30 rounded w-12"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <motion.div 
                          className="w-1.5 h-1.5 rounded-full bg-green-400"
                          animate={{ 
                            scale: [1, 1.3, 1],
                            opacity: [1, 0.7, 1],
                            boxShadow: [
                              '0 0 0px rgba(34, 197, 94, 0.8)',
                              '0 0 8px rgba(34, 197, 94, 1)',
                              '0 0 0px rgba(34, 197, 94, 0.8)'
                            ]
                          }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        ></motion.div>
                        <motion.span 
                          className="text-[9px] text-purple-400 font-semibold"
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          Live
                        </motion.span>
                      </div>
                    </div>
                    {/* Metrics cards */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="bg-gray-900/40 rounded-lg p-2 border border-gray-800/60">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                            <span className="text-[8px] text-green-400">↑</span>
                          </div>
                          <div className="text-[7px] text-gray-400">Conversiones</div>
                        </div>
                        <div className="h-3 bg-gradient-to-r from-green-500/40 to-green-600/20 rounded mb-0.5"></div>
                        <div className="text-[10px] font-bold text-green-400">
                          +85%
                        </div>
                      </div>
                      <div className="bg-gray-900/40 rounded-lg p-2 border border-gray-800/60">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                            <span className="text-[8px] text-blue-400">↑</span>
                          </div>
                          <div className="text-[7px] text-gray-400">Usuarios</div>
                        </div>
                        <div className="h-3 bg-gradient-to-r from-blue-500/40 to-blue-600/20 rounded mb-0.5"></div>
                        <div className="text-[10px] font-bold text-blue-400">
                          +65%
                        </div>
                      </div>
                    </div>
                    {/* Mini chart */}
                    <div className="bg-gray-900/40 rounded-lg p-2 border border-gray-800/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="h-1 bg-gray-600/40 rounded w-12"></div>
                        <Zap className="w-3 h-3 text-purple-400" />
                      </div>
                      <div className="h-10 flex items-end justify-between gap-0.5">
                        <motion.div 
                          className="flex-1 bg-gradient-to-t from-purple-500/50 to-purple-500/10 rounded-t border border-purple-500/40"
                          animate={{ height: ['1.5rem', '1.75rem', '1.5rem'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                        ></motion.div>
                        <motion.div 
                          className="flex-1 bg-gradient-to-t from-purple-500/60 to-purple-500/20 rounded-t border border-purple-500/50"
                          animate={{ height: ['2rem', '2.25rem', '2rem'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                        ></motion.div>
                        <motion.div 
                          className="flex-1 bg-gradient-to-t from-purple-500/50 to-purple-500/10 rounded-t border border-purple-500/40"
                          animate={{ height: ['1.75rem', '2rem', '1.75rem'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                        ></motion.div>
                        <motion.div 
                          className="flex-1 bg-gradient-to-t from-purple-500/70 to-purple-500/30 rounded-t border border-purple-500/60"
                          animate={{ height: ['2.5rem', '2.75rem', '2.5rem'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                        ></motion.div>
                        <motion.div 
                          className="flex-1 bg-gradient-to-t from-purple-500/40 to-purple-500/5 rounded-t border border-purple-500/30"
                          animate={{ height: ['1rem', '1.25rem', '1rem'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
                        ></motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

