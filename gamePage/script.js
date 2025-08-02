document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const timerDisplay = document.getElementById('timer');
    const gameGrid = document.getElementById('game-grid');
    const scoreDisplay = document.getElementById('score');
    const movesDisplay = document.getElementById('moves');
    const messageDisplay = document.getElementById('message');
    const gameOverModal = document.getElementById('game-over-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalScore = document.getElementById('modal-score');
    const modalMoves = document.getElementById('modal-moves');
    const modalTime = document.getElementById('modal-time');
    const modalMainMenu = document.getElementById('modal-main-menu');
    const backButton = document.getElementById('back-button');
    const trophyButton = document.getElementById('trophy-button');
    const scoresModal = document.getElementById('scores-modal');
    const modalHighScore = document.getElementById('modal-high-score');
    const previousScoresList = document.getElementById('previous-scores-list');
    const closeScores = document.getElementById('close-scores');
    const resetScores = document.getElementById('reset-scores');

    let time = 0;
    let timerInterval;
    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let moves = 0;
    let score = 0;
    let isBoardLocked = false;
    let isRevealing = false;
    let consecutiveMatches = 0;
    let lastMatchTime = 0;
    let wrongMoves = 0;
    let basePoints = [];
    let maxTime = 0;
    let maxMoves = 0;
    let remainingTime = 0;
    let remainingMoves = 0;
    let isTimerPaused = false;
    let hasUserInteracted = false;

    const settings = JSON.parse(localStorage.getItem('gameSettings')) || {
        sound: true,
        volume: 96,
        theme: 'fruits',
        magicTimer: 15,
        specialCards: 'classic',
        gameMode: 'classic'
    };

    console.log('Game settings loaded:', settings);

    document.addEventListener('click', () => {
        if (!hasUserInteracted) {
            hasUserInteracted = true;
            console.log('User interaction detected, audio unlocked');
            showMessage('Audio enabled! Enjoy the game sounds.');
        }
    }, { once: true });

    const urlParams = new URLSearchParams(window.location.search);
    const level = urlParams.get('level') || '4x4';
    if (settings.gameMode === 'timed') {
        const [rows, cols] = level.split('x').map(Number);
        maxTime = rows * cols <= 16 ? 60 : rows * cols <= 36 ? 90 : 120;
        remainingTime = maxTime;
    } else if (settings.gameMode === 'limited-moves') {
        const [rows, cols] = level.split('x').map(Number);
        maxMoves = (rows * cols / 2) + 5;
        remainingMoves = maxMoves;
        console.log('Initialized limited-moves mode:', { maxMoves, remainingMoves });
    }

    window.addEventListener('spamCardExploded', () => {
        isBoardLocked = false;
        console.log('Board unlocked after spam card explosion');
    });

    try {
        initializeGame(level);
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showMessage('Error initializing game. Please try again.');
    }

    backButton.addEventListener('click', () => {
        window.location.href = '../index.html';
    });

    trophyButton.addEventListener('click', () => {
        modalHighScore.textContent = `High Score: ${scoreManager.getHighScore(level)}`;
        const recentScores = scoreManager.getRecentScores(level);
        previousScoresList.innerHTML = '';
        recentScores.reverse().forEach(s => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="score">${s.score}</span><span class="date">${new Date(s.timestamp).toLocaleString()}</span>`;
            previousScoresList.appendChild(li);
        });
        scoresModal.style.display = 'flex';
    });

    closeScores.addEventListener('click', () => {
        scoresModal.style.display = 'none';
    });

    resetScores.addEventListener('click', () => {
        scoreManager.resetScores(level);
        modalHighScore.textContent = `High Score: 0`;
        previousScoresList.innerHTML = '';
        showMessage('Scores reset!');
    });

    function startTimer() {
        clearInterval(timerInterval);
        if (settings.gameMode === 'timed') {
            time = maxTime;
            timerDisplay.textContent = `Time Left: ${time} seconds`;
            timerInterval = setInterval(() => {
                if (!isTimerPaused) {
                    time--;
                    remainingTime = time;
                    timerDisplay.textContent = `Time Left: ${time} seconds`;
                    if (time <= 0) {
                        clearInterval(timerInterval);
                        showGameOver(true);
                    }
                }
            }, 1000);
        } else {
            time = 0;
            timerDisplay.textContent = `Time: ${time} seconds`;
            timerInterval = setInterval(() => {
                if (!isTimerPaused) {
                    time++;
                    timerDisplay.textContent = `Time: ${time} seconds`;
                }
            }, 1000);
        }
    }

    function pauseTimer(duration) {
        if (settings.gameMode === 'timed') {
            isTimerPaused = true;
            setTimeout(() => {
                isTimerPaused = false;
            }, duration);
        }
    }

    function updateScore(isMatch, isMagic = false) {
        let points = 0;

        if (isMatch) {
            const now = Date.now();
            if (now - lastMatchTime < 3000) {
                consecutiveMatches++;
            } else {
                consecutiveMatches = 0;
            }
            lastMatchTime = now;

            points = isMagic ? 20 : (consecutiveMatches >= 1 ? 15 : 10);
            basePoints.push(points);

            let message = `Match! +${points} points`;
            if (consecutiveMatches >= 1 && !isMagic) message += ` (Consecutive Bonus!)`;
            if (isMagic) message += ` (Magic Card!)`;
            showMessage(message);

            score = scoreManager.updateScore(score, points);
            console.log('Score updated:', { score, points, isMatch, isMagic });
        } else {
            consecutiveMatches = 0;
        }

        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${score}`;
        } else {
            console.error('scoreDisplay element not found');
        }
    }

    function updateMoves() {
        if (settings.gameMode === 'limited-moves') {
            remainingMoves--;
            console.log('Updating moves:', { remainingMoves });
            if (movesDisplay) {
                movesDisplay.textContent = `Moves Left: ${remainingMoves}`;
            } else {
                console.error('movesDisplay element not found');
            }
            if (remainingMoves <= 0) {
                clearInterval(timerInterval);
                showGameOver(true);
            }
        } else {
            moves++;
            if (movesDisplay) {
                movesDisplay.textContent = `Moves: ${moves}`;
            } else {
                console.error('movesDisplay element not found');
            }
        }
    }

    function initializeGame(level) {
        const [rows, cols] = level.split('x').map(Number);
        const totalCards = rows * cols;
        const pairs = totalCards / 2;

        const gameBoardRect = gameBoard.getBoundingClientRect();
        const containerWidth = gameBoardRect.width - 40;
        const containerHeight = gameBoardRect.height - 40;
        const cardWidth = Math.floor(containerWidth / cols) - 10;
        const cardHeight = Math.floor(containerHeight / rows) - 10;
        const cardSize = Math.min(cardWidth, cardHeight);

        gameGrid.style.gridTemplateColumns = `repeat(${cols}, ${cardSize}px)`;
        gameGrid.style.gridTemplateRows = `repeat(${rows}, ${cardSize}px)`;
        gameGrid.style.gap = '10px';
        gameGrid.innerHTML = '';

        let availableImages = Array.from({ length: 16 }, (_, i) => `../images/${i + 1}.png`);
        let selectedImages = shuffleArray(availableImages).slice(0, pairs);
        let gameImages = selectedImages.flatMap(img => [img, img]);
        gameImages = shuffleArray(gameImages);

        specialCards.resetSpecialCards();
        specialCards.totalMagicCards = settings.specialCards === 'magic' ? specialCards.calculateMagicCardsCount(level) : 0;
        specialCards.totalSpamCards = settings.specialCards === 'spam' ? specialCards.calculateSpamCardsCount(level) : 0;
        console.log('Special cards initialized:', {
            totalMagicCards: specialCards.totalMagicCards,
            totalSpamCards: specialCards.totalSpamCards
        });
        wrongMoves = 0;

        cards = [];
        matchedPairs = 0;
        moves = 0;
        score = 0;
        basePoints = [];
        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${score}`;
        }
        if (settings.gameMode === 'limited-moves') {
            if (movesDisplay) {
                movesDisplay.textContent = `Moves Left: ${remainingMoves}`;
            }
        } else {
            if (movesDisplay) {
                movesDisplay.textContent = `Moves: ${moves}`;
            }
        }

        consecutiveMatches = 0;
        lastMatchTime = 0;

        for (let i = 0; i < totalCards; i++) {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.width = `${cardSize}px`;
            card.style.height = `${cardSize}px`;
            card.dataset.image = gameImages[i];
            card.addEventListener('click', flipCard);
            gameGrid.appendChild(card);
            cards.push(card);
        }

        let availableCards = shuffleArray([...cards]);
        if (settings.specialCards === 'magic') {
            specialCards.availableMagicCards = availableCards.filter(c => !c.classList.contains('matched') && !c.classList.contains('flipped')).slice(0, specialCards.totalMagicCards * 2);
            availableCards = availableCards.filter(c => !specialCards.availableMagicCards.includes(c));
            console.log('Magic cards assigned:', {
                count: specialCards.availableMagicCards.length,
                images: specialCards.availableMagicCards.map(c => c.dataset.image)
            });
        }
        if (settings.specialCards === 'spam') {
            specialCards.availableSpamCards = availableCards.slice(0, specialCards.totalSpamCards);
            console.log('Spam cards assigned:', specialCards.availableSpamCards.length);
        }

        isRevealing = true;
        cards.forEach(card => {
            card.style.backgroundImage = `url(${card.dataset.image})`;
        });
        setTimeout(() => {
            cards.forEach(card => {
                card.style.backgroundImage = `url('/Memory-Card-Game/images/back.png')`;
            });
            isRevealing = false;
            startTimer();
            showMessage('Click anywhere to enable sounds!');
            if (settings.specialCards === 'spam') {
                console.log('Scheduling first spam card');
                setTimeout(() => specialCards.addSpamCard(cards, level, showMessage, playSound), 10000);
            } else if (settings.specialCards === 'magic') {
                console.log('Scheduling first magic card after', settings.magicTimer, 'seconds');
                setTimeout(() => specialCards.revealNextMagicCard(cards, showMessage, settings.magicTimer), settings.magicTimer * 1000);
            }
        }, 3000);
    }

    function flipCard() {
        if (isRevealing || isBoardLocked || flippedCards.length >= 2 || this.classList.contains('flipped') || this.classList.contains('matched') || this.classList.contains('disabled')) {
            return;
        }

        playSound('flip');
        this.classList.add('click-effect');
        setTimeout(() => this.classList.remove('click-effect'), 300);

        if (this.classList.contains('spam-card')) {
            isBoardLocked = true;
            this.style.backgroundImage = `url('/Memory-Card-Game/images/spam.png')`;
            specialCards.applySpamEffect(this, cards, showMessage, playSound, matchedPairs, level);
            if (flippedCards.length === 1) {
                console.log('Keeping flipped card after spam card:', flippedCards[0].dataset.image);
            } else {
                flippedCards = [];
            }
            return;
        }

        this.style.backgroundImage = `url(${this.dataset.image})`;
        this.classList.add('flipped');
        flippedCards.push(this);

        if (flippedCards.length === 2) {
            isBoardLocked = true;
            updateMoves();
            setTimeout(checkMatch, 1000);
        }
    }

    function checkMatch() {
        if (flippedCards.length !== 2) {
            isBoardLocked = false;
            return;
        }

        const [card1, card2] = flippedCards;
        if (card1.dataset.image === card2.dataset.image) {
            card1.style.border = '2px solid #10B981';
            card2.style.border = '2px solid #10B981';
            playSound('match');

            let points = 0;
            const magicType = specialCards.magicAssignments[card1.dataset.image];
            if (magicType) {
                points = specialCards.applyMagicEffect(card1, cards, updateScore, showMessage, pauseTimer);
            } else {
                points = updateScore(true, false);
            }

            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;

            if (settings.specialCards === 'magic' && specialCards.magicCardCounter < specialCards.totalMagicCards) {
                console.log('Scheduling next magic card after match');
                setTimeout(() => specialCards.revealNextMagicCard(cards, showMessage, settings.magicTimer), 1000);
            }

            if (matchedPairs === cards.length / 2) {
                clearInterval(timerInterval);
                showGameOver(false);
            }
        } else {
            wrongMoves++;
            card1.style.border = '2px solid #EF4444';
            card2.style.border = '2px solid #EF4444';
            playSound('fail');

            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                card1.style.backgroundImage = `url('/Memory-Card-Game/images/back.png')`;
                card2.style.backgroundImage = `url('/Memory-Card-Game/images/back.png')`;
                card1.style.border = '2px solid rgba(31, 41, 55, 0.4)';
                card2.style.border = '2px solid rgba(31, 41, 55, 0.4)';
            }, 500);

            updateScore(false);
        }
        flippedCards = [];
        isBoardLocked = false;
    }

    function showGameOver(isLoss = false) {
        const isHighScore = scoreManager.saveScore(level, score);
        const modalData = scoreManager.prepareModalData(score, remainingMoves || moves, time, isHighScore, settings);

        if (isLoss) {
            console.log('Game Over triggered, attempting to play lose sound');
            playSound('lose');
            showMessage('Game Over! You ran out of time or moves!');
            modalTitle.textContent = 'Game Over!';
        } else {
            console.log('Game Won, attempting to play celebration sound');
            playSound('celebration');
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            showMessage(`Final Score: ${score}`);
            modalTitle.textContent = modalData.title;
        }

        modalScore.textContent = modalData.scoreText;
        modalMoves.textContent = modalData.movesText;
        modalTime.textContent = modalData.timeText;

        gameOverModal.style.display = 'flex';

        modalMainMenu.onclick = () => {
            gameOverModal.style.display = 'none';
            window.location.href = '../index.html';
        };
    }

    function showMessage(message) {
        messageDisplay.textContent = message;
        setTimeout(() => {
            messageDisplay.textContent = '';
        }, 3000);
    }

    function playSound(type) {
        console.log(`Attempting to play sound: ${type}, sound: ${settings.sound}, volume: ${settings.volume}, interacted: ${hasUserInteracted}`);
        if (!settings.sound) {
            console.warn(`Sound disabled in settings for type: ${type}`);
            showMessage('Sounds are disabled. Enable in settings.');
            return;
        }
        if (settings.volume === 0) {
            console.warn(`Volume is set to 0 for type: ${type}`);
            showMessage('Volume is muted. Increase in settings.');
            return;
        }
        if (!hasUserInteracted) {
            console.warn(`Cannot play sound "${type}" because user has not interacted yet (Autoplay Policy)`);
            showMessage('Click anywhere to enable sounds!');
            return;
        }

        let soundUrls = {};
        if (type === 'flip') {
            soundUrls.primary = 'https://www.soundjay.com/buttons/button-10.mp3';
            soundUrls.fallback = 'https://cdn.pixabay.com/audio/2022/03/10/audio_948a50a891.mp3';
        } else if (type === 'match') {
            soundUrls.primary = 'https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3';
            soundUrls.fallback = 'https://www.soundjay.com/buttons/beep-07.mp3';
        } else if (type === 'fail') {
            soundUrls.primary = 'https://www.soundjay.com/buttons/beep-03.mp3';
            soundUrls.fallback = 'https://cdn.pixabay.com/audio/2022/03/10/audio_f6f343d8f0.mp3';
        } else if (type === 'celebration') {
            soundUrls.primary = 'https://www.soundjay.com/human/applause-01.mp3';
            soundUrls.fallback = 'https://cdn.pixabay.com/audio/2022/03/10/audio_7a38f3a3f0.mp3';
        } else if (type === 'spam') {
            soundUrls.primary = 'https://assets.mixkit.co/sfx/preview/mixkit-explosion-hit-1704.mp3';
            soundUrls.fallback = 'https://www.soundjay.com/effects/explosion-02.mp3';
        } else if (type === 'lose') {
            soundUrls.primary = 'https://assets.mixkit.co/sfx/preview/mixkit-negative-tone-interface-2971.mp3';
            soundUrls.fallback = 'https://www.soundjay.com/buttons/beep-02.mp3';
        }

        if (!soundUrls.primary) {
            console.warn(`No sound URL defined for type: ${type}`);
            return;
        }

        const tryPlaySound = (url, isFallback = false) => {
            console.log(`Playing sound "${type}"${isFallback ? ' (fallback)' : ''}: ${url}`);
            const audio = new Audio(url);
            // Adjust volume for specific sounds
            if (type === 'flip') {
                audio.volume = 0.02* settings.volume / 100; // Very low volume for flip
            } else if (type === 'lose') {
                audio.volume = 0.4 * settings.volume / 100; // Lower volume for lose
            } else {
                audio.volume = settings.volume / 100; // Default volume for other sounds
            }

            // For lose sound, play twice to extend duration
            if (type === 'lose') {
                audio.play().then(() => {
                    setTimeout(() => {
                        const secondAudio = new Audio(url);
                        secondAudio.volume = audio.volume;
                        secondAudio.play().catch(error => {
                            console.error(`Failed to play second instance of sound "${type}": ${error.message}. URL: ${url}`);
                        });
                    }, audio.duration * 1000); // Play second time after first ends
                }).catch(error => {
                    console.error(`Failed to play sound "${type}"${isFallback ? ' (fallback)' : ''}: ${error.message}. URL: ${url}. Check for network issues, CORS, or Autoplay restrictions.`);
                    if (!isFallback && soundUrls.fallback) {
                        console.log(`Attempting fallback sound for "${type}": ${soundUrls.fallback}`);
                        tryPlaySound(soundUrls.fallback, true);
                    } else {
                        showMessage(`Failed to play ${type} sound. Check console for details.`);
                    }
                });
            } else {
                audio.play().catch(error => {
                    console.error(`Failed to play sound "${type}"${isFallback ? ' (fallback)' : ''}: ${error.message}. URL: ${url}. Check for network issues, CORS, or Autoplay restrictions.`);
                    if (!isFallback && soundUrls.fallback) {
                        console.log(`Attempting fallback sound for "${type}": ${soundUrls.fallback}`);
                        tryPlaySound(soundUrls.fallback, true);
                    } else {
                        showMessage(`Failed to play ${type} sound. Check console for details.`);
                    }
                });
            }
        };

        tryPlaySound(soundUrls.primary);
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
});