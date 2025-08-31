function createNotification(text, theme) {
            const container = document.getElementById('notification-container');
            const notificationId = 'notif-' + Date.now();
            const notification = document.createElement('div');
            notification.id = notificationId;

            let borderColor, iconColor, iconSvg;
            if (theme === 'yellow') {
                borderColor = 'border-yellow-500';
                iconColor = 'text-yellow-400';
                iconSvg = `<svg class="w-5 h-5 ${iconColor}" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
            }

            notification.className = `notification bg-gray-800 border ${borderColor} text-white text-sm font-semibold py-3 px-6 rounded-full shadow-lg opacity-0 transform -translate-y-5`;
            notification.innerHTML = `<div class="flex items-center space-x-3">${iconSvg}<span>${text}</span></div>`;
            
            container.appendChild(notification);

            setTimeout(() => {
                const el = document.getElementById(notificationId);
                if (el) el.classList.remove('opacity-0', '-translate-y-5');
            }, 10);

            setTimeout(() => {
                const el = document.getElementById(notificationId);
                if (el) {
                    el.classList.add('opacity-0', 'translate-y-5');
                    setTimeout(() => el.remove(), 400);
                }
            }, 4000);
        }

        document.getElementById('downloadBtn').addEventListener('click', () => createNotification('Coming Soon', 'yellow'));
        document.getElementById('docsBtn').addEventListener('click', () => createNotification('On the way!', 'yellow'));

        // --- Interactive CLI Game Logic ---
        const cliOutput = document.getElementById('cli-output');
        const cliInput = document.getElementById('cli-input');
        const cliSendBtn = document.getElementById('cli-send');
        let gameCount = 0;
        let isGameLocked = false;
        let currentPrompt = null;
        let gameState = null;

        function addMessage(sender, text) {
            const p = document.createElement('p');
            p.className = 'mb-2 whitespace-pre-wrap';
            let prefix = '';
            if (sender === 'User') {
                p.style.color = '#93C5FD';
                prefix = '<span class="text-green-400">you@kriko</span>:<span class="text-blue-400">~</span>$ ';
            } else if (sender === 'AI') {
                p.style.color = '#6EE7B7';
                prefix = '<span class="text-red-400">kriko-ai@root</span>:<span class="text-blue-400">~</span># ';
            } else {
                 p.style.color = '#9CA3AF';
            }
            p.innerHTML = prefix + text;
            cliOutput.appendChild(p);
            cliOutput.scrollTop = cliOutput.scrollHeight;
        }

        function handleInput() {
            const message = cliInput.value.trim();
            if (message && !isGameLocked) {
                addMessage("User", message);
                cliInput.value = "";
                if (currentPrompt) {
                    const num = parseInt(message);
                    if (!isNaN(num) && currentPrompt.validOptions.includes(num)) {
                        currentPrompt.resolve(num);
                        currentPrompt = null;
                    } else {
                        addMessage("AI", "Invalid input! Please choose from: " + currentPrompt.validOptions.join(", "));
                    }
                }
            }
        }

        cliSendBtn.addEventListener("click", handleInput);
        cliInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") handleInput();
        });

        function inputValidation(validOptions) {
            return new Promise(resolve => {
                currentPrompt = { validOptions, resolve };
            });
        }
        
        function pToss() {
            return new Promise(resolve => {
                addMessage("AI", "Type '1' to bat first or '2' to bowl first");
                currentPrompt = {
                    validOptions: [1, 2],
                    resolve: choice => resolve(choice === 1 ? ["Batting", "Bowling"] : ["Bowling", "Batting"])
                };
            });
        }

        function cToss() {
            let computerChoice = Math.random() < 0.5 ? "Batting" : "Bowling";
            return [computerChoice === "Batting" ? "Bowling" : "Batting", computerChoice];
        }

        function getAIMove(data, isBatting = true) {
            if (data.length > 3) {
                const movesCount = new Array(7).fill(0);
                data.forEach(move => movesCount[move]++);
                if (isBatting) {
                    let mostFrequent = 1;
                    for (let i = 2; i <= 6; i++) {
                        if (movesCount[i] > movesCount[mostFrequent]) mostFrequent = i;
                    }
                    const safeMoves = [1, 2, 3, 4, 5, 6].filter(m => m !== mostFrequent);
                    return safeMoves[Math.floor(Math.random() * safeMoves.length)];
                } else {
                    let maxCount = movesCount[1];
                    let mostFrequent = 1;
                    for (let i = 2; i <= 6; i++) {
                        if (movesCount[i] > maxCount) {
                            maxCount = movesCount[i];
                            mostFrequent = i;
                        }
                    }
                    return mostFrequent;
                }
            }
            return Math.floor(Math.random() * 6) + 1;
        }

        async function playHacricko() {
            if (gameCount >= 2) {
                isGameLocked = true;
                addMessage("AI", "Game limit reached! Please download the extension to continue playing.");
                cliSendBtn.disabled = true;
                cliInput.disabled = true;
                return;
            }

            addMessage("AI", "Kriko AI Playground v1.0.0\n---Menu---\n1. To start new game\n2. See previous Scores (coming soon)\n3. Exit");
            let menuChoice = await inputValidation([1, 2, 3]);

            if (menuChoice === 1) {
                gameCount++;
                addMessage("AI", "Coach 🧢: Type '1' if you want to call the toss or '2' if you want the computer to call.");
                let gameChoice = await inputValidation([1, 2]);

                let playerDecision, computerDecision;
                if (gameChoice === 1) {
                    [playerDecision, computerDecision] = await pToss();
                } else {
                    [computerDecision, playerDecision] = cToss();
                    addMessage("AI", `Computer chose to ${computerDecision}`);
                }

                addMessage("AI", "Coach 🧢: For how many wickets do you want to play?\nChoose between 1 to 5 wickets.");
                let wickets = await inputValidation([1, 2, 3, 4, 5]);

                gameState = { playerScore: [], computerScore: [], playerWickets: 0, compWickets: 0, playerRuns: 0, compRuns: 0, playerMoves: [], computerMoves: [], wickets, playerDecision, computerDecision };
                gameState.phase = playerDecision === "Batting" ? "playerBatting" : "computerBatting";
                
                addMessage("System", `Game Start! You are ${playerDecision}.`);
                playNextMove();

            } else if (menuChoice === 2) {
                addMessage("AI", "Feature to view previous scores is not implemented yet.");
                setTimeout(playHacricko, 1000);
            } else {
                addMessage("System", "Exiting the program. Goodbye!");
            }
        }

        async function playNextMove() {
            if (!gameState) return;

            const { wickets, phase, playerMoves } = gameState;

            if (phase === "playerBatting" && gameState.playerWickets < wickets) {
                addMessage("AI", `Your turn to Bat! (Wickets: ${gameState.playerWickets}/${wickets}, Score: ${gameState.playerRuns})`);
                let player = await inputValidation([1, 2, 3, 4, 5, 6]);
                playerMoves.push(player);
                let computer = getAIMove(playerMoves, false);
                addMessage("System", `You played: ${player}, AI played: ${computer}`);

                if (player === computer) {
                    addMessage("System", "OUT!");
                    gameState.playerWickets++;
                } else {
                    gameState.playerRuns += player;
                }
                
                if (gameState.playerWickets === wickets) {
                    gameState.phase = "computerBatting";
                    addMessage("System", `Innings over! Your final score: ${gameState.playerRuns}/${gameState.playerWickets}. AI needs ${gameState.playerRuns + 1} to win.`);
                }
            } else if (phase === "computerBatting" && gameState.compWickets < wickets && gameState.compRuns <= gameState.playerRuns) {
                 addMessage("AI", `Your turn to Bowl! (AI Wickets: ${gameState.compWickets}/${wickets}, AI Score: ${gameState.compRuns}, Target: ${gameState.playerRuns + 1})`);
                let player = await inputValidation([1, 2, 3, 4, 5, 6]);
                playerMoves.push(player);
                let computer = getAIMove(playerMoves, true);
                addMessage("System", `You bowled: ${player}, AI played: ${computer}`);

                if (player === computer) {
                    addMessage("System", "OUT!");
                    gameState.compWickets++;
                } else {
                    gameState.compRuns += computer;
                }
            } else {
                endGame();
                return;
            }
            
            if(gameState.compRuns > gameState.playerRuns) {
                addMessage("System", "Computer Won!");
                addMessage("AI", "coach 🧢: Better luck next time champ!");
                endGame();
                return;
            }
            if(gameState.compWickets === wickets && gameState.compRuns < gameState.playerRuns) {
                addMessage("System", "You Won!");
                addMessage("AI", "coach 🧢: Good game champ!");
                endGame();
                return;
            }
            if(gameState.compWickets === wickets && gameState.compRuns === gameState.playerRuns) {
                 addMessage("System", "It's a TIE!");
                 endGame();
                 return;
            }

            playNextMove();
        }

        function endGame() {
            addMessage("System", `--Final Stats--\nPlayer: ${gameState.playerRuns}/${gameState.playerWickets}\nComputer: ${gameState.compRuns}/${gameState.compWickets}`);
            gameState = null;
            setTimeout(playHacricko, 2000);
        }

        playHacricko();