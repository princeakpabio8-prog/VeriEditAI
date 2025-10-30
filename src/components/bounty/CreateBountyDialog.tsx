import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

interface CreateBountyDialogProps {
  organizationId: string;
  onSuccess?: () => void;
}

export const CreateBountyDialog = ({ organizationId, onSuccess }: CreateBountyDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    claim_to_verify: "",
    category: "general",
    reward_amount: "",
    reward_currency: "USD",
    payment_type: "fiat",
    expires_days: "30",
    min_trust_score: "50",
    required_sources: "3",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(formData.expires_days));

      const { data, error } = await supabase.functions.invoke('create-truth-bounty', {
        body: {
          organization_id: organizationId,
          title: formData.title,
          description: formData.description,
          claim_to_verify: formData.claim_to_verify,
          category: formData.category,
          reward_amount: Number(formData.reward_amount),
          reward_currency: formData.reward_currency,
          payment_type: formData.payment_type,
          expires_at: expiresAt.toISOString(),
          min_trust_score: Number(formData.min_trust_score),
          required_sources: Number(formData.required_sources),
        },
      });

      if (error) throw error;

      toast.success('Bounty created successfully! Auto-ping notifications are being sent.');
      setOpen(false);
      if (onSuccess) onSuccess();

      // Reset form
      setFormData({
        title: "",
        description: "",
        claim_to_verify: "",
        category: "general",
        reward_amount: "",
        reward_currency: "USD",
        payment_type: "fiat",
        expires_days: "30",
        min_trust_score: "50",
        required_sources: "3",
      });
    } catch (error: any) {
      console.error('Error creating bounty:', error);
      toast.error(error.message || 'Failed to create bounty');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Bounty
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Truth Bounty</DialogTitle>
          <DialogDescription>
            Post a verification task with rewards for the community. Auto-ping notifications will be sent to relevant verifiers and partners.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Bounty Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Verify Election Results from XYZ County"
              required
            />
          </div>

          <div>
            <Label htmlFor="claim">Claim to Verify *</Label>
            <Textarea
              id="claim"
              value={formData.claim_to_verify}
              onChange={(e) => setFormData({ ...formData, claim_to_verify: e.target.value })}
              placeholder="Enter the specific claim that needs verification"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide details about what you need verified and any specific requirements"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="election">Election</SelectItem>
                  <SelectItem value="ai">AI</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="climate">Climate</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expires">Expires In (Days) *</Label>
              <Input
                id="expires"
                type="number"
                value={formData.expires_days}
                onChange={(e) => setFormData({ ...formData, expires_days: e.target.value })}
                min="1"
                max="90"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="amount">Reward Amount *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.reward_amount}
                onChange={(e) => setFormData({ ...formData, reward_amount: e.target.value })}
                min="1"
                step="0.01"
                required
              />
            </div>

            <div>
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={formData.reward_currency}
                onValueChange={(value) => setFormData({ ...formData, reward_currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="MATIC">MATIC</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment_type">Payment Type *</Label>
              <Select
                value={formData.payment_type}
                onValueChange={(value) => setFormData({ ...formData, payment_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fiat">Fiat</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trust_score">Min Trust Score (%)</Label>
              <Input
                id="trust_score"
                type="number"
                value={formData.min_trust_score}
                onChange={(e) => setFormData({ ...formData, min_trust_score: e.target.value })}
                min="0"
                max="100"
              />
            </div>

            <div>
              <Label htmlFor="sources">Required Sources</Label>
              <Input
                id="sources"
                type="number"
                value={formData.required_sources}
                onChange={(e) => setFormData({ ...formData, required_sources: e.target.value })}
                min="1"
                max="10"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Bounty & Auto-Ping'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};