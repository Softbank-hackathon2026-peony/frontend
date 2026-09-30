import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const CloudIcon = (p: P) => (
  <svg viewBox="0 0 44 44" aria-hidden="true" {...p}><path {...stroke} d="M13 33h19a8 8 0 0 0 1-15.9A10 10 0 0 0 14 19a7 7 0 0 0-1 14z" /></svg>
)
export const ClockIcon = (p: P) => (
  <svg viewBox="0 0 44 44" aria-hidden="true" {...p}><circle cx="22" cy="22" r="15" {...stroke} /><path {...stroke} d="M22 12v10l7 4" /></svg>
)
export const ChipIcon = (p: P) => (
  <svg viewBox="0 0 44 44" aria-hidden="true" {...p}>
    <rect x="11" y="11" width="22" height="22" rx="4" {...stroke} />
    <rect x="18" y="18" width="8" height="8" rx="1.5" fill="currentColor" />
    <path {...stroke} d="M16 5v6M22 5v6M28 5v6M16 33v6M22 33v6M28 33v6M5 16h6M5 22h6M5 28h6M33 16h6M33 22h6M33 28h6" />
  </svg>
)
export const BoxIcon = (p: P) => (
  <svg viewBox="0 0 44 44" aria-hidden="true" {...p}><path {...stroke} d="M8 15l14-7 14 7v16l-14 7-14-7zM8 15l14 7 14-7M22 22v16" /></svg>
)
export const FileIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}><path fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round" d="M6 3h8l4 4v14H6zM14 3v4h4" /></svg>
)
export const CheckIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}><path fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5 9-10" /></svg>
)
export const ArrowDownIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}><g fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v13" /><path d="m6 11 6 6 6-6" /><path d="M5 20h14" /></g></svg>
)
export const PawIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <g fill="currentColor">
      <ellipse cx="7" cy="7" rx="2.3" ry="3" /><ellipse cx="12" cy="5" rx="2.3" ry="3" /><ellipse cx="17" cy="7" rx="2.3" ry="3" />
      <ellipse cx="4.5" cy="12.5" rx="2" ry="2.6" /><ellipse cx="19.5" cy="12.5" rx="2" ry="2.6" />
      <path d="M12 10c-3.6 0-6.5 3.2-6.5 6.2 0 2 1.4 3.3 3.1 3.3 1.2 0 2.1-.6 3.4-.6s2.2.6 3.4.6c1.7 0 3.1-1.3 3.1-3.3C18.5 13.2 15.6 10 12 10z" />
    </g>
  </svg>
)
