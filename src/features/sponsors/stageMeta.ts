import { pt } from '@/i18n/pt'
import type { SponsorStage } from '@/types/database'

export interface StageMeta {
  stage: SponsorStage
  label: string
  color: string
}

export const SPONSOR_STAGES: StageMeta[] = [
  { stage: 'lead', label: pt.sponsorStages.lead, color: '#64748b' },
  { stage: 'contactado', label: pt.sponsorStages.contactado, color: '#2563eb' },
  { stage: 'reuniao', label: pt.sponsorStages.reuniao, color: '#7c3aed' },
  { stage: 'proposta', label: pt.sponsorStages.proposta, color: '#d97706' },
  { stage: 'fechado', label: pt.sponsorStages.fechado, color: '#059669' },
  { stage: 'perdido', label: pt.sponsorStages.perdido, color: '#e11d48' },
]

export const stageMetaOf = (stage: SponsorStage): StageMeta =>
  SPONSOR_STAGES.find((s) => s.stage === stage) ?? SPONSOR_STAGES[0]
