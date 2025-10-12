import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface UserAvatarProps {
  avatarUrl?: string | null;
  fullName?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  userId?: string;
  clickable?: boolean;
}

// Generate consistent color from name
function getAvatarColor(name: string | null | undefined): string {
  if (!name) return "hsl(var(--muted))";
  
  const colors = [
    "hsl(195 100% 50%)", // primary blue
    "hsl(142 76% 36%)", // trust green
    "hsl(270 70% 30%)", // ritual purple
    "hsl(180 100% 50%)", // signal cyan
    "hsl(35 100% 60%)", // flame orange
    "hsl(205 35% 18%)", // ocean blue
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Get initials from full name
function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const sizeClasses = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-3xl",
};

export function UserAvatar({ 
  avatarUrl, 
  fullName, 
  size = "md", 
  className,
  userId,
  clickable = true
}: UserAvatarProps) {
  const initials = getInitials(fullName);
  const bgColor = getAvatarColor(fullName);
  
  const avatarContent = (
    <Avatar className={cn(sizeClasses[size], clickable && userId && "cursor-pointer hover:opacity-80 transition-opacity", className)}>
      {avatarUrl && (
        <AvatarImage 
          src={avatarUrl} 
          alt={fullName || "User avatar"} 
        />
      )}
      <AvatarFallback 
        style={{ backgroundColor: bgColor }}
        className="text-white font-semibold"
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  if (clickable && userId) {
    return <Link to={`/profile/${userId}`}>{avatarContent}</Link>;
  }

  return avatarContent;
}
