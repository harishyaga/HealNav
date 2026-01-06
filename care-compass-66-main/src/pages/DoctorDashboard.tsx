import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, LogOut, RefreshCw, Users, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import type { Patient, PatientStatus, PriorityLevel } from "@/types/patient";
import { cn } from "@/lib/utils";

const priorityOrder = { high: 0, medium: 1, low: 2 };

export default function DoctorDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/doctor");
        return;
      }
      setUser(session.user);
      fetchPatients();
    });

    // Subscribe to realtime updates
    const channel = supabase
      .channel("patients-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patients" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newPatient = payload.new as Patient;
            setPatients((prev) => {
              const updated = [...prev, newPatient];
              return updated.sort((a, b) => {
                const priorityDiff = priorityOrder[a.ai_priority || "low"] - priorityOrder[b.ai_priority || "low"];
                if (priorityDiff !== 0) return priorityDiff;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              });
            });
            // Alert for high priority
            if (newPatient.ai_priority === "high") {
              toast({
                title: "🚨 High Priority Patient",
                description: `Token ${newPatient.token_number} - ${newPatient.ai_priority?.toUpperCase()} priority requires immediate attention!`,
                variant: "destructive",
              });
            }
          } else if (payload.eventType === "UPDATE") {
            setPatients((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as Patient) : p))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, toast]);

  const fetchPatients = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Sort by priority (high first) then by time
      const sorted = (data as Patient[]).sort((a, b) => {
        const priorityDiff = priorityOrder[a.ai_priority || "low"] - priorityOrder[b.ai_priority || "low"];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setPatients(sorted);
    }
    setIsLoading(false);
  };

  const updatePatientStatus = async (patientId: string, status: PatientStatus) => {
    const { error } = await supabase
      .from("patients")
      .update({ status })
      .eq("id", patientId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/doctor");
  };

  const getPriorityBadge = (priority: PriorityLevel | null) => {
    const config = {
      high: { className: "bg-priority-high text-priority-high-foreground", icon: AlertTriangle },
      medium: { className: "bg-priority-medium text-priority-medium-foreground", icon: Clock },
      low: { className: "bg-priority-low text-priority-low-foreground", icon: CheckCircle },
    };
    const c = config[priority || "low"];
    const Icon = c.icon;
    return (
      <Badge className={cn("gap-1", c.className)}>
        <Icon className="h-3 w-3" />
        {(priority || "low").toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: PatientStatus) => {
    const config = {
      waiting: "bg-secondary text-secondary-foreground",
      in_progress: "bg-primary text-primary-foreground",
      completed: "bg-success text-success-foreground",
    };
    return <Badge variant="outline" className={config[status]}>{status.replace("_", " ").toUpperCase()}</Badge>;
  };

  const stats = {
    total: patients.length,
    high: patients.filter((p) => p.ai_priority === "high").length,
    waiting: patients.filter((p) => p.status === "waiting").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                <Activity className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">HealNav Dashboard</h1>
                <p className="text-sm text-primary-foreground/90">
                  Welcome, {user?.email}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={fetchPatients} className="gap-2 shadow-md hover:shadow-lg transition-shadow">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button variant="secondary" size="sm" onClick={handleLogout} className="gap-2 shadow-md hover:shadow-lg transition-shadow">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-muted border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium">{stats.total}</span> Total Patients
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="font-medium text-destructive">{stats.high}</span> High Priority
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{stats.waiting}</span> Waiting
            </div>
          </div>
        </div>
      </div>

      {/* Patient Queue */}
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patient Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading patients...</div>
            ) : patients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No patients in queue</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Token</th>
                      <th className="px-4 py-3 text-left font-medium">Priority</th>
                      <th className="px-4 py-3 text-left font-medium">Patient Info</th>
                      <th className="px-4 py-3 text-left font-medium">Symptoms</th>
                      <th className="px-4 py-3 text-left font-medium">Condition</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient) => (
                      <tr
                        key={patient.id}
                        className={cn(
                          "border-b hover:bg-muted/30 transition-colors",
                          patient.ai_priority === "high" && patient.status === "waiting" && "bg-red-50 dark:bg-red-950/20"
                        )}
                      >
                        <td className="px-4 py-3 font-mono font-bold">{patient.token_number}</td>
                        <td className="px-4 py-3">{getPriorityBadge(patient.ai_priority)}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <span className="font-medium">{patient.age}y {patient.gender}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 text-xs">
                            {patient.chest_pain && <Badge variant="outline" className="text-destructive border-destructive">Chest Pain</Badge>}
                            {patient.breathlessness && <Badge variant="outline">Breathless</Badge>}
                            {patient.fever && <Badge variant="outline">Fever</Badge>}
                            <Badge variant="secondary">{patient.pain_level} pain</Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {patient.existing_disease && patient.existing_disease !== "None" ? patient.existing_disease : "-"}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(patient.status)}</td>
                        <td className="px-4 py-3">
                          <Select
                            value={patient.status}
                            onValueChange={(value) => updatePatientStatus(patient.id, value as PatientStatus)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="waiting">Waiting</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
