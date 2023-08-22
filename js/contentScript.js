/* global document browser window */

let forbiddenWords = [];

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
  const containsForbiddenWord = containsForbiddenWords(target.value);
  const sendButton = target.nextElementSibling;
  const parentDiv = target.parentElement;

  if (containsForbiddenWord) {
    sendButton.disabled = true;
    parentDiv.classList.add('forbidden-div');
  } else {
    sendButton.disabled = false;
    parentDiv.classList.remove('forbidden-div');
  }
}

function updateForbiddenWords() {
  browser.storage.local.get('words', (data) => {
    forbiddenWords = data.words || [];
  });
}

// Catch both keypresses & paste with mouse
document.body.addEventListener('input', debounce((event) => {
  if (event.target.id === 'prompt-textarea') updateUI(event.target);
}, 300));

// Catch submission via 'Enter'
document.addEventListener('keydown', (e) => {
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
