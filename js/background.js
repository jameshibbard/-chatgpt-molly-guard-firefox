/* global browser */

// When sending a message from browser action to content script, was getting:
// Firefox extension Could not establish connection. Receiving end does not exist.
// Using background script as a relay seems to work.
browser.runtime.onMessage.addListener((message) => {
  if (message.command === 'updateWords') {
    browser.tabs.query({ url: 'https://chat.openai.com/*' }, (tabs) => {
      tabs.forEach((tab) => {
        browser.tabs.sendMessage(tab.id, { command: 'updateWords' });
      });
    });
  }
});

const wordlistURL = 'browser-action/word-list.html';

browser.action.onClicked.addListener(async () => {
  const tabs = await browser.tabs.query({ url: browser.runtime.getURL(wordlistURL) });

  if (tabs.length) {
    browser.tabs.update(tabs[0].id, { active: true });
  } else {
    browser.tabs.create({ url: wordlistURL });
  }
});
