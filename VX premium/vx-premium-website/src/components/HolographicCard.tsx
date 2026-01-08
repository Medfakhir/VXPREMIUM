'use client'

import { useState, useRef } from 'react'

interface HolographicCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function HolographicCard({ children, className = '', style = {} }: HolographicCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const rotateXValue = ((y - centerY) / centerY) * -10
    const rotateYValue = ((x - centerX) / centerX) * 10
    
    setRotateX(rotateXValue)
    setRotateY(rotateYValue)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setRotateX(0)
    setRotateY(0)
  }

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/80 via-purple-900/20 to-slate-900/80 backdrop-blur-xl border border-cyan-500/20 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/30 ${className}`}
      style={{
        ...style,
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${isHovered ? 'scale(1.02)' : 'scale(1)'}`,
        transition: 'transform 0.1s ease-out, box-shadow 0.3s ease'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Animated holographic overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent transform -skew-x-12 transition-transform duration-700 ${isHovered ? 'translate-x-full' : '-translate-x-full'}`} />
      
      {/* Animated border glow */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/40 via-purple-500/40 to-pink-500/40 transition-opacity duration-300 blur-md ${isHovered ? 'opacity-60' : 'opacity-0'}`} />
      
      {/* Shimmer effect */}
      <div className={`absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
      
      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>
      
      {/* Corner accents */}
      <div className={`absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyan-400/50 transition-all duration-300 ${isHovered ? 'opacity-100 scale-110' : 'opacity-0 scale-100'}`} />
      <div className={`absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-purple-400/50 transition-all duration-300 ${isHovered ? 'opacity-100 scale-110' : 'opacity-0 scale-100'}`} />
      
      {/* Glitch effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}
