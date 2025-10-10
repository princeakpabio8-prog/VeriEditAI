import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

interface PartnershipRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: any;
}

export const PartnershipRequestDialog = ({ open, onOpenChange, organization }: PartnershipRequestDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contact_name: "",
    contact_email: "",
    contact_website: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-partnership-request', {
        body: {
          organization_id: organization.id,
          ...formData,
        },
      });

      if (error) throw error;

      toast({
        title: "Request Submitted Successfully",
        description: "We'll be in touch with you soon to discuss the partnership.",
      });

      onOpenChange(false);
      setFormData({
        contact_name: "",
        contact_email: "",
        contact_website: "",
        message: "",
      });
    } catch (error: any) {
      console.error('Partnership request error:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-background to-primary/5 border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            Join VeriEdit's Trust Network
          </DialogTitle>
          <DialogDescription>
            Partner with VeriEdit to verify your organization's data in real time
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization</Label>
            <Input
              id="org-name"
              value={organization.name}
              disabled
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-name">Your Name *</Label>
            <Input
              id="contact-name"
              placeholder="John Doe"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email">Email Address *</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="john@example.com"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-website">Website (Optional)</Label>
            <Input
              id="contact-website"
              type="url"
              placeholder="https://example.com"
              value={formData.contact_website}
              onChange={(e) => setFormData({ ...formData, contact_website: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Tell us about your verification needs..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
