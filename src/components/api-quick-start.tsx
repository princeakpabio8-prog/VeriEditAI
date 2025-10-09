import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function ApiQuickStart() {
  const { toast } = useToast();
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const copyToClipboard = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    toast({
      title: "Copied to clipboard",
      description: "Code example copied successfully",
    });
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const steps = [
    {
      title: "Generate Your API Key",
      description: "Create a new API key from the API Keys tab above",
      action: "Switch to API Keys tab",
    },
    {
      title: "Make Your First Request",
      description: "Test the API with this cURL command",
      code: `curl -X GET \\
  'https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/get-global-trust-index'`,
    },
    {
      title: "Add Authentication",
      description: "Include your API key for authenticated requests",
      code: `curl -X GET \\
  'https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/get-source-reputation?domain=reuters.com' \\
  -H 'X-API-Key: YOUR_API_KEY_HERE'`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          Get Started in 3 Steps
        </CardTitle>
        <CardDescription>
          Start using the Trust Intelligence API in under 3 minutes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {step.code && (
                  <div className="relative">
                    <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto pr-12">
                      <pre>{step.code}</pre>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(step.code!, index)}
                    >
                      {copiedStep === index ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
