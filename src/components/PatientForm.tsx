import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Heart, Activity, Thermometer, Stethoscope } from "lucide-react";
import type { PatientFormData } from "@/types/patient";

const formSchema = z.object({
  age: z.coerce.number().min(0, "Age must be positive").max(150, "Invalid age"),
  gender: z.string().min(1, "Please select gender"),
  chest_pain: z.boolean(),
  breathlessness: z.boolean(),
  fever: z.boolean(),
  pain_level: z.enum(["mild", "moderate", "severe"]),
  symptom_duration_days: z.coerce.number().min(0, "Must be positive").max(365, "Max 365 days"),
  severity_level: z.enum(["low", "medium", "high", "critical"]),
  existing_disease: z.string().nullable(),
});

interface PatientFormProps {
  onSubmit: (data: PatientFormData) => Promise<void>;
  isLoading: boolean;
}

export function PatientForm({ onSubmit, isLoading }: PatientFormProps) {
  const form = useForm<PatientFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: 30,
      gender: "",
      chest_pain: false,
      breathlessness: false,
      fever: false,
      pain_level: "mild",
      symptom_duration_days: 1,
      severity_level: "low",
      existing_disease: null,
    },
  });

  const handleSubmit = async (data: PatientFormData) => {
    await onSubmit(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-primary/20">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Patient Symptom Form</CardTitle>
            <CardDescription>Enter your symptoms for AI-powered triage assessment</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age (years)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter age" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Symptoms Toggles */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Current Symptoms
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="chest_pain"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border bg-card p-4">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-destructive" />
                        <FormLabel className="cursor-pointer mb-0">Chest Pain</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="breathlessness"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border bg-card p-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <FormLabel className="cursor-pointer mb-0">Breathlessness</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fever"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border bg-card p-4">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-warning" />
                        <FormLabel className="cursor-pointer mb-0">Fever</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Severity Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pain_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pain Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mild">😊 Mild</SelectItem>
                        <SelectItem value="moderate">😐 Moderate</SelectItem>
                        <SelectItem value="severe">😣 Severe</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="symptom_duration_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symptom Duration (days)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="severity_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Self-Reported Severity</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low - Minor discomfort</SelectItem>
                        <SelectItem value="medium">Medium - Noticeable issue</SelectItem>
                        <SelectItem value="high">High - Significant concern</SelectItem>
                        <SelectItem value="critical">Critical - Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="existing_disease"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Existing Condition</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select if any" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="Diabetes">Diabetes</SelectItem>
                        <SelectItem value="Hypertension">Hypertension</SelectItem>
                        <SelectItem value="Heart Disease">Heart Disease</SelectItem>
                        <SelectItem value="Asthma">Asthma</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing Symptoms...
                </>
              ) : (
                <>
                  <Stethoscope className="mr-2 h-5 w-5" />
                  Get Priority Assessment
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              ⚠️ This AI assessment assists medical staff and does not replace professional medical judgment.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
