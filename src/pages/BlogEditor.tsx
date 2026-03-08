import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSaveBlogPost } from '@/hooks/useBlogPosts';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save, Send, Eye, X, Plus, Loader2, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MarkdownToolbar } from '@/components/blog/MarkdownToolbar';

const CATEGORIES = ['general', 'fact-checking', 'technology', 'media-literacy', 'updates'];

export default function BlogEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const saveMutation = useSaveBlogPost();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [category, setCategory] = useState('general');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 sm:pt-24 pb-24 sm:pb-16 max-w-3xl mx-auto px-4 text-center">
          <p className="text-muted-foreground">Please sign in to write a blog post.</p>
          <Link to="/auth"><Button className="mt-4">Sign In</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!content.trim()) { toast.error('Content is required'); return; }

    try {
      const post = await saveMutation.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || undefined,
        cover_image_url: coverImageUrl.trim() || undefined,
        category,
        tags,
        status,
        meta_title: metaTitle.trim() || undefined,
        meta_description: metaDescription.trim() || undefined,
      });

      toast.success(status === 'published' ? 'Post published! 🎉' : 'Draft saved!');
      if (status === 'published') {
        navigate(`/blog/${post.slug}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save post');
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const SettingsContent = () => (
    <div className="space-y-5">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Post Settings</h3>
        <div>
          <Label className="text-xs text-muted-foreground">Cover Image URL</Label>
          <Input placeholder="https://..." value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} className="mt-1 bg-secondary border-border text-sm min-h-[44px]" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Excerpt</Label>
          <Textarea placeholder="Brief summary..." value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="mt-1 bg-secondary border-border text-sm h-20 resize-none" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-1 bg-secondary border-border text-sm min-h-[44px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="capitalize min-h-[44px]">{c.replace('-', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Tags</Label>
          <div className="flex gap-1 mt-1">
            <Input placeholder="Add tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} className="bg-secondary border-border text-sm min-h-[44px]" />
            <Button size="sm" variant="outline" onClick={addTag} className="min-h-[44px] min-w-[44px]"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs cursor-pointer py-1 px-2" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                {tag} <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="text-sm font-semibold text-foreground">SEO Settings</h3>
        <div>
          <Label className="text-xs text-muted-foreground">Meta Title <span className="opacity-50">({(metaTitle || title).length}/60)</span></Label>
          <Input placeholder={title || 'SEO title...'} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={60} className="mt-1 bg-secondary border-border text-sm min-h-[44px]" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Meta Description <span className="opacity-50">({(metaDescription || excerpt).length}/160)</span></Label>
          <Textarea placeholder={excerpt || 'SEO description...'} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} maxLength={160} className="mt-1 bg-secondary border-border text-sm h-20 resize-none" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-20 sm:pt-24 pb-24 sm:pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
            <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors min-h-[44px]">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Blog</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <div className="flex gap-1.5 sm:gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden gap-1 min-h-[44px]">
                    <Settings2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-[400px] overflow-y-auto">
                  <SheetHeader><SheetTitle>Post Settings</SheetTitle></SheetHeader>
                  <div className="mt-4"><SettingsContent /></div>
                </SheetContent>
              </Sheet>

              <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-1 min-h-[44px]">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">{showPreview ? 'Edit' : 'Preview'}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleSave('draft')} disabled={saveMutation.isPending} className="gap-1 min-h-[44px]">
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="hidden sm:inline">Draft</span>
              </Button>
              <Button size="sm" onClick={() => handleSave('published')} disabled={saveMutation.isPending} className="gap-1 min-h-[44px]">
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden xs:inline">Publish</span>
              </Button>
            </div>
          </div>

          {showPreview ? (
            <Card className="bg-card border-border">
              <CardContent className="p-4 sm:p-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">{title || 'Untitled Post'}</h1>
                {coverImageUrl && (
                  <img src={coverImageUrl} alt={title} className="w-full h-48 sm:h-64 object-cover rounded-lg sm:rounded-xl mb-6 border border-border" />
                )}
                <div className="prose prose-invert prose-base sm:prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary">
                  <ReactMarkdown>{content || '*Start writing...*'}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Main editor */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                <Input
                  placeholder="Post title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl sm:text-2xl font-bold h-12 sm:h-14 bg-card border-border"
                />

                {/* Markdown toolbar + textarea */}
                <div>
                  <MarkdownToolbar textareaRef={textareaRef} content={content} onChange={setContent} />
                  <Textarea
                    ref={textareaRef}
                    placeholder="Write your post in Markdown..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[350px] sm:min-h-[500px] bg-card border-border font-mono text-sm leading-relaxed resize-y rounded-t-none"
                  />
                </div>

                {/* Word count bar */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground px-1">
                  <span>{wordCount} words</span>
                  <span>·</span>
                  <span>~{readTime} min read</span>
                </div>
              </div>

              {/* Desktop sidebar */}
              <div className="hidden lg:block space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Post Settings</CardTitle></CardHeader>
                  <CardContent><SettingsContent /></CardContent>
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
