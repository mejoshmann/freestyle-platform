export interface Coach {
  id: string
  email: string
  full_name: string
  is_admin?: boolean
  created_at: string
}

export interface Athlete {
  id: string
  full_name: string
  email?: string
  date_of_birth?: string
  group_name?: string
  day?: string
  mountain?: string
  coach_name?: string
  metadata?: {
    first_name?: string
    last_name?: string
    sex?: string
    age?: string
    category?: string
    phone?: string
    phone2?: string
    allergies?: string
    medical_conditions?: string
    parent_email?: string
    parent_name?: string
    group?: string
    attendance?: Record<string, 'present' | 'absent' | 'future'>
  }
  created_at: string
}

export interface Skill {
  id: string
  name: string
  description?: string
}

export interface TemplateCategory {
  id: string
  name: string
  skills: Skill[]
}

export interface EvaluationTemplate {
  id: string
  coach_id: string
  name: string
  description?: string
  skills: Skill[]
  categories?: TemplateCategory[]
  created_at: string
}

export interface Evaluation {
  id: string
  athlete_id: string
  coach_id: string
  template_id?: string
  skill_scores: SkillScore[]
  notes?: string
  voice_notes?: string[]
  evaluated_at: string
}

export interface SkillScore {
  skill_id: string
  skill_name: string
  score: number | null  // null = not evaluated/skipped
}
