/* global document browser window MutationObserver Node */

let forbiddenWords = [];
let mollyguardActive = false;
let overrideActive = false;

const debounce = (callback, wait) => {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, wait);
  };
};

function containsForbiddenWords(value) {
  return forbiddenWords.some((word) => value.toLowerCase().includes(word.toLowerCase()));
}

function updateUI(target) {
  if (overrideActive) return;

  const containsForbiddenWord = containsForbiddenWords(target.value);
  const sendButton = target.nextElementSibling;
  const parentDiv = target.parentElement;

  if (parentDiv.classList.contains('overridden')) parentDiv.classList.remove('overridden');

  if (containsForbiddenWord) {
    sendButton.disabled = true;
    parentDiv.classList.add('forbidden-div');
    mollyguardActive = true;
  } else {
    sendButton.disabled = false;
    parentDiv.classList.remove('forbidden-div');
    mollyguardActive = false;
  }
}

// Run check after updating
function updateForbiddenWords() {
  browser.storage.local.get('words', (data) => {
    forbiddenWords = data.words || [];
  });
}

// Catch both keypresses & paste with mouse
document.body.addEventListener('input', debounce((e) => {
  if (e.target.id === 'prompt-textarea') updateUI(e.target);
}, 300));

// Catch submission via 'Enter'
document.addEventListener('keydown', (e) => {
  if (overrideActive) return;

  if (e.target.id === 'prompt-textarea' && e.key === 'Enter') {
    if (containsForbiddenWords(e.target.value)) {
      e.stopPropagation();
      e.preventDefault();
    }
  }
}, true);

browser.runtime.onMessage.addListener((message) => {
  if (message.command === 'updateWords') {
    updateForbiddenWords();
  }
});

// On load
updateForbiddenWords();

// Molly-guard can be overridden by double pressing 'Escape'
// The most effective way of reenabling it is to listen for divs being inserted into the DOM
// This indicates that the chat has continued
let lastEscapePressTime = 0;
const targetNode = document;
const config = { childList: true, subtree: true };

const observer = new MutationObserver((mutationsList) => {
  mutationsList.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((addedNode) => {
        if (addedNode.nodeType === Node.ELEMENT_NODE && addedNode.tagName === 'DIV') {
          overrideActive = false;
          observer.disconnect();
        }
      });
    }
  });
});

function disableMollyguard() {
  const textInput = document.getElementById('prompt-textarea');
  const sendButton = textInput.nextElementSibling;
  const parentDiv = textInput.parentElement;

  sendButton.disabled = false;
  parentDiv.classList.remove('forbidden-div');
  parentDiv.classList.add('overridden');
  mollyguardActive = false;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const currentTime = new Date().getTime();

    if (currentTime - lastEscapePressTime < 350) {
      // Do nothing if molly-gaurd is not currently active
      if (!mollyguardActive) return;

      // Otherwise:
      overrideActive = true;
      disableMollyguard();
      observer.observe(targetNode, config);
    }

    lastEscapePressTime = currentTime;
  }
});
