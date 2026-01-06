import { useState } from "react";
import { Link } from "react-router-dom";
import { PatientForm } from "@/components/PatientForm";
import { PriorityResult } from "@/components/PriorityResult";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Activity, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PatientFormData, PredictionResult } from "@/types/patient";

export default function PatientIntake() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (data: PatientFormData) => {
    setIsLoading(true);
    try {
      const { data: response, error } = await supabase.functions.invoke("predict-priority", {
        body: data,
      });

      if (error) throw error;

      setResult(response as PredictionResult);
      toast({
        title: "Assessment Complete",
        description: `Priority: ${response.priority.toUpperCase()} - Token: ${response.token_number}`,
      });
    } catch (error: any) {
      console.error("Prediction error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get prediction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-xl">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                <Activity className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">HealNav</h1>
                <p className="text-sm text-primary-foreground/90">Smart Care Patient Priority System</p>
              </div>
            </div>
            <Link to="/doctor">
              <Button variant="secondary" size="sm" className="gap-2 shadow-md hover:shadow-lg transition-shadow">
                <UserCog className="h-4 w-4" />
                Doctor Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {result ? (
          <PriorityResult result={result} onReset={handleReset} />
        ) : (
          <PatientForm onSubmit={handleSubmit} isLoading={isLoading} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-muted to-muted/80 border-t mt-auto">
        <div className="container mx-auto px-4 py-5 text-center text-sm text-muted-foreground">
          <p className="font-medium">© 2026 HealNav - Smart Care Patient Priority System</p>
          <p className="text-xs mt-1.5 opacity-80">AI-Powered Triage • Faster Care • Better Outcomes</p>
        </div>
      </footer>
    </div>
  );
}
