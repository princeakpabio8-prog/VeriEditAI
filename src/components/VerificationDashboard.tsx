import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import React, { useState } from "react";
import { useVerify } from "../hooks/useVerify";
import { useAuth } from "../contexts/AuthContext";
import { verificationCache } from "@/lib/verification-cache";

export default function VerificationDashboard() {
  const { verify, loading, error, result } = useVerify();
  const { user } = useAuth();
  const [input, setInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !input.trim()) return;
    await verify(input.trim(), user.id);
  };

  const handleFreshVerify = async () => {
    if (!user || !input.trim()) return;
    verificationCache.clear(); // Clear all cache
    await verify(input.trim(), user.id, true); // Bypass cache
  };

  const displayStatus = String(result?.status || 'unknown');

  return (
    <div className="p-6 max-w-2xl mx-auto text-foreground">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          VeriEdit AI Verification
        </h1>
        <p className="text-muted-foreground mt-2">
          Powered by Perplexity + OpenAI for comprehensive fact-checking
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-foreground mb-2">
            Content to Verify
          </label>
          <textarea
            id="content"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste text, URL, or claim to verify..."
            className="w-full p-4 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
            rows={5}
            required
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            disabled={loading || !user || !input.trim()}
            className="flex-1 min-h-12"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing with AI...
              </span>
            ) : (
              "Verify Content"
            )}
          </Button>
          <Button
            type="button"
            onClick={handleFreshVerify}
            disabled={loading || !user || !input.trim()}
            variant="outline" className="min-h-12 gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Fresh Check
          </Button>
        </div>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-destructive mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Verification Result</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              displayStatus === 'verified' ? 'bg-trust-high/10 text-trust-high border border-trust-high/30' :
              displayStatus === 'debunked' || displayStatus === 'false' ? 'bg-destructive/10 text-destructive border border-destructive/30' :
              displayStatus === 'flagged' ? 'bg-destructive/10 text-destructive border border-destructive/30' :
              'bg-trust-medium/10 text-trust-medium border border-trust-medium/30'
            }`}>
              {displayStatus === 'debunked' ? 'Debunked' : displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1).replace('_', ' ')}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Confidence Score</div>
              <div className="text-2xl font-bold text-foreground">{result.confidence}%</div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    result.confidence >= 80 ? 'bg-trust-high' :
                    result.confidence >= 65 ? 'bg-trust-medium' : 'bg-trust-low'
                  }`}
                  style={{ width: `${result.confidence}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Analysis Date</div>
              <div className="text-lg font-medium text-foreground">
                {new Date(result.created_at).toLocaleDateString()}
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(result.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-foreground mb-2">AI Summary</h3>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-foreground leading-relaxed">{result.summary}</p>
            </div>
          </div>

          {result.sources && result.sources.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">Sources ({result.sources.length})</h3>
              <div className="space-y-2">
                {result.sources.map((source: any, i: number) => (
                  <div key={i} className="bg-muted p-3 rounded-lg">
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-accent hover:underline font-medium transition-colors"
                    >
                      {source.title}
                    </a>
                    <div className="text-sm text-muted-foreground break-all mt-1">{source.url}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}