/* global document browser window */

const wordListTextArea = document.getElementById('wordList');
const saveBtn = document.getElementById('saveBtn');

browser.storage.local.get('words').then((data) => {
  if (data.words) {
    wordListTextArea.value = data.words.join('\n');
  }
});

saveBtn.addEventListener('click', () => {
  const words = wordListTextArea.value.split('\n');
  browser.storage.local.set({ words });
  browser.runtime.sendMessage({ command: 'updateWords' });
  window.alert('Words saved!');
});
