/* global document browser window MutationObserver Node */

const config = {
  forbiddenWords: [],
  mollyguardActive: false,
  overrideActive: false,
  thisKeypressTime: 0,
  lastKeypressTime: 0,
  delay: 350,
};

function debounce(callback, wait) {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, wait);
  };
}

function containsForbiddenWords(value) {
  return config.forbiddenWords.some((word) => value.toLowerCase().includes(word));
}

function updateForbiddenWords() {
  browser.storage.local.get('words', ({ words }) => {
    if (words === undefined) return;

    config.forbiddenWords = words;
  });
}

function updateMollyGuard(target) {
  if (config.overrideActive) return;

  const containsForbiddenWord = containsForbiddenWords(target.value);
  const sendButton = target.nextElementSibling;
  const parentDiv = target.parentElement;

  if (containsForbiddenWord) {
    sendButton.disabled = true;
    parentDiv.classList.add('forbidden-div');
    config.mollyguardActive = true;
  } else {
    sendButton.disabled = false;
    parentDiv.classList.remove('forbidden-div');
    config.mollyguardActive = false;
  }
}

function updateOverride({ command }) {
  const textArea = document.getElementById('prompt-textarea');
  const parentDiv = textArea.parentElement;
  const sendButton = textArea.nextElementSibling;

  if (command === 'ENABLE') {
    sendButton.disabled = false;
    parentDiv.classList.remove('forbidden-div');
    parentDiv.classList.add('overridden');
    config.mollyguardActive = false;
    config.overrideActive = true;
  }

  if (command === 'DISABLE') {
    parentDiv.classList.remove('overridden');
    config.overrideActive = false;
  }
}

// Detect new DIV elements being insterted into the DOM
const observer = new MutationObserver((mutationsList) => {
  mutationsList.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((addedNode) => {
        if (addedNode.nodeType === Node.ELEMENT_NODE && addedNode.tagName === 'DIV') {
          // DIVs inserted. Chat has continued
          updateOverride({ command: 'DISABLE' });
          observer.disconnect();
        }
      });
    }
  });
});

function handleEnterPress(e) {
  if (containsForbiddenWords(e.target.value)) {
    e.stopPropagation();
    e.preventDefault();
  }
}

function handleEscapePress() {
  if (!config.mollyguardActive) return;

  config.thisKeypressTime = new Date();

  if (config.thisKeypressTime - config.lastKeypressTime <= config.delay) {
    config.thisKeypressTime = 0;

    // Escape has been double-pressed
    updateOverride({ command: 'ENABLE' });
    observer.observe(document, { childList: true, subtree: true });
  }

  config.lastKeypressTime = config.thisKeypressTime;
}

// Event listeners
document.addEventListener('keydown', (e) => {
  if (config.overrideActive) return;

  if (e.key === 'Enter' && e.target.id === 'prompt-textarea') {
    handleEnterPress(e);
  } else if (e.key === 'Escape') {
    handleEscapePress();
  }
}, true);

// Catch both keypress & paste with mouse
document.body.addEventListener('input', debounce((e) => {
  if (e.target.id === 'prompt-textarea') {
    updateMollyGuard(e.target);
  }
}, config.delay));

// Listen for words being updated
browser.runtime.onMessage.addListener((message) => {
  if (message.command === 'updateWords') {
    updateForbiddenWords();
  }
});

// On load
updateForbiddenWords();
