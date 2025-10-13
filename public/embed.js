/**
 * VeriEdit AI Embed Widget
 * Lightweight widget for embedding activity on external sites
 * Usage: <script src="https://verieditai.com/embed.js" data-user="username" data-theme="dark"></script>
 */

(function() {
  'use strict';

  // Get script tag and config
  const scriptTag = document.currentScript;
  const username = scriptTag.getAttribute('data-user') || 'demo';
  const theme = scriptTag.getAttribute('data-theme') || 'auto';

  // Create widget container
  const container = document.createElement('div');
  container.className = 'veriedit-widget';
  container.style.cssText = `
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    border: 1px solid ${theme === 'dark' ? '#333' : '#e5e7eb'};
    border-radius: 8px;
    padding: 16px;
    background: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
    color: ${theme === 'dark' ? '#ffffff' : '#000000'};
    max-width: 400px;
    margin: 16px 0;
  `;

  // Create header
  const header = document.createElement('div');
  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
      <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite;"></div>
      <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Live Verification Activity</h3>
    </div>
  `;

  // Create activity list
  const activityList = document.createElement('div');
  activityList.id = 'veriedit-activities';
  activityList.innerHTML = '<p style="text-align: center; color: #999; font-size: 14px;">Loading...</p>';

  // Create footer
  const footer = document.createElement('div');
  footer.innerHTML = `
    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid ${theme === 'dark' ? '#333' : '#e5e7eb'}; text-align: center;">
      <a href="https://verieditai.com" target="_blank" style="color: #3b82f6; text-decoration: none; font-size: 12px;">
        Powered by VeriEdit AI
      </a>
    </div>
  `;

  container.appendChild(header);
  container.appendChild(activityList);
  container.appendChild(footer);
  scriptTag.parentNode.insertBefore(container, scriptTag.nextSibling);

  // Fetch and display activities
  fetch(`https://verieditai.com/api/embed-data?user=${username}&limit=5`)
    .then(res => res.json())
    .then(data => {
      if (data.activities && data.activities.length > 0) {
        activityList.innerHTML = data.activities.map(activity => `
          <div style="padding: 8px; margin: 4px 0; border-radius: 4px; background: ${theme === 'dark' ? '#2a2a2a' : '#f9fafb'};">
            <p style="margin: 0; font-size: 14px;">${activity.text}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #999;">${activity.time}</p>
          </div>
        `).join('');
      } else {
        activityList.innerHTML = '<p style="text-align: center; color: #999; font-size: 14px;">No recent activity</p>';
      }
    })
    .catch(err => {
      console.error('VeriEdit widget error:', err);
      activityList.innerHTML = '<p style="text-align: center; color: #999; font-size: 14px;">Failed to load</p>';
    });

  // Add pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  document.head.appendChild(style);
})();
