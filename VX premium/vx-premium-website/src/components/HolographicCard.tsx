'use client'

import { useState } from 'react'

interface HolographicCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function HolographicCard({ children, className = '', style = {} }: HolographicCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/80 via-purple-900/20 to-slate-900/80 backdrop-blur-xl border border-cyan-500/20 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20 ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Simplified holographic overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent transform -skew-x-12 transition-transform duration-300 ${isHovered ? 'translate-x-full' : '-translate-x-full'}`} />
      
      {/* Simplified animated border */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 transition-opacity duration-200 blur-sm ${isHovered ? 'opacity-50' : 'opacity-0'}`} />
      
      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>
      
      {/* Simplified glitch effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}
