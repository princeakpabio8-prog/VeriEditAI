import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { StorageData, VerificationResult } from '../shared/types';
import { getStorage, setStorage } from '../shared/storage';
import '../popup/popup.css';

function Popup() {
  const [apiKey, setApiKey] = useState('');
  const [content, setContent] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    autoVerify: false,
    showBadges: true,
    trustThreshold: 50
  });

  useEffect(() => {
    // Load saved data
    getStorage(['apiKey', 'settings']).then((data: StorageData) => {
      if (data.apiKey) setApiKey(data.apiKey);
      if (data.settings) setSettings(data.settings);
    });
  }, []);

  const handleSaveApiKey = async () => {
    await setStorage({ apiKey });
    alert('API Key saved!');
  };

  const handleVerify = async () => {
    if (!content.trim()) {
      alert('Please enter content to verify');
      return;
    }

    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'VERIFY_CONTENT',
        content: content
      });

      if (response.success) {
        setResult(response.data);
      } else {
        alert(response.error || 'Verification failed');
      }
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await setStorage({ settings: newSettings });
  };

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="header-content">
          <h1>🔍 TruthLens</h1>
          <p>AI-Powered Content Verification</p>
        </div>
      </header>

      <div className="popup-body">
        {/* API Key Section */}
        <div className="section">
          <label className="label">API Key</label>
          <div className="input-group">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your TruthLens API key"
              className="input"
            />
            <button onClick={handleSaveApiKey} className="btn btn-secondary">
              Save
            </button>
          </div>
          <p className="hint">
            Get your API key from{' '}
            <a href="https://sqtkkzdswxazyikcheds.supabase.co" target="_blank" rel="noopener noreferrer">
              TruthLens Dashboard
            </a>
          </p>
        </div>

        {/* Verification Section */}
        <div className="section">
          <label className="label">Verify Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste content to verify..."
            className="textarea"
            rows={4}
          />
          <button
            onClick={handleVerify}
            disabled={loading || !apiKey}
            className="btn btn-primary"
          >
            {loading ? 'Verifying...' : 'Verify Content'}
          </button>
        </div>

        {/* Results Section */}
        {result && (
          <div className="section result-section">
            <div className={`trust-score score-${result.trustScore >= 75 ? 'high' : result.trustScore >= 50 ? 'medium' : 'low'}`}>
              <div className="score-label">Trust Score</div>
              <div className="score-value">{result.trustScore}%</div>
            </div>
            <div className="result-summary">
              <strong>Summary:</strong>
              <p>{result.summary}</p>
            </div>
            {result.sources && result.sources.length > 0 && (
              <div className="result-sources">
                <strong>Sources:</strong>
                <ul>
                  {result.sources.slice(0, 3).map((source, idx) => (
                    <li key={idx}>
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        {source.title || source.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Settings Section */}
        <div className="section">
          <label className="label">Settings</label>
          <div className="settings-group">
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.autoVerify}
                  onChange={(e) => handleSettingsChange('autoVerify', e.target.checked)}
                />
                <span>Auto-verify content</span>
              </label>
            </div>
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.showBadges}
                  onChange={(e) => handleSettingsChange('showBadges', e.target.checked)}
                />
                <span>Show verification badges</span>
              </label>
            </div>
            <div className="setting-item">
              <label className="range-label">
                <span>Trust threshold: {settings.trustThreshold}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.trustThreshold}
                  onChange={(e) => handleSettingsChange('trustThreshold', parseInt(e.target.value))}
                  className="range"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
