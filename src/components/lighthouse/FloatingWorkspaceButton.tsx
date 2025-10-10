import { Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/hooks/useWorkspace';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function FloatingWorkspaceButton() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspaceId, loading } = useWorkspace();

  if (!user || !workspaceId || loading) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => navigate(`/lighthouse/${workspaceId}`)}
            size="lg"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-[hsl(var(--lighthouse-beam))] hover:bg-[hsl(var(--lighthouse-signal))] hover:scale-110 transition-all duration-300 z-50 group"
            aria-label="Go to My Workspace"
          >
            <Briefcase className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Go to My Workspace</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
