import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CheckCircle, ArrowLeft, Ticket } from "lucide-react";
import type { PredictionResult } from "@/types/patient";
import { cn } from "@/lib/utils";

interface PriorityResultProps {
  result: PredictionResult;
  onReset: () => void;
}

const priorityConfig = {
  high: {
    icon: AlertTriangle,
    title: "HIGH PRIORITY",
    bgClass: "bg-priority-high",
    textClass: "text-priority-high-foreground",
    borderClass: "border-priority-high",
    cardBg: "bg-red-50 dark:bg-red-950/30",
  },
  medium: {
    icon: Clock,
    title: "MEDIUM PRIORITY",
    bgClass: "bg-priority-medium",
    textClass: "text-priority-medium-foreground",
    borderClass: "border-priority-medium",
    cardBg: "bg-yellow-50 dark:bg-yellow-950/30",
  },
  low: {
    icon: CheckCircle,
    title: "LOW PRIORITY",
    bgClass: "bg-priority-low",
    textClass: "text-priority-low-foreground",
    borderClass: "border-priority-low",
    cardBg: "bg-green-50 dark:bg-green-950/30",
  },
};

export function PriorityResult({ result, onReset }: PriorityResultProps) {
  const config = priorityConfig[result.priority];
  const Icon = config.icon;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Priority Card */}
      <Card className={cn("shadow-xl border-2 overflow-hidden", config.borderClass, config.cardBg)}>
        <CardHeader className={cn("text-center py-8", config.bgClass)}>
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-white/20 backdrop-blur">
              <Icon className={cn("h-12 w-12", config.textClass)} />
            </div>
            <CardTitle className={cn("text-3xl font-bold tracking-wide", config.textClass)}>
              {config.title}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-8 px-6">
          <div className="text-center space-y-4">
            <p className="text-2xl font-semibold text-foreground">
              {result.action}
            </p>
            
            {/* Token Number */}
            <div className="flex items-center justify-center gap-2 py-4">
              <Ticket className="h-6 w-6 text-primary" />
              <span className="text-lg text-muted-foreground">Your Token:</span>
              <span className="text-2xl font-bold text-primary">{result.token_number}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Message Card */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            📱 Patient Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
            <p className="whitespace-pre-line text-foreground leading-relaxed">
              {result.message}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            * This notification has been sent to your registered contact
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={onReset} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Submit New Assessment
        </Button>
      </div>

    </div>
  );
}
