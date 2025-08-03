document.addEventListener('DOMContentLoaded', () => {
  const settingsButton = document.getElementById('settings-button');
  const settingsModal = document.getElementById('settings-modal');
  const saveSettingsButton = document.getElementById('save-settings');
  const closeSettingsModalButton = document.getElementById('close-settings-modal');
  const soundToggle = document.getElementById('sound-toggle');
  const volumeSlider = document.getElementById('volume-slider');
  const themeSelect = document.getElementById('theme-select');
  const magicTimerSelect = document.getElementById('magic-timer-select');
  const specialCardsRadios = document.querySelectorAll('input[name="special-cards"]');
  const gameModeRadios = document.querySelectorAll('input[name="game-mode"]');

  if (!settingsButton) console.error('settings-button not found');
  if (!settingsModal) console.error('settings-modal not found');
  if (!soundToggle) console.error('sound-toggle not found');
  if (!specialCardsRadios) console.error('special-cards not found');

  const savedSettings = JSON.parse(localStorage.getItem('gameSettings')) || {
    sound: true,
    volume: 30,
    theme: 'fruits',
    magicTimer: 15,
    specialCards: 'classic', // Default to classic
    gameMode: 'classic'
  };

  if (soundToggle) soundToggle.checked = savedSettings.sound;
  if (volumeSlider) volumeSlider.value = savedSettings.volume;
  if (themeSelect) themeSelect.value = savedSettings.theme;
  if (magicTimerSelect) magicTimerSelect.value = savedSettings.magicTimer;
  if (specialCardsRadios.length > 0) {
    const selectedSpecial = document.querySelector(`input[name="special-cards"][value="${savedSettings.specialCards}"]`);
    if (selectedSpecial) selectedSpecial.checked = true;
  }
  if (gameModeRadios.length > 0) {
    const selectedMode = document.querySelector(`input[name="game-mode"][value="${savedSettings.gameMode}"]`);
    if (selectedMode) selectedMode.checked = true;
  }

  if (settingsButton) {
    settingsButton.addEventListener('click', () => {
      if (settingsModal) {
        settingsModal.style.display = 'flex';
        console.log('Settings modal opened');
      } else {
        console.error('Settings modal not found when clicking settings button');
      }
    });
  }

  if (saveSettingsButton) {
    saveSettingsButton.addEventListener('click', () => {
      if (!soundToggle || !volumeSlider || !themeSelect || !magicTimerSelect || !specialCardsRadios) {
        console.error('One or more settings elements are missing');
        return;
      }
      const settings = {
        sound: soundToggle.checked,
        volume: parseInt(volumeSlider.value),
        theme: themeSelect.value,
        magicTimer: parseInt(magicTimerSelect.value),
        specialCards: document.querySelector('input[name="special-cards"]:checked')?.value || 'classic',
        gameMode: document.querySelector('input[name="game-mode"]:checked')?.value || 'classic'
      };
      localStorage.setItem('gameSettings', JSON.stringify(settings));
      settingsModal.style.display = 'none'; // إغلاق الـ modal بعد الحفظ
      console.log('Settings saved and modal closed:', settings);
    });
  }

  if (closeSettingsModalButton) {
    closeSettingsModalButton.addEventListener('click', () => {
      if (settingsModal) settingsModal.style.display = 'none';
      console.log('Settings modal closed');
    });
  }
});