import { useState } from 'react';
import { Shield, TrendingUp, BarChart3, UserPlus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VerificationUpload } from '@/components/verification-upload';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface QuickActionsMenuProps {
  hotClaimsCount?: number;
  trustScore?: number;
  onQuickVerify?: (data: any) => void;
}

export const QuickActionsMenu = ({ 
  hotClaimsCount = 0, 
  trustScore,
  onQuickVerify 
}: QuickActionsMenuProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showQuickVerify, setShowQuickVerify] = useState(false);

  const actions = [
    {
      icon: <Shield className="h-4 w-4" />,
      label: 'Quick Verify',
      description: 'Verify any claim instantly',
      onClick: () => setShowQuickVerify(true),
      primary: true,
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: 'Hot Claims',
      description: 'Trending news to verify',
      badge: hotClaimsCount > 0 ? hotClaimsCount : undefined,
      onClick: () => navigate('/viral-claims'),
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      label: 'My Stats',
      description: trustScore ? `Trust Score: ${trustScore.toFixed(1)}` : 'View your dashboard',
      onClick: () => navigate('/dashboard'),
    },
    {
      icon: <UserPlus className="h-4 w-4" />,
      label: 'Invite Friends',
      description: 'Share & earn rewards',
      onClick: () => navigate('/referrals'),
    },
  ];

  const handleVerificationStart = (data: any) => {
    if (onQuickVerify) {
      onQuickVerify(data);
    }
    setShowQuickVerify(false);
    navigate('/verify');
  };

  // Mobile: Floating Action Button
  if (isMobile) {
    return (
      <>
        <motion.div
          className="fixed bottom-20 right-4 z-50"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <Sheet>
            <SheetTrigger asChild>
              <Button
                size="lg"
                className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                <Zap className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-xl">Quick Actions</SheetTitle>
              </SheetHeader>
              <div className="space-y-3">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className="w-full p-4 rounded-xl border bg-card hover:bg-accent transition-colors text-left flex items-center gap-4"
                    style={{ minHeight: '44px' }} // Thumb-friendly
                  >
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                      action.primary ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                    }`}>
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{action.label}</span>
                        {action.badge && (
                          <Badge variant="secondary" className="rounded-full">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {action.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </motion.div>

        {/* Quick Verify Modal */}
        <Sheet open={showQuickVerify} onOpenChange={setShowQuickVerify}>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-xl flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Quick Verify
              </SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto h-full pb-20">
              <VerificationUpload onVerificationStart={handleVerificationStart} />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: Dropdown Menu
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Zap className="h-4 w-4" />
            Quick Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {actions.map((action, index) => (
            <DropdownMenuItem
              key={index}
              onClick={action.onClick}
              className="cursor-pointer py-3"
            >
              <div className="flex items-center gap-3 w-full">
                <div className={`flex-shrink-0 ${action.primary ? 'text-primary' : ''}`}>
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{action.label}</span>
                    {action.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick Verify Dialog */}
      <Dialog open={showQuickVerify} onOpenChange={setShowQuickVerify}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Quick Verify
            </DialogTitle>
          </DialogHeader>
          <VerificationUpload onVerificationStart={handleVerificationStart} />
        </DialogContent>
      </Dialog>
    </>
  );
};
