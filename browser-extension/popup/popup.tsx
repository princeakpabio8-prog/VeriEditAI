import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { getApiKey } from '../shared/storage';
import { getUnlockedAchievements, getVerificationCount, Achievement } from '../shared/achievements';
import './popup.css';

interface VerificationResult {
  trustScore: number;
  summary: string;
  status: string;
  sources?: Array<{
    url: string;
    title?: string;
    reliability_score?: number;
  }>;
}

const Popup: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [savedApiKey, setSavedApiKey] = useState('');
  const [content, setContent] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'main' | 'signup' | 'achievements'>('main');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [verificationCount, setVerificationCount] = useState(0);

  useEffect(() => {
    loadApiKey();
    loadAchievements();
  }, []);

  const loadApiKey = async () => {
    const key = await getApiKey();
    if (key) {
      setSavedApiKey(key);
    }
  };

  const loadAchievements = async () => {
    const unlocked = await getUnlockedAchievements();
    const count = await getVerificationCount();
    setAchievements(unlocked);
    setVerificationCount(count);
  };

  const handleSaveApiKey = async () => {
    try {
      await chrome.storage.local.set({ apiKey });
      setSavedApiKey(apiKey);
      setError('');
    } catch (err) {
      setError('Failed to save API key');
    }
  };

  const handleVerify = async () => {
    if (!content.trim()) {
      setError('Please enter content to verify');
      return;
    }

    if (!savedApiKey) {
      setError('Please set your API key first');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'VERIFY_CONTENT',
        content: content.trim()
      });

      if (response.success) {
        setResult(response.data);
        await loadAchievements(); // Reload achievements after verification
      } else {
        setError(response.error || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify content');
    } finally {
      setLoading(false);
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const shareOnTwitter = () => {
    if (!result) return;
    const text = `I just verified content with VeriedIT AI! Trust Score: ${result.trustScore}/100. Fight misinformation with AI-powered fact-checking. Get 5 free verifications with code: TWITTER5`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://sqtkkzdswxazyikcheds.supabase.co')}`;
    chrome.tabs.create({ url });
  };

  const shareOnLinkedIn = () => {
    if (!result) return;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://sqtkkzdswxazyikcheds.supabase.co')}`;
    chrome.tabs.create({ url });
  };

  if (view === 'signup') {
    return (
      <div className="popup-container">
        <div className="popup-header">
          <button onClick={() => setView('main')} className="back-button">← Back</button>
          <h2>Sign Up / Login</h2>
        </div>
        <div className="signup-content">
          <p>Get your API key to start verifying content:</p>
          <ol>
            <li>Visit <a href="https://sqtkkzdswxazyikcheds.supabase.co/auth" target="_blank">VeriedIT AI</a></li>
            <li>Sign up for a free account</li>
            <li>Go to your <a href="https://sqtkkzdswxazyikcheds.supabase.co/profile" target="_blank">Profile</a></li>
            <li>Copy your API key</li>
            <li>Paste it in the extension settings</li>
          </ol>
          <p className="bonus-info">💎 Use referral code <strong>CHROME5</strong> for 5 bonus verifications!</p>
          <button onClick={() => chrome.tabs.create({ url: 'https://sqtkkzdswxazyikcheds.supabase.co/auth?ref=CHROME5' })} className="primary-button">
            Sign Up Now
          </button>
        </div>
      </div>
    );
  }

  if (view === 'achievements') {
    return (
      <div className="popup-container">
        <div className="popup-header">
          <button onClick={() => setView('main')} className="back-button">← Back</button>
          <h2>Achievements</h2>
        </div>
        <div className="achievements-content">
          <div className="stats-card">
            <div className="stat-item">
              <span className="stat-label">Total Verifications</span>
              <span className="stat-value">{verificationCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Achievements Unlocked</span>
              <span className="stat-value">{achievements.length}/6</span>
            </div>
          </div>
          <div className="achievements-list">
            {achievements.map(achievement => (
              <div key={achievement.id} className="achievement-card unlocked">
                <span className="achievement-icon">{achievement.icon}</span>
                <div className="achievement-info">
                  <h3>{achievement.title}</h3>
                  <p>{achievement.description}</p>
                </div>
              </div>
            ))}
            {achievements.length === 0 && (
              <p className="empty-state">Start verifying content to unlock achievements! 🎯</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <div className="popup-header">
        <div className="header-logo">
          <h1>VeriedIT AI</h1>
          <span className="tagline">Truth Verification</span>
        </div>
        <div className="header-actions">
          <button onClick={() => setView('achievements')} className="icon-button" title="Achievements">
            🏆 {achievements.length}
          </button>
        </div>
      </div>

      {!savedApiKey ? (
        <div className="setup-section">
          <h3>Setup Required</h3>
          <p>Enter your API key to start verifying content</p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Your API Key"
            className="input-field"
          />
          <button onClick={handleSaveApiKey} className="primary-button">
            Save API Key
          </button>
          <button onClick={() => setView('signup')} className="secondary-button">
            Don't have an account? Sign Up
          </button>
        </div>
      ) : (
        <>
          <div className="verify-section">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste content to verify..."
              className="content-input"
              rows={4}
            />
            <button
              onClick={handleVerify}
              disabled={loading}
              className="verify-button"
            >
              {loading ? 'Verifying...' : '🔍 Verify Content'}
            </button>
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {result && (
            <div className="result-section">
              <div className="trust-score-card">
                <div
                  className="trust-score-circle"
                  style={{ borderColor: getTrustScoreColor(result.trustScore) }}
                >
                  <span className="score-value">{result.trustScore}</span>
                  <span className="score-label">Trust Score</span>
                </div>
                <div className="status-badge" style={{ backgroundColor: getTrustScoreColor(result.trustScore) }}>
                  {result.status}
                </div>
              </div>

              <div className="summary-section">
                <h4>Summary</h4>
                <p>{result.summary}</p>
              </div>

              {result.sources && result.sources.length > 0 && (
                <div className="sources-section">
                  <h4>Sources ({result.sources.length})</h4>
                  <div className="sources-list">
                    {result.sources.slice(0, 3).map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="source-link"
                      >
                        {source.title || source.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="share-section">
                <h4>Share Result</h4>
                <div className="share-buttons">
                  <button onClick={shareOnTwitter} className="share-button twitter">
                    𝕏 Share
                  </button>
                  <button onClick={shareOnLinkedIn} className="share-button linkedin">
                    in Share
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="stats-footer">
            <span>✓ {verificationCount} verified</span>
            <button onClick={() => setView('achievements')} className="text-button">
              View Achievements →
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Initialize React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
