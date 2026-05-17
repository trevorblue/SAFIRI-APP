import { useEffect, useRef } from 'react'
import { useMotionValue, useTransform, animate, motion } from 'framer-motion'

export default function AnimatedNumber({ value, prefix = '', className = '' }) {
  const mv = useMotionValue(0)
  const prev = useRef(0)

  const display = useTransform(mv, v =>
    `${prefix}${Math.round(v).toLocaleString('en-KE')}`
  )

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
    })
    prev.current = value
    return controls.stop
  }, [value, mv])

  return <motion.span className={className}>{display}</motion.span>
}
