import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, X, Twitter, Linkedin, MessageCircle, Facebook, Link2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareFABProps {
  title: string;
  url: string;
  text: string;
}

const SHARE_TARGETS = [
  {
    key: 'twitter',
    icon: Twitter,
    label: 'X',
    color: 'bg-foreground text-background',
    getUrl: (text: string, url: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url + '?utm_source=twitter&utm_medium=social')}`,
  },
  {
    key: 'facebook',
    icon: Facebook,
    label: 'FB',
    color: 'bg-blue-600 text-white',
    getUrl: (_: string, url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url + '?utm_source=facebook&utm_medium=social')}`,
  },
  {
    key: 'linkedin',
    icon: Linkedin,
    label: 'LI',
    color: 'bg-blue-700 text-white',
    getUrl: (_: string, url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url + '?utm_source=linkedin&utm_medium=social')}`,
  },
  {
    key: 'whatsapp',
    icon: MessageCircle,
    label: 'WA',
    color: 'bg-green-600 text-white',
    getUrl: (text: string, url: string) =>
      `https://wa.me/?text=${encodeURIComponent(text + '\n' + url + '?utm_source=whatsapp&utm_medium=social')}`,
  },
];

export function ShareFAB({ title, url, text }: ShareFABProps) {
  const [open, setOpen] = useState(false);

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text, url });
    } catch {
      // cancelled
    }
    setOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
    setOpen(false);
  };

  return (
    <div className="fixed bottom-20 sm:bottom-8 right-4 z-40 flex flex-col-reverse items-center gap-2">
      <AnimatePresence>
        {open && (
          <>
            {SHARE_TARGETS.map((target, i) => (
              <motion.a
                key={target.key}
                href={target.getUrl(text, url)}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 10 }}
                transition={{ delay: i * 0.05 }}
                className={`h-11 w-11 rounded-full flex items-center justify-center shadow-lg ${target.color}`}
                onClick={() => setOpen(false)}
              >
                <target.icon className="h-4 w-4" />
              </motion.a>
            ))}
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ delay: 0.2 }}
              onClick={handleCopy}
              className="h-11 w-11 rounded-full flex items-center justify-center shadow-lg bg-secondary text-foreground border border-border"
            >
              <Link2 className="h-4 w-4" />
            </motion.button>
            {'share' in navigator && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ delay: 0.25 }}
                onClick={handleNativeShare}
                className="h-11 w-11 rounded-full flex items-center justify-center shadow-lg bg-primary text-primary-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </motion.button>
            )}
          </>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        className="h-12 w-12 rounded-full shadow-xl"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
      </Button>
    </div>
  );
}
