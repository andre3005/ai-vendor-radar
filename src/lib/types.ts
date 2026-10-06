export type Segment = 'consumer' | 'enterprise' | 'both'
export type Tier = 'low' | 'moderate' | 'elevated' | 'high'
export type IncidentType = 'data_breach' | 'security_vulnerability' | 'regulatory_fine' | 'policy_violation'
export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type IncidentStatus = 'reported' | 'under_investigation' | 'confirmed' | 'fine_imposed' | 'appealed' | 'annulled'
export type Jurisdiction = 'EU' | 'US' | 'CA' | 'UK' | 'CN' | 'SG' | 'JP' | 'OTHER'
export type Purpose = 'training' | 'inference' | 'storage' | 'backup'

export interface Provider {
  id: number; name: string; tagline: string | null; hq_city: string; hq_country: string
  founded_year: number | null; flagship_model: string | null; segment: Segment
}
export interface ProviderRanking extends Provider {
  base_score: number; penalty: number; total_score: number; risk_tier: Tier
  incident_count: number; open_incident_count: number; last_incident_on: string | null
  rank: number; data_center_count: number; jurisdictions: string | null
}
export interface Criterion { id: number; name: string; description: string; weight: number; sort_order: number }
export interface Rating { provider_id: number; criterion_id: number; score: number; note: string | null }
export interface Incident {
  id: number; provider_id: number; title: string; description: string | null
  incident_type: IncidentType; severity: Severity; status: IncidentStatus; occurred_on: string
  fine_amount_eur: number | null; authority: string | null; provider?: { id: number; name: string }
}
export interface DataCenter {
  id: number; provider_id: number; city: string; country: string; jurisdiction: Jurisdiction
  purpose: Purpose; latitude: number; longitude: number; provider?: { id: number; name: string }
}
export interface ActivityLog {
  id: number; occurred_at: string; entity: string; action: string; provider_name: string | null; message: string
}
