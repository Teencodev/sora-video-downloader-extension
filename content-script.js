// Content script for Sora website
console.log('Sora2DL Extension loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getVideoUrl') {
    const videoUrl = getVideoUrlFromPage();
    sendResponse({ videoUrl: videoUrl });
  }
  return true;
});

// Function to extract video URL from Sora page
function getVideoUrlFromPage() {
  // Method 1: Try to find video in meta tags
  const metaTags = document.querySelectorAll('meta[property="og:video"], meta[property="og:video:url"]');
  for (let meta of metaTags) {
    if (meta.content && meta.content.includes('sora.chatgpt.com')) {
      return meta.content;
    }
  }
  
  // Method 2: Try to find video in JSON-LD
  const jsonLd = document.querySelector('script[type="application/ld+json"]');
  if (jsonLd) {
    try {
      const data = JSON.parse(jsonLd.textContent);
      if (data.url && data.url.includes('sora.chatgpt.com')) {
        return data.url;
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }
  
  // Method 3: Try to get current page URL (if it's a video page)
  const currentUrl = window.location.href;
  if (currentUrl.includes('/p/')) {
    return currentUrl;
  }
  
  // Method 4: Look for video elements
  const videoElement = document.querySelector('video');
  if (videoElement && videoElement.src) {
    return videoElement.src;
  }
  
  return null;
}

// Add download button to Sora page
function addDownloadButton() {
  if (document.getElementById('sora2dl-download-btn')) return;
  
  const videoUrl = getVideoUrlFromPage();
  if (!videoUrl) return;
  
  const downloadBtn = document.createElement('button');
  downloadBtn.id = 'sora2dl-download-btn';
  downloadBtn.innerHTML = '📥 Download with Sora2DL';
  downloadBtn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    background: linear-gradient(135deg, #3b82f6, #7c5cff);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
  `;
  
  downloadBtn.addEventListener('mouseenter', () => {
    downloadBtn.style.transform = 'translateY(-2px)';
    downloadBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
  });
  
  downloadBtn.addEventListener('mouseleave', () => {
    downloadBtn.style.transform = 'translateY(0)';
    downloadBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  });
  
  downloadBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'downloadVideo',
      videoUrl: videoUrl
    });
  });
  
  document.body.appendChild(downloadBtn);
}

// Observe DOM changes to add button when video loads
const observer = new MutationObserver(() => {
  addDownloadButton();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Initial check
addDownloadButton();
