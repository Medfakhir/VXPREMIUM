'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sphere, MeshDistortMaterial, Text3D, Float, Environment } from '@react-three/drei'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useSpring, animated } from 'react-spring'
import { useEffect, useRef, useState } from 'react'
import { 
  IconCode, 
  IconDeviceMobile, 
  IconWorld, 
  IconDatabase, 
  IconCloud,
  IconRocket,
  IconShield,
  IconStar,
  IconCheck,
  IconArrowRight,
  IconMail,
  IconPhone,
  IconMapPin,
  IconBrandReact,
  IconBrandNextjs,
  IconBrandPython,
  IconBrandDocker
} from '@tabler/icons-react'

// Dynamic 3D components
import Scene3D from '@/components/Scene3D'
import HolographicCard from '@/components/HolographicCard'
import MatrixRain from '@/components/MatrixRain'

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isClient, setIsClient] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
    // Direct mouse move for instant response
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    // Track scroll for performance optimization
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const services = [
    {
      icon: IconWorld,
      title: "Neural Web Systems",
      description: "AI-powered web applications that think and adapt",
      features: ["Quantum Computing Ready", "Neural Networks", "Self-Healing Code", "Predictive Analytics"],
      color: "#00ffff"
    },
    {
      icon: IconDeviceMobile,
      title: "Holographic Mobile Apps", 
      description: "Next-generation mobile experiences beyond reality",
      features: ["AR/VR Integration", "Brain-Computer Interface", "Quantum Encryption", "Biometric Evolution"],
      color: "#ff0080"
    },
    {
      icon: IconCode,
      title: "Consciousness Software",
      description: "Software that learns, evolves, and transcends limitations",
      features: ["Self-Writing Code", "Emotional AI", "Quantum Logic", "Infinite Scalability"],
      color: "#8000ff"
    },
    {
      icon: IconDatabase,
      title: "Quantum Data Vaults",
      description: "Data storage that exists across multiple dimensions",
      features: ["Quantum Entanglement", "Time-Travel Backups", "Parallel Processing", "Infinite Capacity"],
      color: "#00ff80"
    },
    {
      icon: IconCloud,
      title: "Interdimensional Cloud",
      description: "Computing power that transcends physical reality",
      features: ["Multiverse Deployment", "Reality Synchronization", "Consciousness Backup", "Infinite Resources"],
      color: "#ff8000"
    },
    {
      icon: IconShield,
      title: "Quantum Security Matrix",
      description: "Protection that exists before threats are even conceived",
      features: ["Precognitive Defense", "Reality Encryption", "Time-Lock Security", "Consciousness Firewall"],
      color: "#ff0040"
    }
  ]

  const techIcons = [
    { icon: IconBrandReact, name: "React Quantum", color: "#00ffff" },
    { icon: IconBrandNextjs, name: "Next.js Infinity", color: "#ffffff" },
    { icon: IconBrandPython, name: "Python Neural", color: "#ffff00" },
    { icon: IconBrandDocker, name: "Docker Dimension", color: "#0080ff" },
  ]

  const pricingPlans = [
    {
      name: "GENESIS",
      price: "£5,000",
      description: "Birth of digital consciousness",
      features: [
        "Neural Website Architecture",
        "Quantum Responsive Design", 
        "AI-Powered Contact Forms",
        "Predictive SEO Engine",
        "6 Months Evolution Support",
        "Reality Analytics Dashboard"
      ],
      popular: false,
      color: "#00ffff"
    },
    {
      name: "TRANSCENDENCE",
      price: "£15,000",
      description: "Beyond the boundaries of possibility",
      features: [
        "Consciousness-Driven Applications",
        "Quantum Database Integration",
        "Telepathic User Authentication",
        "Interdimensional Admin Panel",
        "Neural API Development",
        "12 Months Reality Support",
        "Multiverse Analytics",
        "Quantum Payment Processing"
      ],
      popular: true,
      color: "#ff0080"
    },
    {
      name: "OMNIPOTENCE",
      price: "£50,000+",
      description: "Unlimited power across all realities",
      features: [
        "Complete Reality Reconstruction",
        "Consciousness Mobile App",
        "Quantum Cloud Infrastructure",
        "Universal Security Matrix",
        "Infinite Custom Integrations",
        "Eternal Support Across Time",
        "Omniscient Development Team",
        "Reality Monitoring & Control"
      ],
      popular: false,
      color: "#8000ff"
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative gpu-accelerated">
      {/* Mouse Follower - Only render on desktop */}
      {isClient && (
        <div 
          className="fixed w-6 h-6 bg-cyan-400 rounded-full pointer-events-none z-50 mix-blend-difference hidden md:block"
          style={{
            left: mousePosition.x - 12,
            top: mousePosition.y - 12,
            transition: 'none'
          }}
        />
      )}

      {/* Mobile-Responsive Navigation */}
      <nav className="fixed top-3 left-1/2 transform -translate-x-1/2 z-50 px-4 md:px-8 py-3 md:py-4 rounded-full bg-black/20 backdrop-blur-xl border border-cyan-500/30 w-[95%] md:w-auto max-w-6xl transition-all duration-300">
        <div className="flex items-center justify-between md:justify-center md:space-x-8">
          <div className="text-lg md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
            VX PREMIUM
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex space-x-6">
            <a href="#services" className="text-cyan-400 hover:text-white transition-colors text-sm">
              NEURAL SERVICES
            </a>
            <a href="#tech" className="text-cyan-400 hover:text-white transition-colors text-sm">
              QUANTUM TECH
            </a>
            <a href="#pricing" className="text-cyan-400 hover:text-white transition-colors text-sm">
              REALITY PRICING
            </a>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-cyan-400 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <button className="hidden md:block px-3 md:px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-black font-bold hover:shadow-lg transition-all duration-200 text-xs md:text-sm">
            CONTACT
          </button>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4">
            <div className="flex flex-col space-y-4">
              <a href="#services" className="text-cyan-400 hover:text-white transition-colors text-sm" onClick={() => setMobileMenuOpen(false)}>
                NEURAL SERVICES
              </a>
              <a href="#tech" className="text-cyan-400 hover:text-white transition-colors text-sm" onClick={() => setMobileMenuOpen(false)}>
                QUANTUM TECH
              </a>
              <a href="#pricing" className="text-cyan-400 hover:text-white transition-colors text-sm" onClick={() => setMobileMenuOpen(false)}>
                REALITY PRICING
              </a>
              <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-black font-bold hover:shadow-lg transition-all duration-200 text-sm">
                CONTACT
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* 3D Hero Section */}
      <section className="h-screen relative">
        <div className="absolute inset-0">
          {isClient && scrollY < 100 && (
            <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
              <Scene3D />
              <OrbitControls enableZoom={false} enablePan={false} />
              <Environment preset="night" />
            </Canvas>
          )}
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
          <div className="text-center max-w-6xl mx-auto animate-fade-in">
            <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black mb-6 md:mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              BEYOND
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-8 md:mb-12 text-cyan-300 max-w-4xl mx-auto font-light tracking-wide px-4">
              WE DON&apos;T BUILD WEBSITES. WE ARCHITECT DIGITAL REALITIES.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center px-4">
              <button className="w-full sm:w-auto px-6 md:px-12 py-3 md:py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full text-black font-bold text-lg md:text-xl hover:shadow-xl transition-all duration-200 flex items-center justify-center group">
                <IconRocket className="mr-2 md:mr-3" size={20} />
                <span className="hidden sm:inline">TRANSCEND REALITY</span>
                <span className="sm:hidden">TRANSCEND</span>
              </button>
              <button className="w-full sm:w-auto px-6 md:px-12 py-3 md:py-4 border-2 border-cyan-400 text-cyan-400 rounded-full font-bold text-lg md:text-xl hover:bg-cyan-400 hover:text-black transition-all duration-200 flex items-center justify-center group">
                <IconStar className="mr-2 md:mr-3" size={20} />
                <span className="hidden sm:inline">WITNESS THE IMPOSSIBLE</span>
                <span className="sm:hidden">WITNESS</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Neural Services Section */}
      <section id="services" className="py-16 md:py-32 px-4 md:px-6 relative">
        <div className="text-center mb-12 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black mb-4 md:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
            NEURAL SERVICES
          </h2>
          <p className="text-lg md:text-2xl text-cyan-300 max-w-4xl mx-auto font-light tracking-wide px-4">
            TRANSCENDING THE BOUNDARIES OF DIGITAL POSSIBILITY
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {services.map((service, index) => (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <HolographicCard className="h-full group">
                <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 md:mb-6">
                  <div 
                    className="p-3 md:p-4 rounded-2xl mb-3 sm:mb-0 sm:mr-4 relative overflow-hidden transition-all duration-200"
                    style={{ backgroundColor: service.color + '20' }}
                  >
                    <service.icon size={28} style={{ color: service.color }} />
                    <div 
                      className="absolute inset-0 bg-gradient-to-r opacity-20 group-hover:opacity-30 transition-opacity duration-200"
                      style={{ background: `linear-gradient(45deg, ${service.color}, transparent)` }}
                    />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white">{service.title}</h3>
                </div>
                <p className="text-cyan-200 mb-4 md:mb-6 text-base md:text-lg leading-relaxed">{service.description}</p>
                <ul className="space-y-2 md:space-y-3">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-cyan-100">
                      <IconCheck size={16} className="text-cyan-400 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                      <span className="font-medium text-sm md:text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
              </HolographicCard>
            </div>
          ))}
        </div>
      </section>

      {/* Quantum Technologies Section */}
      <section id="tech" className="py-16 md:py-32 px-4 md:px-6 relative bg-gradient-to-b from-black via-purple-900/10 to-black">
        <div className="text-center mb-12 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black mb-4 md:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
            QUANTUM ARSENAL
          </h2>
          <p className="text-lg md:text-2xl text-purple-300 max-w-4xl mx-auto font-light tracking-wide px-4">
            TECHNOLOGIES THAT EXIST BEYOND CURRENT REALITY
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-6xl mx-auto">
          {techIcons.map((tech, index) => (
            <div
              key={index}
              className="relative group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div 
                className="p-4 md:p-8 rounded-2xl md:rounded-3xl border-2 backdrop-blur-xl transition-all duration-200 group-hover:shadow-lg hover:scale-105"
                style={{ 
                  borderColor: tech.color + '40',
                  backgroundColor: tech.color + '10',
                  boxShadow: `0 0 15px ${tech.color}10`
                }}
              >
                <div className="flex flex-col items-center">
                  <tech.icon size={32} style={{ color: tech.color }} className="md:w-12 md:h-12" />
                  <div className="mt-2 md:mt-4 text-center">
                    <span className="text-white font-bold text-sm md:text-lg">{tech.name}</span>
                  </div>
                </div>
                
                {/* Holographic effect */}
                <div 
                  className="absolute inset-0 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-15 transition-opacity duration-200"
                  style={{ 
                    background: `linear-gradient(45deg, ${tech.color}20, transparent, ${tech.color}20)` 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reality Pricing Section */}
      <section id="pricing" className="py-16 md:py-32 px-4 md:px-6 relative">
        <div className="text-center mb-12 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black mb-4 md:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-cyan-400 to-purple-400">
            REALITY PRICING
          </h2>
          <p className="text-lg md:text-2xl text-pink-300 max-w-4xl mx-auto font-light tracking-wide px-4">
            INVESTMENT LEVELS FOR DIGITAL TRANSCENDENCE
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative animate-fade-in ${plan.popular ? 'md:scale-110 z-10 transform hover:scale-115 transition-transform duration-300' : ''}`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 right-0 z-20">
                  <span 
                    className="px-3 py-1 rounded-lg text-white font-bold text-xs bg-gradient-to-r from-orange-500 to-red-500 shadow-lg"
                  >
                    MOST TRANSCENDENT
                  </span>
                </div>
              )}
              
              <HolographicCard 
                className={`h-full relative overflow-hidden ${plan.popular ? 'ring-2 ring-offset-2 ring-offset-black' : ''}`} 
                style={plan.popular ? { 
                  boxShadow: `0 0 50px ${plan.color}40, 0 0 0 2px ${plan.color}60`,
                  borderColor: plan.color 
                } : {}}
              >
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{ 
                    background: `linear-gradient(135deg, ${plan.color}40, transparent, ${plan.color}40)` 
                  }}
                />
                
                <div className="relative z-10">
                  <div className="text-center mb-6 md:mb-8">
                    <h3 
                      className="text-2xl md:text-3xl font-black mb-3 md:mb-4"
                      style={{ color: plan.color }}
                    >
                      {plan.name}
                    </h3>
                    <div 
                      className="text-3xl md:text-5xl font-black mb-3 md:mb-4"
                      style={{ color: plan.color }}
                    >
                      {plan.price}
                    </div>
                    <p className="text-cyan-200 text-base md:text-lg font-medium px-2">{plan.description}</p>
                  </div>
                  
                  <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-cyan-100">
                        <IconCheck 
                          size={18} 
                          className="mr-2 md:mr-3 flex-shrink-0 mt-0.5" 
                          style={{ color: plan.color }}
                        />
                        <span className="font-medium text-sm md:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    className={`w-full py-3 md:py-4 px-4 md:px-6 rounded-2xl font-bold text-base md:text-lg transition-all duration-200 flex items-center justify-center hover:scale-105 ${
                      plan.popular 
                        ? 'text-black' 
                        : 'border-2 text-white hover:text-black'
                    }`}
                    style={{ 
                      backgroundColor: plan.popular ? plan.color : 'transparent',
                      borderColor: plan.color,
                      boxShadow: plan.popular ? `0 0 15px ${plan.color}20` : 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = plan.color
                      e.currentTarget.style.color = '#000000'
                      e.currentTarget.style.boxShadow = `0 0 25px ${plan.color}40`
                    }}
                    onMouseLeave={(e) => {
                      if (!plan.popular) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#ffffff'
                        e.currentTarget.style.boxShadow = 'none'
                      } else {
                        e.currentTarget.style.backgroundColor = plan.color
                        e.currentTarget.style.color = '#000000'
                        e.currentTarget.style.boxShadow = `0 0 15px ${plan.color}20`
                      }
                    }}
                  >
                    <span className="hidden sm:inline">INITIATE {plan.name}</span>
                    <span className="sm:hidden">GET {plan.name}</span>
                    <IconArrowRight size={18} className="ml-2" />
                  </button>
                </div>
              </HolographicCard>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Portal */}
      <section className="py-16 md:py-32 px-4 md:px-6 relative bg-gradient-to-b from-black via-cyan-900/10 to-black">
        <div className="text-center mb-12 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black mb-4 md:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400">
            CONTACT PORTAL
          </h2>
          <p className="text-lg md:text-2xl text-cyan-300 max-w-4xl mx-auto font-light tracking-wide px-4">
            ESTABLISH CONNECTION ACROSS DIGITAL DIMENSIONS
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">
          <div className="animate-fade-in">
            <HolographicCard>
              <h3 className="text-3xl font-bold text-cyan-400 mb-8">TRANSMISSION CHANNELS</h3>
              <div className="space-y-8">
                <div className="flex items-center group">
                  <IconMail className="text-cyan-400 mr-6 transition-colors duration-200" size={32} />
                  <div>
                    <p className="text-white font-bold text-xl">Neural Network</p>
                    <p className="text-cyan-200 text-lg">contact@vxpremium.co.uk</p>
                  </div>
                </div>
                <div className="flex items-center group">
                  <IconPhone className="text-purple-400 mr-6 transition-colors duration-200" size={32} />
                  <div>
                    <p className="text-white font-bold text-xl">Quantum Line</p>
                    <p className="text-cyan-200 text-lg">+44 (0) 20 7123 4567</p>
                  </div>
                </div>
                <div className="flex items-center group">
                  <IconMapPin className="text-pink-400 mr-6 transition-colors duration-200" size={32} />
                  <div>
                    <p className="text-white font-bold text-xl">Reality Anchor</p>
                    <p className="text-cyan-200 text-lg">London, United Kingdom</p>
                  </div>
                </div>
              </div>
            </HolographicCard>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <HolographicCard>
              <h3 className="text-3xl font-bold text-cyan-400 mb-8">INITIATE TRANSMISSION</h3>
              <form className="space-y-6">
                <div>
                  <input
                    type="text"
                    placeholder="Your Identity Code"
                    className="w-full px-6 py-4 bg-black/50 border-2 border-cyan-500/30 rounded-2xl text-white placeholder-cyan-300 focus:border-cyan-400 focus:outline-none transition-all duration-200 text-lg"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Neural Link Address"
                    className="w-full px-6 py-4 bg-black/50 border-2 border-cyan-500/30 rounded-2xl text-white placeholder-cyan-300 focus:border-cyan-400 focus:outline-none transition-all duration-200 text-lg"
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Transmission Content"
                    rows={5}
                    className="w-full px-6 py-4 bg-black/50 border-2 border-cyan-500/30 rounded-2xl text-white placeholder-cyan-300 focus:border-cyan-400 focus:outline-none transition-all duration-200 resize-none text-lg"
                  ></textarea>
                </div>
                <button 
                  className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl text-black font-bold text-xl hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
                >
                  TRANSMIT TO REALITY
                  <IconArrowRight size={24} className="ml-3" />
                </button>
              </form>
            </HolographicCard>
          </div>
        </div>
      </section>

      {/* Quantum Footer */}
      <footer className="py-16 px-6 border-t border-cyan-500/20 bg-gradient-to-b from-black to-purple-900/20">
        <div className="container mx-auto text-center">
          <div className="animate-fade-in">
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-6">
              VX PREMIUM
            </div>
            <p className="text-cyan-300 mb-8 text-xl font-light">
              ARCHITECTS OF IMPOSSIBLE REALITIES
            </p>
            <div className="flex justify-center space-x-8 mb-8">
              <a href="#" className="text-cyan-400 hover:text-white transition-colors duration-200 text-lg">Reality Terms</a>
              <a href="#" className="text-cyan-400 hover:text-white transition-colors duration-200 text-lg">Quantum Privacy</a>
              <a href="#" className="text-cyan-400 hover:text-white transition-colors duration-200 text-lg">Neural Support</a>
            </div>
            <p className="text-cyan-500/60 text-lg">
              © 2025 VX PREMIUM. ALL REALITIES RESERVED.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
