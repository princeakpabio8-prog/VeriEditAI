import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface User {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionsChange?: (mentions: string[]) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export const MentionInput = ({
  value,
  onChange,
  onMentionsChange,
  placeholder = "Write a comment...",
  className = "",
  rows = 3
}: MentionInputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  const searchUsers = async (query: string) => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_users', {
        search_query: query,
        limit_count: 5
      });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      
      // Check if there's a space after @
      if (!textAfterAt.includes(' ') && textAfterAt.length <= 20) {
        setMentionStart(lastAtSymbol);
        setShowSuggestions(true);
        setSelectedIndex(0);
        searchUsers(textAfterAt);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }

    // Extract all mentions from the text
    const mentionRegex = /@([a-z0-9_]{3,20})/g;
    const matches = [...newValue.matchAll(mentionRegex)];
    const mentionedUsernames = matches.map(match => match[1]);
    onMentionsChange?.(mentionedUsernames);
  };

  const insertMention = (user: User) => {
    if (mentionStart === null || !textareaRef.current) return;

    const beforeMention = value.substring(0, mentionStart);
    const afterCursor = value.substring(textareaRef.current.selectionStart);
    const newValue = `${beforeMention}@${user.username} ${afterCursor}`;
    
    onChange(newValue);
    setShowSuggestions(false);
    setMentionStart(null);

    // Set cursor after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = mentionStart + user.username.length + 2;
        textareaRef.current.selectionStart = newPos;
        textareaRef.current.selectionEnd = newPos;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      insertMention(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={`w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none ${className}`}
      />

      {showSuggestions && (
        <div className={`absolute z-50 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden ${isMobile ? 'w-full' : 'w-full max-w-md'}`}>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : suggestions.length > 0 ? (
            <div className="max-h-48 overflow-y-auto">
              {suggestions.map((user, index) => (
                <button
                  key={user.user_id}
                  type="button"
                  onClick={() => insertMention(user)}
                  className={`w-full flex items-center gap-3 text-left transition-colors touch-manipulation ${isMobile ? 'px-4 py-3 min-h-[56px]' : 'px-4 py-2'} ${
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <UserAvatar
                    avatarUrl={user.avatar_url}
                    fullName={user.full_name}
                    size={isMobile ? "md" : "sm"}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${isMobile ? 'text-base' : 'text-sm'}`}>
                      {user.full_name || 'Anonymous'}
                    </div>
                    <div className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-xs'}`}>
                      @{user.username}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className={`text-muted-foreground text-center ${isMobile ? 'px-4 py-4 text-base' : 'px-4 py-3 text-sm'}`}>
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  );
};
