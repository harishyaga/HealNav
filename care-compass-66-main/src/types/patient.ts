export type PriorityLevel = "low" | "medium" | "high";
export type PainLevel = "mild" | "moderate" | "severe";
export type SeverityLevel = "low" | "medium" | "high" | "critical";
export type PatientStatus = "waiting" | "in_progress" | "completed";

export interface PatientFormData {
  age: number;
  gender: string;
  chest_pain: boolean;
  breathlessness: boolean;
  fever: boolean;
  pain_level: PainLevel;
  symptom_duration_days: number;
  severity_level: SeverityLevel;
  existing_disease: string | null;
}

export interface Patient {
  id: string;
  age: number;
  gender: string;
  chest_pain: boolean;
  breathlessness: boolean;
  fever: boolean;
  pain_level: PainLevel;
  symptom_duration_days: number;
  self_reported_severity: SeverityLevel;
  existing_disease: string | null;
  token_number: string;
  ai_priority: PriorityLevel | null;
  status: PatientStatus;
  created_at: string;
  updated_at: string;
}

export interface PredictionResult {
  priority: PriorityLevel;
  message: string;
  action: string;
  token_number: string;
}
