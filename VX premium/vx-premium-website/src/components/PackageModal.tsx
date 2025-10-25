'use client'

import { useState } from 'react'
import { IconX, IconCheck, IconMail, IconUser, IconPhone } from '@tabler/icons-react'

interface PackageModalProps {
  isOpen: boolean
  onClose: () => void
  packageData: {
    name: string
    price: string
    color: string
    features: string[]
  }
}

export default function PackageModal({ isOpen, onClose, packageData }: PackageModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the form data to your backend
    console.log('Package Selection:', { package: packageData.name, ...formData })
    alert(`Thank you! We'll contact you about the ${packageData.name} package.`)
    onClose()
    setFormData({ name: '', email: '', phone: '', company: '', message: '' })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900/95 via-purple-900/20 to-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-cyan-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                SELECT {packageData.name}
              </h2>
              <p className="text-cyan-300 mt-2">Complete your neural transformation</p>
            </div>
            <button
              onClick={onClose}
              className="text-cyan-400 hover:text-white transition-colors p-2"
            >
              <IconX size={24} />
            </button>
          </div>
        </div>

        {/* Package Summary */}
        <div className="p-6 border-b border-cyan-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold" style={{ color: packageData.color }}>
              {packageData.name}
            </h3>
            <div className="text-3xl font-black" style={{ color: packageData.color }}>
              {packageData.price}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {packageData.features.slice(0, 6).map((feature, index) => (
              <div key={index} className="flex items-center text-sm text-cyan-200">
                <IconCheck size={16} className="text-green-400 mr-2 flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-cyan-300 mb-2 font-semibold">
                <IconUser size={16} className="inline mr-2" />
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-xl text-white placeholder-cyan-300/50 focus:border-cyan-400 focus:outline-none transition-all duration-200"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-cyan-300 mb-2 font-semibold">
                <IconMail size={16} className="inline mr-2" />
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-xl text-white placeholder-cyan-300/50 focus:border-cyan-400 focus:outline-none transition-all duration-200"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-cyan-300 mb-2 font-semibold">
                <IconPhone size={16} className="inline mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-xl text-white placeholder-cyan-300/50 focus:border-cyan-400 focus:outline-none transition-all duration-200"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-cyan-300 mb-2 font-semibold">
                Company/Organization
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-xl text-white placeholder-cyan-300/50 focus:border-cyan-400 focus:outline-none transition-all duration-200"
                placeholder="Your company"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-cyan-300 mb-2 font-semibold">
              Project Details
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-xl text-white placeholder-cyan-300/50 focus:border-cyan-400 focus:outline-none transition-all duration-200 resize-none"
              placeholder="Tell us about your project requirements..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-cyan-500/30 text-cyan-400 rounded-xl font-bold hover:bg-cyan-500/10 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-black rounded-xl font-bold hover:shadow-xl transition-all duration-200"
            >
              Request {packageData.name} Package
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
