interface LighthouseBeamIndicatorProps {
  isVerifying?: boolean;
  trustScore?: number;
}

export function LighthouseBeamIndicator({ isVerifying = false, trustScore }: LighthouseBeamIndicatorProps) {
  const getBeamColor = () => {
    if (trustScore === undefined) return 'hsl(var(--lighthouse-beam))';
    if (trustScore >= 80) return 'hsl(142 76% 36%)'; // green
    if (trustScore >= 60) return 'hsl(48 96% 53%)'; // yellow
    return 'hsl(0 84% 60%)'; // red
  };

  return (
    <div className="relative w-2 h-16">
      <div 
        className={`absolute inset-0 w-full bg-gradient-to-b from-transparent via-current to-transparent opacity-60 ${
          isVerifying ? 'animate-pulse' : ''
        }`}
        style={{ color: getBeamColor() }}
      />
      <div 
        className="absolute inset-0 w-full bg-gradient-to-b from-transparent via-current to-transparent blur-sm"
        style={{ color: getBeamColor() }}
      />
    </div>
  );
}
