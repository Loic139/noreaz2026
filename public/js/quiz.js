/**
 * Noréaz 2026 — Quiz interactif
 * Gère le timer, l'affichage des questions et la soumission des réponses
 */
(function () {
    'use strict';

    const TIMER_DURATION = parseInt(document.body.dataset.timer || '10', 10);

    let currentQuestion = 0;
    let totalQuestions  = 0;
    let score           = 0;
    let timerInterval   = null;
    let timeLeft        = TIMER_DURATION;
    let answered        = false;

    // Éléments DOM
    const timerEl      = document.getElementById('timer-count');
    const timerCircle  = document.getElementById('timer-circle');
    const questionEl   = document.getElementById('question-text');
    const answersEl    = document.getElementById('answers-list');
    const progressFill = document.getElementById('progress-fill');
    const progressLbl  = document.getElementById('progress-label');
    const quizSection   = document.getElementById('quiz-section');
    const resultSection = document.getElementById('result-section');
    const scoreEl       = document.getElementById('score-value');
    const resultMsg     = document.getElementById('result-message');
    const nextBtnWrapper= document.getElementById('next-btn-wrapper');
    const nextBtn       = document.getElementById('next-btn');

    // Données injectées par PHP
    const questions = window.QUIZ_DATA || [];

    function init() {
        if (!quizSection || questions.length === 0) return;
        totalQuestions = questions.length;
        if (nextBtn) nextBtn.addEventListener('click', () => {
            if (nextBtnWrapper) nextBtnWrapper.style.display = 'none';
            const next = currentQuestion + 1;
            if (next >= totalQuestions) showResult();
            else showQuestion(next);
        });
        showQuestion(0);
    }

    function showQuestion(index) {
        if (index >= totalQuestions) {
            showResult();
            return;
        }
        currentQuestion = index;
        answered = false;

        // Retire le focus pour éviter qu'un bouton apparaisse pré-sélectionné
        if (document.activeElement) document.activeElement.blur();

        const q = questions[index];

        // Mise à jour progression
        const pct = Math.round((index / totalQuestions) * 100);
        if (progressFill) progressFill.style.width = pct + '%';
        if (progressLbl)  progressLbl.textContent  = `Question ${index + 1} / ${totalQuestions}`;

        // Texte de la question
        if (questionEl) questionEl.textContent = q.question;

        // Mélange des réponses
        const answers = shuffle([
            { text: q.correct, isCorrect: true },
            { text: q.wrong1,  isCorrect: false },
            { text: q.wrong2,  isCorrect: false },
            { text: q.wrong3,  isCorrect: false },
        ]);

        // Rendu des boutons
        if (answersEl) {
            answersEl.innerHTML = '';
            answers.forEach(answer => {
                const li  = document.createElement('li');
                const btn = document.createElement('button');
                btn.type      = 'button';
                btn.className = 'answer-btn';
                btn.textContent = answer.text;
                btn.dataset.correct = answer.isCorrect ? '1' : '0';
                btn.addEventListener('click', () => handleAnswer(btn, answer.isCorrect));
                li.appendChild(btn);
                answersEl.appendChild(li);
            });
        }

        startTimer();
    }

    function handleAnswer(btn, isCorrect) {
        if (answered) return;
        answered = true;
        stopTimer();

        // Feedback visuel
        const allBtns = answersEl.querySelectorAll('.answer-btn');
        allBtns.forEach(b => {
            b.disabled = true;
            if (b.dataset.correct === '1') b.classList.add('correct');
        });
        if (!isCorrect) btn.classList.add('wrong');

        // Flash du fond de la carte
        const card = answersEl.closest('.card');
        if (card) {
            card.classList.add(isCorrect ? 'flash-correct' : 'flash-wrong');
            setTimeout(() => card.classList.remove('flash-correct', 'flash-wrong'), 500);
        }

        if (isCorrect) {
            score++;
        }

        const isLast = currentQuestion + 1 >= totalQuestions;
        if (nextBtnWrapper) {
            nextBtnWrapper.style.display = 'block';
            if (nextBtn) nextBtn.textContent = isLast ? 'Voir le résultat →' : 'Question suivante →';
        }
    }

    function startTimer() {
        stopTimer();
        timeLeft = TIMER_DURATION;
        updateTimerDisplay();

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                stopTimer();
                if (!answered) {
                    answered = true;
                    // Temps écoulé = mauvaise réponse
                    const allBtns = answersEl.querySelectorAll('.answer-btn');
                    allBtns.forEach(b => {
                        b.disabled = true;
                        if (b.dataset.correct === '1') b.classList.add('correct');
                    });
                    const isLast = currentQuestion + 1 >= totalQuestions;
                    if (nextBtnWrapper) {
                        nextBtnWrapper.style.display = 'block';
                        if (nextBtn) nextBtn.textContent = isLast ? 'Voir le résultat →' : 'Question suivante →';
                    }
                }
            }
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function updateTimerDisplay() {
        if (timerEl) timerEl.textContent = timeLeft;
        if (timerCircle) {
            timerCircle.classList.toggle('urgent', timeLeft <= 3);
        }
    }

    function showResult() {
        stopTimer();

        if (quizSection)  quizSection.style.display  = 'none';
        if (resultSection) resultSection.style.display = 'block';
        if (scoreEl) scoreEl.textContent = score + ' / ' + totalQuestions;

        if (resultMsg) {
            if (score === totalQuestions) {
                resultMsg.textContent = 'Parfait ! Tu as tout trouvé !';
            } else if (score >= totalQuestions / 2) {
                resultMsg.textContent = 'Bien joué ! Tu en sais des choses sur les monuments !';
            } else if (score > 0) {
                resultMsg.textContent = 'Pas mal, mais tu peux faire mieux la prochaine fois !';
            } else {
                resultMsg.textContent = 'Dommage... Continue d\'explorer le district !';
            }
        }

        // Envoi du score au serveur (joueurs connectés uniquement)
        const saveUrl = document.body.dataset.saveUrl;
        const monumentId = document.body.dataset.monumentId;
        if (saveUrl && monumentId) {
            fetch(saveUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ monument_id: monumentId, score: score }),
            }).catch(() => { /* silencieux */ });
        }

        // Boutons de partage
        buildShareLinks(score, totalQuestions);
    }

    function buildShareLinks(score, total) {
        const monument = window.MONUMENT_NAME || 'un monument';
        const url      = window.SHARE_URL     || 'https://noreaz.digitme.fun';

        const text = `🏛️ J'ai trouvé ${monument} miniature caché dans le district de la Sarine `
                   + `et j'ai marqué ${score}/${total} au quiz !\n`
                   + `🎉 Viens jouer toi aussi au 28e Giron des Jeunesses Sarinoises — 24-28 juin 2026 👇`;

        const encoded    = encodeURIComponent(text);
        const encodedUrl = encodeURIComponent(url);

        const wa = document.getElementById('share-whatsapp');
        const fb = document.getElementById('share-facebook');
        const tw = document.getElementById('share-twitter');

        if (wa) wa.href = `https://wa.me/?text=${encoded}%20${encodedUrl}`;
        if (fb) fb.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encoded}`;
        if (tw) tw.href = `https://x.com/intent/tweet?text=${encoded}&url=${encodedUrl}`;
    }

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    document.addEventListener('DOMContentLoaded', init);
})();
