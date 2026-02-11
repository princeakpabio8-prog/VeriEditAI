import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
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
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'main' | 'achievements'>('main');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [verificationCount, setVerificationCount] = useState(0);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    const unlocked = await getUnlockedAchievements();
    const count = await getVerificationCount();
    setAchievements(unlocked);
    setVerificationCount(count);
  };

  const handleVerify = async () => {
    const verifyContent = content.trim() || (linkUrl.trim() ? `Verify the content at this URL: ${linkUrl.trim()}` : '');
    if (!verifyContent) {
      setError('Please enter content or a URL to verify');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'VERIFY_CONTENT',
        content: verifyContent
      });

      if (response.success) {
        setResult(response.data);
        await loadAchievements();
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

  const getTrustLabel = (score: number) => {
    if (score >= 70) return '✅ Verified';
    if (score >= 40) return '⚠️ Uncertain';
    return '❌ Unreliable';
  };

  const shareOnTwitter = () => {
    if (!result) return;
    const text = `I just verified content with VeriedIT AI! Trust Score: ${result.trustScore}/100. Fight misinformation with AI-powered fact-checking.`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://trust-lighthouse.lovable.app')}`;
    chrome.tabs.create({ url });
  };

  if (view === 'achievements') {
    return (
      <div className="popup-container">
        <div className="popup-header">
          <button onClick={() => setView('main')} className="back-button">← Back</button>
          <h2>🏆 Achievements</h2>
        </div>
        <div className="achievements-content">
          <div className="stats-card">
            <div className="stat-item">
              <span className="stat-value">{verificationCount}</span>
              <span className="stat-label">Verified</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{achievements.length}/6</span>
              <span className="stat-label">Unlocked</span>
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
          <div className="logo-icon">🏠</div>
          <div>
            <h1>VeriedIT AI</h1>
            <span className="tagline">AI-Powered Truth Verification</span>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={() => setView('achievements')} className="icon-button" title="Achievements">
            🏆 {achievements.length}
          </button>
        </div>
      </div>

      <div className="verify-section">
        <div className="input-wrapper">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Paste a URL to verify (optional)..."
            className="link-input"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste any claim, news headline, or social media post to verify..."
            className="content-input"
            rows={3}
          />
          <span className="input-hint">{content.length > 0 ? `${content.length} chars` : 'Tip: Right-click text on any page to verify!'}</span>
        </div>
        <button
          onClick={handleVerify}
          disabled={loading || (!content.trim() && !linkUrl.trim())}
          className="verify-button"
        >
          {loading ? (
            <span className="loading-spinner">⏳ Analyzing...</span>
          ) : (
            '🔍 Verify Now'
          )}
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
            <div className="result-meta">
              <div className="status-badge" style={{ backgroundColor: getTrustScoreColor(result.trustScore) }}>
                {getTrustLabel(result.trustScore)}
              </div>
            </div>
          </div>

          <div className="summary-section">
            <h4>📋 Analysis</h4>
            <p>{result.summary}</p>
          </div>

          {result.sources && result.sources.length > 0 && (
            <div className="sources-section">
              <h4>📰 Sources ({result.sources.length})</h4>
              <div className="sources-list">
                {result.sources.slice(0, 3).map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-link"
                  >
                    🔗 {source.title || source.url}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="share-section">
            <button onClick={shareOnTwitter} className="share-button twitter">
              𝕏 Share Result
            </button>
            <button 
              onClick={() => chrome.tabs.create({ url: 'https://trust-lighthouse.lovable.app' })} 
              className="share-button webapp"
            >
              🌐 Open Full App
            </button>
          </div>
        </div>
      )}

      <div className="stats-footer">
        <span>✓ {verificationCount} verified</span>
        <button onClick={() => setView('achievements')} className="text-button">
          🏆 Achievements →
        </button>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
