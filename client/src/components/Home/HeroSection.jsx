// File: client/src/components/Home/HeroSection.jsx
import { ArrowRight } from 'lucide-react'
import React, { useState } from 'react'

export default function HeroSection() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className='min-h-screen bg-black'>
      {/* Navigation */}
      <nav className='flex items-center justify-between px-8 py-6 border-b border-gray-900'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600'></div>
          <span className='font-semibold text-white'>Studio</span>
        </div>
        <div className='flex items-center gap-8'>
          <a
            href='#'
            className='text-sm text-gray-400 hover:text-white transition-colors'
          >
            Features
          </a>
          <a
            href='#'
            className='text-sm text-gray-400 hover:text-white transition-colors'
          >
            Pricing
          </a>
          <a
            href='#'
            className='text-sm text-gray-400 hover:text-white transition-colors'
          >
            Docs
          </a>
        </div>
        <button className='px-4 py-2 text-sm font-medium text-black rounded-lg bg-gradient-to-r from-yellow-400 to-amber-600 hover:shadow-lg hover:shadow-yellow-400/30 transition-all duration-300'>
          Get Started
        </button>
      </nav>

      {/* Hero Section */}
      <section className='flex flex-col items-center justify-center px-8 py-32 max-w-5xl mx-auto'>
        {/* Badge */}
        <div className='mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-800 bg-gray-950 hover:border-gray-700 transition-colors'>
          <div className='w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-600'></div>
          <span className='text-xs font-medium text-gray-300'>
            Now Available
          </span>
        </div>

        {/* Headline */}
        <h1 className='text-center text-6xl font-bold leading-tight text-white mb-6'>
          Beautiful design,
          <br />
          <span className='bg-gradient-to-r from-yellow-400 via-amber-500 to-amber-700 bg-clip-text text-transparent'>
            zero friction
          </span>
        </h1>

        {/* Subheading */}
        <p className='text-center text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed'>
          Craft stunning digital experiences with our minimalist framework.
          Built for developers who care about details.
        </p>

        {/* CTA Buttons */}
        <div className='flex items-center gap-4 mb-16'>
          <button
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className='group inline-flex items-center gap-2 px-6 py-3 font-medium text-black rounded-lg bg-gradient-to-r from-yellow-400 to-amber-600 hover:shadow-xl hover:shadow-yellow-400/40 transition-all duration-300 hover:scale-105'
          >
            Start Building
            <ArrowRight
              className={`w-4 h-4 transition-transform duration-300 ${
                isHovered ? 'translate-x-1' : ''
              }`}
            />
          </button>
          <button className='px-6 py-3 font-medium text-white rounded-lg border border-gray-800 hover:border-gray-700 hover:bg-gray-950 transition-colors duration-300'>
            View Docs
          </button>
        </div>

        {/* Features Grid Preview */}
        <div className='grid grid-cols-3 gap-8 w-full mt-20 pt-20 border-t border-gray-900'>
          {[
            { label: 'Performance', value: '99.9%' },
            { label: 'Accessibility', value: 'WCAG 2.1' },
            { label: 'Support', value: '24/7' },
          ].map((feature, i) => (
            <div
              key={i}
              className='group p-6 rounded-lg border border-gray-900 hover:border-yellow-500/30 hover:bg-gradient-to-br hover:from-yellow-950/20 to-transparent transition-all duration-300'
            >
              <p className='text-sm text-gray-500 mb-2'>{feature.label}</p>
              <p className='text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent'>
                {feature.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Elements */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
