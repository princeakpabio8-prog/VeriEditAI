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
    <div className="p-6 max-w-2xl mx-auto text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
          VeriEdit AI Verification
        </h1>
        <p className="text-gray-400 mt-2">
          Powered by Perplexity + OpenAI for comprehensive fact-checking
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
            Content to Verify
          </label>
          <textarea
            id="content"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste text, URL, or claim to verify..."
            className="w-full p-4 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            rows={5}
            required
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !user || !input.trim()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing with AI...
              </span>
            ) : (
              "Verify Content"
            )}
          </button>
          <button
            type="button"
            onClick={handleFreshVerify}
            disabled={loading || !user || !input.trim()}
            className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm"
          >
            🔄 Fresh Check
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 p-6 bg-gray-900/50 border border-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Verification Result</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              displayStatus === 'verified' ? 'bg-green-900/30 text-green-400 border border-green-700' :
              displayStatus === 'debunked' || displayStatus === 'false' ? 'bg-red-900/30 text-red-400 border border-red-700' :
              displayStatus === 'flagged' ? 'bg-red-900/30 text-red-400 border border-red-700' :
              'bg-yellow-900/30 text-yellow-400 border border-yellow-700'
            }`}>
              {displayStatus === 'debunked' ? 'Debunked' : displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1).replace('_', ' ')}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <div className="text-sm text-gray-400">Confidence Score</div>
              <div className="text-2xl font-bold text-white">{result.confidence}%</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    result.confidence >= 80 ? 'bg-green-500' :
                    result.confidence >= 65 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${result.confidence}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <div className="text-sm text-gray-400">Analysis Date</div>
              <div className="text-lg font-medium text-white">
                {new Date(result.created_at).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-400">
                {new Date(result.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-white mb-2">AI Summary</h3>
            <div className="bg-gray-800/30 p-4 rounded-lg">
              <p className="text-gray-300 leading-relaxed">{result.summary}</p>
            </div>
          </div>

          {result.sources && result.sources.length > 0 && (
            <div>
              <h3 className="font-semibold text-white mb-3">Sources ({result.sources.length})</h3>
              <div className="space-y-2">
                {result.sources.map((source: any, i: number) => (
                  <div key={i} className="bg-gray-800/30 p-3 rounded-lg">
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      {source.title}
                    </a>
                    <div className="text-sm text-gray-500 mt-1">{source.url}</div>
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