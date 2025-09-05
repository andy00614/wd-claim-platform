'use client'

import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TextAnimateProps {
  children: string
  className?: string
  animation?: 'blur' | 'fade' | 'slide'
  delay?: number
}

export function TextAnimate({ 
  children, 
  className, 
  animation = 'fade', 
  delay = 0 
}: TextAnimateProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const variants = {
    blur: {
      hidden: { filter: 'blur(10px)', opacity: 0, y: 20 },
      visible: { 
        filter: 'blur(0px)', 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.8, ease: 'easeOut' }
      }
    },
    fade: {
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.6, ease: 'easeOut' }
      }
    },
    slide: {
      hidden: { x: -20, opacity: 0 },
      visible: { 
        x: 0, 
        opacity: 1,
        transition: { duration: 0.6, ease: 'easeOut' }
      }
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={variants[animation]}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface TypingAnimationProps {
  text: string
  className?: string
  duration?: number
  delay?: number
}

export function TypingAnimation({ 
  text, 
  className, 
  duration = 2000, 
  delay = 0 
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isStarted, setIsStarted] = useState(false)

  useEffect(() => {
    const startTimer = setTimeout(() => setIsStarted(true), delay)
    return () => clearTimeout(startTimer)
  }, [delay])

  useEffect(() => {
    if (!isStarted) return

    let index = 0
    const typingInterval = duration / text.length

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
      }
    }, typingInterval)

    return () => clearInterval(timer)
  }, [text, duration, isStarted])

  return (
    <span className={cn('inline-block', className)}>
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
        className="inline-block w-0.5 h-5 bg-current ml-1"
      />
    </span>
  )
}

interface BlurFadeProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
}

export function BlurFade({ 
  children, 
  className, 
  delay = 0, 
  duration = 0.8 
}: BlurFadeProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <motion.div
      initial={{ filter: 'blur(10px)', opacity: 0, y: 30 }}
      animate={isVisible ? { 
        filter: 'blur(0px)', 
        opacity: 1, 
        y: 0 
      } : {}}
      transition={{ 
        duration, 
        ease: 'easeOut',
        filter: { duration: duration * 0.6 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface RippleButtonProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function RippleButton({ 
  children, 
  className, 
  onClick 
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Array<{id: number, x: number, y: number}>>([])

  const addRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const newRipple = {
      id: Date.now(),
      x,
      y
    }

    setRipples(prev => [...prev, newRipple])

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)

    onClick?.()
  }

  return (
    <motion.button
      className={cn(
        'relative overflow-hidden rounded-md transition-colors',
        className
      )}
      onClick={addRipple}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none"
          initial={{
            width: 0,
            height: 0,
            x: ripple.x,
            y: ripple.y,
            opacity: 1
          }}
          animate={{
            width: 40,
            height: 40,
            x: ripple.x - 20,
            y: ripple.y - 20,
            opacity: 0
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </motion.button>
  )
}

interface DockProps {
  children: React.ReactNode
  className?: string
}

interface DockItemProps {
  children: React.ReactNode
  className?: string
  title?: string
  onClick?: () => void
}

export function Dock({ children, className }: DockProps) {
  return (
    <div className={cn(
      'flex items-center gap-1 p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20',
      className
    )}>
      {children}
    </div>
  )
}

export function DockItem({ children, className, title, onClick }: DockItemProps) {
  return (
    <motion.button
      className={cn(
        'relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
        'hover:bg-white/20 active:bg-white/30',
        className
      )}
      title={title}
      onClick={onClick}
      whileHover={{ 
        scale: 1.1,
        y: -2
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  )
}