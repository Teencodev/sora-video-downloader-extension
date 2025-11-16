// DOM elements
const soraUrlInput = document.getElementById('soraUrl');
const downloadBtn = document.getElementById('downloadBtn');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const formatsContainer = document.getElementById('formatsContainer');
const inviteCodesContainer = document.getElementById('inviteCodes');
const getCurrentPageBtn = document.getElementById('getCurrentPage');
const openWebsiteBtn = document.getElementById('openWebsite');

// API endpoints
const API_URL = 'https://sora2dl.com/api.php';
const INVITE_API_URL = 'https://sora2dl.com/invite-api.php';

// Extract video ID from Sora URL
function extractId(url) {
  try {
    if (url.includes('/p/')) {
      const match = url.match(/\/p\/(s_[a-f0-9]+)(?:\?|$)/);
      return match ? match[1] : null;
    } else if (url.match(/^s_[a-f0-9]+/)) {
      return url.split('?')[0];
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Show loading state
function showLoading(show) {
  loadingEl.style.display = show ? 'block' : 'none';
  downloadBtn.disabled = show;
}

// Show error message
function showError(message) {
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  setTimeout(() => {
    errorEl.style.display = 'none';
  }, 5000);
}

// Download video handler
async function handleDownload() {
  const url = soraUrlInput.value.trim();
  
  if (!url) {
    showError('Please paste a Sora video link');
    return;
  }

  const videoId = extractId(url);
  if (!videoId) {
    showError('Invalid Sora video link format');
    return;
  }

  showLoading(true);
  formatsContainer.style.display = 'none';

  try {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(videoId)}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch video');
    }
    
    displayFormats(data.files, videoId);
    
  } catch (error) {
    showError('Failed to load video: ' + error.message);
  } finally {
    showLoading(false);
  }
}

// Display available formats
function displayFormats(files, videoId) {
  const order = ['mp4_nowm', 'mp4_wm', 'gif', 'thumb'];
  let html = '';
  
  order.forEach(key => {
    if (!files[key]) return;
    
    const file = files[key];
    const typeMap = {
      'mp4_nowm': 'mp4',
      'mp4_wm': 'mp4_wm', 
      'gif': 'gif',
      'thumb': 'thumb'
    };
    
    html += `
      <div class="format-card">
        <div class="format-title">${file.label}</div>
        <button class="download-btn" onclick="downloadFormat('${videoId}', '${typeMap[key]}')">
          Download ${file.label.includes('MP4') ? 'MP4' : file.label.split(' ')[0]}
        </button>
      </div>
    `;
  });
  
  formatsContainer.innerHTML = html;
  formatsContainer.style.display = 'grid';
}

// Download specific format
function downloadFormat(videoId, type) {
  const downloadUrl = `https://sora2dl.com/download.php?id=${videoId}&type=${type}`;
  chrome.tabs.create({ url: downloadUrl });
}

// Load invite codes
async function loadInviteCodes() {
  try {
    const response = await fetch(INVITE_API_URL);
    const data = await response.json();
    
    if (data && data.success && data.data && data.data.length > 0) {
      let html = '';
      data.data.slice(0, 3).forEach((code, index) => {
        html += `
          <div class="invite-code">
            <span>${code.code}</span>
            <button class="copy-btn" onclick="copyToClipboard('${code.code}')">Copy</button>
          </div>
        `;
      });
      inviteCodesContainer.innerHTML = html;
    } else {
      inviteCodesContainer.innerHTML = '<div style="text-align: center; color: #6b7280; font-size: 12px;">No codes available</div>';
    }
  } catch (error) {
    inviteCodesContainer.innerHTML = '<div style="text-align: center; color: #ef4444; font-size: 12px;">Failed to load codes</div>';
  }
}

// Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Show copied feedback
    const originalText = event.target.textContent;
    event.target.textContent = 'Copied!';
    event.target.style.background = '#10b981';
    
    setTimeout(() => {
      event.target.textContent = originalText;
      event.target.style.background = '#3b82f6';
    }, 2000);
  });
}

// Get current page video
async function getCurrentPageVideo() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab.url.includes('sora.chatgpt.com')) {
    // Inject content script to get video URL
    chrome.tabs.sendMessage(tab.id, { action: 'getVideoUrl' }, (response) => {
      if (response && response.videoUrl) {
        soraUrlInput.value = response.videoUrl;
        handleDownload();
      } else {
        showError('No Sora video found on this page');
      }
    });
  } else {
    showError('Please navigate to a Sora video page first');
  }
}

// Event listeners
downloadBtn.addEventListener('click', handleDownload);

soraUrlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleDownload();
  }
});

getCurrentPageBtn.addEventListener('click', getCurrentPageVideo);

openWebsiteBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://sora2dl.com' });
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadInviteCodes();
  
  // Check if current tab is Sora and get video URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab.url.includes('sora.chatgpt.com')) {
      getCurrentPageBtn.style.background = '#dbeafe';
    }
  });
});

// Make functions available globally
window.downloadFormat = downloadFormat;
window.copyToClipboard = copyToClipboard;
