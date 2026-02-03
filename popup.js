const currentEl = document.getElementById('current');
const statusEl = document.getElementById('status');
const stopBtn = document.getElementById('stop');
const activateBtn = document.getElementById('activate');
const input = document.getElementById('effectName');

let dotsInterval;
function startLoading() {
  let dots = '';
  dotsInterval = setInterval(() => {
    dots = dots.length >= 3 ? '' : dots + '.';
    statusEl.textContent = 'Обработка' + dots;
  }, 300);
}

function stopLoading(message) {
  clearInterval(dotsInterval);
  statusEl.textContent = message;
  setTimeout(() => {
    if (statusEl.textContent === message) statusEl.textContent = '';
  }, 1800);
}

function setCurrent(name) {
  currentEl.textContent = name ? name : 'Не выбран';
}

chrome.storage.local.get(['ce_effect_name'], (result) => {
  const name = result.ce_effect_name || '';
  input.value = name;
  setCurrent(name);
});

activateBtn.addEventListener('click', () => {
  const name = input.value.trim();
  if (!name) {
    stopLoading('Введите название');
    return;
  }
  startLoading();
  chrome.storage.local.set({ ce_effect_name: name }, () => {
    setTimeout(() => {
      setCurrent(name);
      stopLoading('✅ Активировано');
    }, 500);
  });
});

stopBtn.addEventListener('click', () => {
  startLoading();
  chrome.storage.local.set({ ce_effect_name: '' }, () => {
    setTimeout(() => {
      input.value = '';
      setCurrent('');
      stopLoading('✅ Остановлено');
    }, 500);
  });
});
