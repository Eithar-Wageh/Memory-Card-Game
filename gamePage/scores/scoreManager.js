const scoreManager = {
    updateScore(currentScore, points) {
        return currentScore + points;
    },

    saveScore(level, score) {
        const highScoreKey = `highScore_${level}`;
        const scoresKey = `gameScores_${level}`;
        const currentHighScore = parseInt(localStorage.getItem(highScoreKey) || '0');
        const isHighScore = score > currentHighScore;

        // Save high score
        if (isHighScore) {
            localStorage.setItem(highScoreKey, score);
        }

        // Save recent scores
        let scores = JSON.parse(localStorage.getItem(scoresKey) || '[]');
        scores.push({ score, timestamp: new Date().toISOString() });
        if (scores.length > 5) {
            scores.shift();
        }
        localStorage.setItem(scoresKey, JSON.stringify(scores));

        return isHighScore;
    },

    getHighScore(level) {
        const highScoreKey = `highScore_${level}`;
        return parseInt(localStorage.getItem(highScoreKey) || '0');
    },

    getRecentScores(level) {
        const scoresKey = `gameScores_${level}`;
        return JSON.parse(localStorage.getItem(scoresKey) || '[]');
    },

    resetScores(level) {
        const highScoreKey = `highScore_${level}`;
        const scoresKey = `gameScores_${level}`;
        localStorage.removeItem(highScoreKey);
        localStorage.removeItem(scoresKey);
    },

    prepareModalData(score, moves, time, isHighScore, settings) {
        return {
            title: isHighScore ? 'New High Score!' : 'Congratulations!',
            scoreText: `${isHighScore ? 'High Score' : 'Score'}: ${score}`,
            movesText: settings.gameMode === 'limited-moves' ? `Moves Left: ${moves}` : `Moves: ${moves}`,
            timeText: settings.gameMode === 'timed' ? `Time Left: ${time} seconds` : `Time: ${time} seconds`
        };
    }
};