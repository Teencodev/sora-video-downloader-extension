// Background script for Chrome Extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadVideo') {
    // Open popup with the video URL
    chrome.action.openPopup();
    
    // You could also directly trigger download
    // chrome.tabs.create({
    //   url: `https://sora2dl.com/?url=${encodeURIComponent(request.videoUrl)}`
    // });
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open welcome page on install
    chrome.tabs.create({
      url: 'https://sora2dl.com/welcome.html'
    });
  }
});
