document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('start-button');
  const levelModal = document.getElementById('level-modal');
  const closeModalButton = document.getElementById('close-modal');
  const levelButtons = document.querySelectorAll('.level-button');
  const howToPlayButton = document.getElementById('how-to-play');
  const howToPlayModal = document.getElementById('how-to-play-modal');
  const closeHowToPlayModal = document.getElementById('close-how-to-play-modal');

  startButton.addEventListener('click', () => {
    levelModal.style.display = 'flex';
  });

  levelButtons.forEach(button => {
    button.addEventListener('click', () => {
      const level = button.dataset.level;
      window.location.href = `../gamePage/index.html?level=${level}`;
    });
  });

  closeModalButton.addEventListener('click', () => {
    levelModal.style.display = 'none';
  });

  howToPlayButton.addEventListener('click', () => {
    howToPlayModal.style.display = 'flex';
  });

  closeHowToPlayModal.addEventListener('click', () => {
    howToPlayModal.style.display = 'none';
  });
});