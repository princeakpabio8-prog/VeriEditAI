import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MobileEnhancedFormProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileEnhancedForm({ children, className = '' }: MobileEnhancedFormProps) {
  const isMobile = useIsMobile();
  
  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <div className={`mobile-form-container ${className}`}>
      {isMobile && (
        <style>{`
          .mobile-form-container input,
          .mobile-form-container textarea,
          .mobile-form-container select {
            font-size: 16px !important;
            min-height: 44px;
          }
          
          .mobile-form-container button {
            min-height: 44px;
            min-width: 44px;
          }
          
          .mobile-form-container .space-y-4 > * + * {
            margin-top: 1.5rem;
          }
          
          .mobile-form-container .grid {
            grid-template-columns: 1fr;
          }
        `}</style>
      )}
      {children}
    </div>
  );
}

// Enhanced mobile-friendly form components
export const MobileInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <Input
      ref={ref}
      className={`${className} ${isMobile ? 'text-base h-12' : ''}`}
      {...props}
    />
  );
});

export const MobileTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<typeof Textarea>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <Textarea
      ref={ref}
      className={`${className} ${isMobile ? 'text-base min-h-[120px]' : ''}`}
      {...props}
    />
  );
});

export const MobileButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, size, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <Button
      ref={ref}
      size={isMobile ? 'mobile' : size}
      className={`${className} ${isMobile ? 'touch-manipulation w-full' : ''}`}
      {...props}
    />
  );
});

export const MobileCard = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Card>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <Card
      ref={ref}
      className={`${className} ${isMobile ? 'mx-2 shadow-lg' : ''}`}
      {...props}
    />
  );
});

// Form field wrapper with mobile-optimized spacing
export function MobileFormField({ 
  label, 
  children, 
  className = '' 
}: { 
  label: string; 
  children: React.ReactNode; 
  className?: string;
}) {
  const isMobile = useIsMobile();
  
  return (
    <div className={`space-y-2 ${isMobile ? 'mb-6' : 'mb-4'} ${className}`}>
      <Label className={isMobile ? 'text-base font-medium' : ''}>{label}</Label>
      {children}
    </div>
  );
}

MobileInput.displayName = 'MobileInput';
MobileTextarea.displayName = 'MobileTextarea';
MobileButton.displayName = 'MobileButton';
MobileCard.displayName = 'MobileCard';