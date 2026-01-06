import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Server-side validation schema
const patientSchema = z.object({
  age: z.number()
    .int("Age must be an integer")
    .min(0, "Age cannot be negative")
    .max(150, "Age must be realistic"),
  
  gender: z.string()
    .min(1, "Gender is required")
    .max(20, "Gender too long")
    .regex(/^[a-zA-Z\s]+$/, "Invalid gender format"),
  
  chest_pain: z.boolean(),
  breathlessness: z.boolean(),
  fever: z.boolean(),
  
  pain_level: z.enum(["mild", "moderate", "severe"], {
    errorMap: () => ({ message: "Invalid pain level" })
  }),
  
  symptom_duration_days: z.number()
    .int()
    .min(0, "Duration cannot be negative")
    .max(365, "Duration exceeds maximum"),
  
  severity_level: z.enum(["low", "medium", "high", "critical"], {
    errorMap: () => ({ message: "Invalid severity level" })
  }),
  
  existing_disease: z.string()
    .max(100, "Disease name too long")
    .nullable()
    .transform(val => val?.trim() || null),
});

type PatientInput = z.infer<typeof patientSchema>;

// Safe error response mapping
function mapErrorToSafeResponse(error: unknown): { message: string; status: number } {
  // Log detailed error server-side for debugging
  console.error("Detailed error:", error);
  
  if (error instanceof z.ZodError) {
    return {
      message: "Invalid input data provided. Please check your submission.",
      status: 400,
    };
  }
  
  if (error && typeof error === "object" && "code" in error) {
    const pgError = error as { code: string };
    
    switch (pgError.code) {
      case "23505":
        return {
          message: "A record with this information already exists",
          status: 409,
        };
      case "23503":
        return {
          message: "Referenced record not found",
          status: 400,
        };
      default:
        return {
          message: "Unable to save patient information. Please try again.",
          status: 500,
        };
    }
  }
  
  return {
    message: "An error occurred while processing your request",
    status: 500,
  };
}

// ML Model logic based on the trained Random Forest model features
function predictPriority(data: PatientInput): "low" | "medium" | "high" {
  let score = 0;
  
  // Age factor (elderly patients get higher priority)
  if (data.age >= 70) score += 25;
  else if (data.age >= 50) score += 15;
  else if (data.age >= 30) score += 5;
  
  // Critical symptoms (chest pain and breathlessness are high indicators)
  if (data.chest_pain) score += 30;
  if (data.breathlessness) score += 25;
  if (data.fever) score += 10;
  
  // Pain level
  if (data.pain_level === "severe") score += 25;
  else if (data.pain_level === "moderate") score += 15;
  else score += 5;
  
  // Self-reported severity
  if (data.severity_level === "critical") score += 35;
  else if (data.severity_level === "high") score += 25;
  else if (data.severity_level === "medium") score += 15;
  else score += 5;
  
  // Existing conditions increase risk
  if (data.existing_disease && data.existing_disease !== "None") {
    if (data.existing_disease === "Heart Disease") score += 20;
    else if (data.existing_disease === "Diabetes") score += 15;
    else if (data.existing_disease === "Hypertension") score += 15;
    else if (data.existing_disease === "Asthma") score += 10;
    else score += 5;
  }
  
  // Symptom duration (acute symptoms may need faster attention)
  if (data.symptom_duration_days <= 1) score += 10;
  else if (data.symptom_duration_days <= 3) score += 5;
  
  // Determine priority based on score
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function getActionMessage(priority: "low" | "medium" | "high"): string {
  switch (priority) {
    case "high":
      return "Proceed to Emergency Ward immediately";
    case "medium":
      return "Consult a doctor today";
    case "low":
      return "OPD visit can be scheduled later";
  }
}

function getNotificationMessage(priority: "low" | "medium" | "high", tokenNumber: string): string {
  const priorityText = priority.toUpperCase();
  const action = getActionMessage(priority);
  
  return `Dear Patient,

Your condition has been assessed as ${priorityText} priority.

Token Number: ${tokenNumber}

${action}.

Thank you for using HealNav.

– HealNav - Smart Care Patient Priority System`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse and validate input with Zod
    const rawData = await req.json();
    const validationResult = patientSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.error("Validation errors:", validationResult.error.flatten());
      return new Response(
        JSON.stringify({ 
          error: "Invalid input data. Please check your submission and try again."
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    const patientData = validationResult.data;
    
    // Predict priority using our ML-inspired algorithm
    const priority = predictPriority(patientData);
    
    // Generate token number
    const { data: tokenData, error: tokenError } = await supabase
      .rpc("generate_token_number");
    
    if (tokenError) throw tokenError;
    
    const tokenNumber = tokenData as string;
    
    // Save patient to database
    const { data: patient, error: insertError } = await supabase
      .from("patients")
      .insert({
        age: patientData.age,
        gender: patientData.gender,
        chest_pain: patientData.chest_pain,
        breathlessness: patientData.breathlessness,
        fever: patientData.fever,
        pain_level: patientData.pain_level,
        symptom_duration_days: patientData.symptom_duration_days,
        self_reported_severity: patientData.severity_level,
        existing_disease: patientData.existing_disease,
        token_number: tokenNumber,
        ai_priority: priority,
        status: "waiting",
      })
      .select()
      .single();
    
    if (insertError) throw insertError;
    
    const response = {
      priority,
      action: getActionMessage(priority),
      message: getNotificationMessage(priority, tokenNumber),
      token_number: tokenNumber,
      patient_id: patient.id,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorResponse = mapErrorToSafeResponse(error);
    
    return new Response(
      JSON.stringify({ error: errorResponse.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: errorResponse.status,
      }
    );
  }
});
