const specialCards = {
    availableMagicCards: [],
    availableSpamCards: [],
    spamCards: [],
    totalMagicCards: 0,
    totalSpamCards: 0,
    magicAssignments: {},
    magicTimerInterval: null,
    isMagicActive: false,
    magicCardCounter: 0,

    resetSpecialCards() {
        this.availableMagicCards = [];
        this.availableSpamCards = [];
        this.spamCards = [];
        this.totalMagicCards = 0;
        this.totalSpamCards = 0;
        this.magicAssignments = {};
        this.isMagicActive = false;
        this.magicCardCounter = 0;
        if (this.magicTimerInterval) {
            clearInterval(this.magicTimerInterval);
            this.magicTimerInterval = null;
        }
        console.log('Special cards reset');
    },

    calculateMagicCardsCount(level) {
        if (level === '4x4') return 2;
        if (level === '6x6') return 4;
        if (level === '8x8') return 6;
        return 0;
    },

    calculateSpamCardsCount(level) {
        if (level === '4x4') return 1;
        if (level === '6x6') return 2;
        if (level === '8x8') return 3;
        return 0;
    },

    revealNextMagicCard(cards, showMessage, magicTimer) {
        console.log('revealNextMagicCard called', {
            availableMagicCards: this.availableMagicCards.length,
            totalMagicCards: this.totalMagicCards,
            magicCardCounter: this.magicCardCounter,
            spamCards: this.spamCards.length,
            isMagicActive: this.isMagicActive
        });

        if (this.availableMagicCards.length === 0 || this.magicCardCounter >= this.totalMagicCards || this.spamCards.length > 0 || this.isMagicActive) {
            console.log('Magic card not revealed due to conditions');
            return;
        }

        const card = this.availableMagicCards.find(c => !c.classList.contains('spam-card') && !c.classList.contains('matched') && !c.classList.contains('flipped') && c.offsetParent !== null);
        if (!card) {
            console.log('No valid magic card found');
            return;
        }

        console.log('Magic card selected:', {
            image: card.dataset.image,
            isVisible: card.offsetParent !== null,
            classes: card.classList.toString(),
            position: card.getBoundingClientRect()
        });

        this.availableMagicCards = this.availableMagicCards.filter(c => c !== card);
        this.magicCardCounter++;
        this.isMagicActive = true;

        const magicTypes = ['double-points', 'reveal-all', 'freeze-time'];
        const randomMagicType = magicTypes[Math.floor(Math.random() * magicTypes.length)];
        this.magicAssignments[card.dataset.image] = randomMagicType;

        card.classList.add('magic-card');
        card.style.visibility = 'visible';
        card.style.opacity = '1';
        card.style.zIndex = '10';
        console.log('Magic card class added, visibility set');

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        card.appendChild(progressBar);
        console.log('Progress bar added to magic card', {
            progressBar: progressBar,
            parent: progressBar.parentElement.dataset.image,
            isVisible: progressBar.offsetParent !== null
        });

        let progress = 100;
        const duration = 7000;
        const interval = 100;
        const decrement = (interval / duration) * 100;

        const matchingCard = cards.find(c => c !== card && c.dataset.image === card.dataset.image && !c.classList.contains('matched') && !c.classList.contains('spam-card'));
        console.log('Matching card:', matchingCard ? {
            image: matchingCard.dataset.image,
            isVisible: matchingCard.offsetParent !== null
        } : 'None');

        setTimeout(() => {
            if (matchingCard && !matchingCard.classList.contains('flipped') && !matchingCard.classList.contains('matched') && card.classList.contains('magic-card')) {
                matchingCard.classList.add('shake');
                console.log('Matching card shaking');
            }
        }, 2000);

        const updateProgress = () => {
            progress -= decrement;
            progressBar.style.setProperty('--progress', `${progress}%`);
            console.log('Progress bar updated:', progress);
            if (progress <= 0) {
                clearInterval(timer);
                card.classList.remove('magic-card');
                progressBar.remove();
                if (matchingCard) matchingCard.classList.remove('shake');
                delete this.magicAssignments[card.dataset.image];
                this.isMagicActive = false;
                console.log('Magic card expired');
                if (this.magicCardCounter < this.totalMagicCards) {
                    console.log('Scheduling next magic card');
                    setTimeout(() => this.revealNextMagicCard(cards, showMessage, magicTimer), magicTimer * 1000);
                }
            }
        };

        const timer = setInterval(updateProgress, interval);
        showMessage(`Magic Card appeared! Effect: ${randomMagicType.replace('-', ' ')}`);
        console.log('Magic card revealed with effect:', randomMagicType);
    },

    applyMagicEffect(card, cards, updateScore, showMessage, pauseTimer) {
        const magicType = this.magicAssignments[card.dataset.image];
        let points = 0;

        console.log('Applying magic effect:', magicType);

        if (magicType === 'double-points') {
            points = updateScore(true, true);
            showMessage('Magic Match! 20 points awarded!');
        } else if (magicType === 'reveal-all') {
            cards.forEach(c => {
                if (!c.classList.contains('matched') && !c.classList.contains('flipped')) {
                    c.style.backgroundImage = `url(${c.dataset.image})`;
                    setTimeout(() => {
                        if (!c.classList.contains('matched')) {
                            c.style.backgroundImage = `url('../images/back.png')`;
                        }
                    }, 2000);
                }
            });
            points = updateScore(true, true);
            showMessage('Magic Match! All cards revealed for 2 seconds!');
        } else if (magicType === 'freeze-time') {
            points = updateScore(true, true);
            showMessage('Magic Match! Time frozen for 5 seconds!');
            pauseTimer(5000);
        }

        card.classList.add('vibrate');
        setTimeout(() => card.classList.remove('vibrate'), 500);

        const matchingCard = cards.find(c => c !== card && c.dataset.image === card.dataset.image);
        if (matchingCard) matchingCard.classList.remove('shake');

        this.isMagicActive = false;
        console.log(`Magic effect applied: ${magicType}`);
        return points;
    },

    addSpamCard(cards, level, showMessage, playSound) {
        if (this.availableSpamCards.length === 0 || this.spamCards.length >= this.totalSpamCards || this.isMagicActive) {
            console.log('Spam card not added due to conditions');
            return;
        }

        const card = this.availableSpamCards.find(c => !c.classList.contains('magic-card') && !c.classList.contains('matched'));
        if (!card) {
            console.log('No valid spam card found');
            return;
        }

        this.availableSpamCards = this.availableSpamCards.filter(c => c !== card);
        card.dataset.originalImage = card.dataset.image;
        card.classList.add('spam-card');

        this.spamCards.push(card);
        showMessage('A card is hiding a bomb! Be careful!');
        console.log('Spam card added');
    },

    applySpamEffect(card, cards, showMessage, playSound, matchedPairs, level) {
        card.style.backgroundImage = `url('../images/spam.png')`;
        const bomb = document.createElement('div');
        bomb.className = 'bomb';
        bomb.innerHTML = `
            <svg viewBox="0 0 24 24" class="bomb-icon">
                <path fill="#000" d="M12 2a2 2 0 0 0-2 2v2a6 6 0 0 0-6 6 6 6 0 0 0 6 6 6 6 0 0 0 6-6 6 6 0 0 0-6-6V4a2 2 0 0 0-2-2zm0 2a1 1 0 0 1 1 1v1h1a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5h1V5a1 1 0 0 1 1-1zm-2.5 3.5-1 1 2.5 2.5 4-4-1-1-3 3z"/>
                <path fill="#ff6f61" d="M12 8a4 4 0 0 0-4 4 4 4 0 0 0 4 4 4 4 0 0 0 4-4 4 4 0 0 0-4-4z"/>
            </svg>
            <span class="countdown">3</span>
        `;
        card.appendChild(bomb);

        const countdown = bomb.querySelector('.countdown');
        let count = 3;

        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdown.textContent = count;
            } else {
                clearInterval(countdownInterval);
                card.classList.add('explode');
                playSound('spam');

                setTimeout(() => {
                    card.classList.remove('explode');
                    card.classList.remove('spam-card');
                    bomb.remove();
                    card.dataset.image = card.dataset.originalImage;
                    delete card.dataset.originalImage;
                    card.style.backgroundImage = `url('../images/back.png')`;

                    const effect = matchedPairs >= 2 && Math.random() < 0.5 ? 'flip' : 'shuffle';
                    if (effect === 'flip') {
                        cards.forEach(c => {
                            if (c.classList.contains('matched')) {
                                c.classList.remove('matched');
                                c.classList.remove('flipped');
                                c.style.backgroundImage = `url('../images/back.png')`;
                                c.style.border = '2px solid rgba(31, 41, 55, 0.4)';
                            }
                        });
                        matchedPairs = 0;
                        showMessage('Spam Card reset all matched cards!');
                    } else {
                        const unmatchedCards = cards.filter(c => !c.classList.contains('matched') && !c.classList.contains('flipped'));
                        unmatchedCards.forEach(c => {
                            c.classList.add('shuffle-fly');
                            c.dataset.initialPosition = JSON.stringify(c.getBoundingClientRect());
                        });

                        const images = unmatchedCards.map(c => c.dataset.image);
                        this.shuffleArray(images);

                        const positions = unmatchedCards.map(c => c.getBoundingClientRect());
                        this.shuffleArray(positions);

                        unmatchedCards.forEach((c, i) => {
                            c.dataset.image = images[i];
                            const targetPos = positions[i];
                            const initialPos = JSON.parse(c.dataset.initialPosition);
                            c.style.setProperty('--translate-x', `${targetPos.left - initialPos.left}px`);
                            c.style.setProperty('--translate-y', `${targetPos.top - initialPos.top}px`);
                            c.style.setProperty('--rotate', `${(Math.random() - 0.5) * 30}deg`);
                        });

                        setTimeout(() => {
                            unmatchedCards.forEach(c => {
                                c.classList.remove('shuffle-fly');
                                c.style.transform = '';
                                delete c.dataset.initialPosition;
                                if (!c.classList.contains('flipped') && !c.classList.contains('matched')) {
                                    c.style.backgroundImage = `url('../images/back.png')`;
                                }
                            });
                            showMessage('Spam Card shuffled the board!');
                        }, 3000);
                    }

                    this.spamCards = this.spamCards.filter(c => c !== card);

                    window.dispatchEvent(new Event('spamCardExploded'));

                    if (this.spamCards.length < this.calculateSpamCardsCount(level)) {
                        setTimeout(() => this.addSpamCard(cards, level, showMessage, playSound), 10000);
                    }
                }, 1000);
            }
        }, 1000);
    },

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
};