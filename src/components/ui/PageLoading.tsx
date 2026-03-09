import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoadingProps {
  variant?: "default" | "dashboard" | "form" | "list";
  className?: string;
}

export function PageLoading({ variant = "default", className }: PageLoadingProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Nav placeholder */}
      <div className="h-16 border-b border-border/30 bg-background/70 backdrop-blur-xl flex items-center px-4 sm:px-6">
        <Skeleton className="h-8 w-32" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {variant === "dashboard" && <DashboardSkeleton />}
        {variant === "form" && <FormSkeleton />}
        {variant === "list" && <ListSkeleton />}
        {variant === "default" && <DefaultSkeleton />}
      </div>
    </div>
  );
}

function DefaultSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative">
        <Shield className="h-12 w-12 text-primary/30" />
        <Loader2 className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
      </div>
      <Skeleton className="h-4 w-48" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}