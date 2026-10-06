import type { Segment, Tier, IncidentType, IncidentStatus, Jurisdiction, Severity } from './types'

export const SEGMENT_LABEL: Record<Segment, string> = {
  consumer: 'Consumer', enterprise: 'Enterprise', both: 'Consumer & Enterprise',
}
export const TIER_LABEL: Record<Tier, string> = {
  low: 'Low risk', moderate: 'Moderate risk', elevated: 'Elevated risk', high: 'High risk',
}
export const TYPE_LABEL: Record<IncidentType, string> = {
  data_breach: 'Data breach', security_vulnerability: 'Security vulnerability',
  regulatory_fine: 'Regulatory fine', policy_violation: 'Policy violation',
}
export const SEVERITY_LABEL: Record<Severity, string> = {
  low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical',
}
export const STATUS_LABEL: Record<IncidentStatus, string> = {
  reported: 'Reported (unconfirmed)', under_investigation: 'Under investigation', confirmed: 'Confirmed',
  fine_imposed: 'Fine imposed', appealed: 'Appealed', annulled: 'Annulled',
}
export const JURISDICTION_LABEL: Record<Jurisdiction, string> = {
  EU: 'EU/EEA (GDPR)', US: 'United States', CA: 'Canada', UK: 'United Kingdom',
  CN: 'China', SG: 'Singapore', JP: 'Japan', OTHER: 'Other',
}

export const fmtScore = (n: number) => n.toFixed(1)

export function fmtFine(eur: number): string {
  if (eur >= 1_000_000) return `€${(eur / 1_000_000).toFixed(1)} M`
  return `€${Math.round(eur / 1000)} K`
}

export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
export function fmtRelative(iso: string, now = Date.now()): string {
  const s = Math.round((new Date(iso).getTime() - now) / 1000)
  const a = Math.abs(s)
  if (a < 5) return 'just now'
  if (a < 60) return rtf.format(s, 'second')
  if (a < 3600) return rtf.format(Math.round(s / 60), 'minute')
  if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour')
  return rtf.format(Math.round(s / 86400), 'day')
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase()
}
export const MONOGRAM_BG = ['#DCE6FF', '#D8F1EE', '#F1E3FA', '#FCEBD3', '#E2EEDB', '#F7DEDE', '#E0E8EE', '#EDE6D6']
