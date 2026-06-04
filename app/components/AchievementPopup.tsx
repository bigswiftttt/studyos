'use client'

import { useEffect, useState } from 'react'
import { useAchievements } from '../hooks/useAchievements'

const RARITY_CONFIG = {
    common: { label: 'COMMON', color: '#8a8a7a', glow: 'rgba(138,138,122,0.15)' },
    rare: { label: 'RARE', color: '#60a5fa', glow: 'rgba(96,165,250,0.15)' },
    epic: { label: 'EPIC', color: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
    legendary: { label: 'LEGENDARY', color: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
    secret: { label: 'SECRET', color: '#f472b6', glow: 'rgba(244,114,182,0.15)' },
}

export default function AchievementPopup() {
    const { newUnlocks, dismissFirst } = useAchievements()
    const [visible, setVisible] = useState(false)
    const [animateOut, setAnimateOut] = useState(false)

    const current = newUnlocks[0]

    useEffect(() => {
        if (current) {
            setAnimateOut(false)
            setVisible(true)

            const timer = setTimeout(() => {
                handleDismiss()
            }, 4500)

            return () => clearTimeout(timer)
        }
    }, [current?.id])

    const handleDismiss = () => {
        setAnimateOut(true)
        setTimeout(() => {
            setVisible(false)
            dismissFirst()
        }, 400)
    }

    if (!visible || !current) return null

    const rarity = RARITY_CONFIG[current.rarity]

    return (
        <div
            onClick={handleDismiss}
            style={{
                position: 'fixed',
                bottom: '1.75rem',
                right: '1.75rem',
                zIndex: 9999,
                cursor: 'pointer',
                animation: animateOut
                    ? 'slideOut 0.4s ease forwards'
                    : 'slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
        >
            <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes slideOut {
          from { opacity: 1; transform: translateY(0)    scale(1); }
          to   { opacity: 0; transform: translateY(12px) scale(0.97); }
        }
        @keyframes shimmer {
          0%   { opacity: 0.4; }
          50%  { opacity: 1; }
          100% { opacity: 0.4; }
        }
        @keyframes timerBar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

            <div style={{
                background: '#111110',
                border: `1px solid ${rarity.color}50`,
                borderRadius: '16px',
                padding: '1rem 1.25rem',
                minWidth: '280px',
                maxWidth: '320px',
                boxShadow: `0 0 0 1px ${rarity.color}20, 0 16px 40px rgba(0,0,0,0.6), 0 0 60px ${rarity.glow}`,
                position: 'relative',
                overflow: 'hidden',
            }}>

                {/* Top glow strip */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: `linear-gradient(90deg, transparent, ${rarity.color}, transparent)`,
                    animation: 'shimmer 2s ease infinite',
                }} />

                {/* Queue indicator */}
                {newUnlocks.length > 1 && (
                    <div style={{
                        position: 'absolute', top: '0.65rem', right: '0.65rem',
                        background: rarity.color + '20', border: `1px solid ${rarity.color}40`,
                        borderRadius: '999px', padding: '0.1rem 0.45rem',
                        fontSize: '0.6rem', fontFamily: 'monospace', color: rarity.color, fontWeight: 700,
                    }}>
                        +{newUnlocks.length - 1} more
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    {/* Icon */}
                    <div style={{
                        fontSize: '2rem', lineHeight: 1, flexShrink: 0,
                        filter: `drop-shadow(0 0 8px ${rarity.color}60)`,
                    }}>
                        {current.icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontSize: '0.6rem', fontFamily: 'monospace', letterSpacing: '0.1em',
                            color: rarity.color, fontWeight: 700, marginBottom: '0.2rem',
                            textTransform: 'uppercase',
                        }}>
                            🏅 Achievement Unlocked · {rarity.label}
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f5f5f0', marginBottom: '0.2rem' }}>
                            {current.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#8a8a7a', lineHeight: 1.4 }}>
                            {current.description}
                        </div>
                    </div>
                </div>

                {/* Progress bar (auto-dismiss timer) */}
                <div style={{ marginTop: '0.9rem', height: '2px', background: '#1f1f18', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', borderRadius: '999px',
                        background: rarity.color,
                        animation: 'timerBar 4.5s linear forwards',
                    }} />
                </div>

            </div>
        </div>
    )
}
