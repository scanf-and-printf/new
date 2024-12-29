class Tetris {
    constructor() {
        this.mainMenu = document.getElementById('main-menu');
        this.gameContainer = document.getElementById('game-container');
        this.gameBoard = document.querySelector('.game-board');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        
        // 绑定菜单按钮
        document.getElementById('back-btn').addEventListener('click', () => {
            this.gameContainer.style.display = 'none';
            this.mainMenu.style.display = 'flex';
            if (this.gameInterval) {
                clearInterval(this.gameInterval);
            }
        });

        // 初始化游戏参数
        this.boardWidth = 15;
        this.boardHeight = 25;
        this.grid = Array(this.boardHeight).fill().map(() => Array(this.boardWidth).fill(0));
        
        this.shapes = {
            I: [[1, 1, 1, 1]],
            L: [[1, 0], [1, 0], [1, 1]],
            J: [[0, 1], [0, 1], [1, 1]],
            O: [[1, 1], [1, 1]],
            Z: [[1, 1, 0], [0, 1, 1]],
            S: [[0, 1, 1], [1, 1, 0]],
            T: [[1, 1, 1], [0, 1, 0]]
        };

        this.currentPiece = null;
        this.currentPosition = { x: 0, y: 0 };
        this.score = 0;
        this.level = 1;
        this.gameInterval = null;
        this.gameSpeed = 1000;
        this.baseSpeed = 1000;
        this.speedFactor = 0.8;

        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // 添加暂停相关属性
        this.isPaused = false;
        this.pauseBtn = document.getElementById('pause-btn');
        this.pauseBtn.addEventListener('click', () => this.togglePause());

        // 添加方块颜色
        this.pieceColors = {
            I: 'piece-I',
            O: 'piece-O',
            T: 'piece-T',
            S: 'piece-S',
            Z: 'piece-Z',
            J: 'piece-J',
            L: 'piece-L'
        };

        // 记录当前方块类型
        this.currentPieceType = null;

        // 绑定教程按钮
        document.getElementById('tutorial-btn').addEventListener('click', () => {
            document.getElementById('tutorial-modal').style.display = 'block';
        });

        document.getElementById('close-tutorial').addEventListener('click', () => {
            document.getElementById('tutorial-modal').style.display = 'none';
        });

        // 暂停菜单按钮
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', () => {
            document.getElementById('pause-menu').style.display = 'none';
            this.startGame();
        });
        document.getElementById('pause-menu-back-btn').addEventListener('click', () => {
            document.getElementById('pause-menu').style.display = 'none';
            this.gameContainer.style.display = 'none';
            this.mainMenu.style.display = 'flex';
            if (this.gameInterval) {
                clearInterval(this.gameInterval);
            }
        });

        // 添加方向键按钮事件监听
        const directionBtns = document.querySelectorAll('.direction-btn');
        directionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.isPaused) return;
                
                if (btn.classList.contains('up')) {
                    this.rotatePiece();
                } else if (btn.classList.contains('down')) {
                    this.moveDown();
                } else if (btn.classList.contains('left')) {
                    if (this.canMove(this.currentPosition.x - 1, this.currentPosition.y)) {
                        this.currentPosition.x--;
                        this.drawPiece();
                    }
                } else if (btn.classList.contains('right')) {
                    if (this.canMove(this.currentPosition.x + 1, this.currentPosition.y)) {
                        this.currentPosition.x++;
                        this.drawPiece();
                    }
                } else if (btn.classList.contains('center')) {
                    this.hardDrop();
                }
            });

            // 防止按住按钮时触发浏览器的文本选择
            btn.addEventListener('mousedown', (e) => e.preventDefault());
        });

        // 添加游戏模式相关属性
        this.gameMode = 'classic';
        this.modeSettings = {
            classic: {
                baseSpeed: 1000,
                speedFactor: 0.8,
                scoreMultiplier: 1,
                autoRise: false,
                riseInterval: null,
                heightLimit: 0,
                zenFeatures: false
            },
            speed: {
                baseSpeed: 500,
                speedFactor: 0.7,
                scoreMultiplier: 2,
                autoRise: true,
                riseInterval: 10000,
                heightLimit: 3,
                zenFeatures: false
            },
            zen: {
                baseSpeed: 800,
                speedFactor: 1,
                scoreMultiplier: 0.5,
                autoRise: false,
                riseInterval: null,
                heightLimit: -1,
                zenFeatures: true,
                clearThreshold: 15  // 当方块堆到第15行时触发清除
            }
        };

        // 绑定游戏模式选择按钮
        document.querySelectorAll('.start-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.gameMode = btn.dataset.mode;
                document.getElementById('mode-select').style.display = 'none';
                this.gameContainer.style.display = 'flex';
                this.startGame();
            });
        });

        // 返回主菜单按钮
        document.getElementById('back-to-menu').addEventListener('click', () => {
            document.getElementById('mode-select').style.display = 'none';
            document.getElementById('main-menu').style.display = 'flex';
        });

        // 添加触摸滑动支持
        const modeCards = document.querySelector('.mode-cards');
        let startY;
        let scrollY;

        modeCards.addEventListener('touchstart', (e) => {
            startY = e.touches[0].pageY;
            scrollY = modeCards.scrollTop;
        }, { passive: true });

        modeCards.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            const deltaY = startY - touch.pageY;
            modeCards.scrollTop = scrollY + deltaY;
        }, { passive: true });

        // 添加自动上升相关属性
        this.autoRiseEnabled = false;
        this.riseTimer = null;

        // 添加禅模式相关属性
        this.zenModeActive = false;
        this.zenClearAnimationActive = false;

        // 添加最高分属性
        this.highScores = {
            classic: localStorage.getItem('tetris_classic_high_score') || 0,
            speed: localStorage.getItem('tetris_speed_high_score') || 0
        };

        // 显示最高分
        this.updateHighScores();

        // 绑定主菜单按钮
        document.getElementById('start-game-btn').addEventListener('click', () => {
            document.getElementById('main-menu').style.display = 'none';
            document.getElementById('mode-select').style.display = 'flex';
        });

        document.getElementById('back-to-menu').addEventListener('click', () => {
            document.getElementById('mode-select').style.display = 'none';
            document.getElementById('main-menu').style.display = 'flex';
        });

        // 绑定重置最高分按钮
        document.getElementById('resetHighScoreBtn').addEventListener('click', () => {
            document.getElementById('confirmModal').classList.remove('hidden');
        });

        document.getElementById('confirmResetBtn').addEventListener('click', () => {
            const resetClassic = document.getElementById('resetClassic').checked;
            const resetSpeed = document.getElementById('resetSpeed').checked;
            const resetModes = [];

            if (resetClassic) {
                this.highScores.classic = 0;
                localStorage.setItem('tetris_classic_high_score', '0');
                resetModes.push('经典模式');
            }
            if (resetSpeed) {
                this.highScores.speed = 0;
                localStorage.setItem('tetris_speed_high_score', '0');
                resetModes.push('极速模式');
            }

            this.updateHighScores();
            document.getElementById('confirmModal').classList.add('hidden');
            
            // 更新成功提示文本
            const successMessage = document.querySelector('.success-content p');
            successMessage.textContent = `已重置 ${resetModes.join('、')} 的最高分`;
            
            document.getElementById('successModal').classList.remove('hidden');
        });

        document.getElementById('cancelResetBtn').addEventListener('click', () => {
            document.getElementById('confirmModal').classList.add('hidden');
        });

        document.getElementById('successOkBtn').addEventListener('click', () => {
            document.getElementById('successModal').classList.add('hidden');
        });
    }

    handleKeyPress(e) {
        if (this.isPaused && e.key !== 'p') return;

        switch(e.key.toLowerCase()) { // 转换为小写以支持大小写
            case 'arrowleft':
            case 'a':
                if (this.canMove(this.currentPosition.x - 1, this.currentPosition.y)) {
                    this.currentPosition.x--;
                    this.drawPiece();
                }
                break;
            case 'arrowright':
            case 'd':
                if (this.canMove(this.currentPosition.x + 1, this.currentPosition.y)) {
                    this.currentPosition.x++;
                    this.drawPiece();
                }
                break;
            case 'arrowdown':
            case 's':
                this.moveDown();
                break;
            case 'arrowup':
            case 'w':
                this.rotatePiece();
                break;
            case ' ':
                this.hardDrop();
                break;
            case 'p':
                this.togglePause();
                break;
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            // 暂停主游戏循环
            clearInterval(this.gameInterval);
            // 暂停上升计时器
            if (this.riseTimer) {
                clearInterval(this.riseTimer);
            }
            document.getElementById('pause-menu').style.display = 'block';
            this.pauseBtn.textContent = '继续';
        } else {
            // 恢复主游戏循环
            this.gameInterval = setInterval(() => this.moveDown(), this.gameSpeed);
            // 恢复上升计时器
            const settings = this.modeSettings[this.gameMode];
            if (settings.riseInterval && this.autoRiseEnabled) {
                this.riseTimer = setInterval(() => {
                    if (!this.isPaused) {
                        this.addBottomRow();
                    }
                }, settings.riseInterval);
            }
            document.getElementById('pause-menu').style.display = 'none';
            this.pauseBtn.textContent = '暂停';
        }
    }

    spawnPiece() {
        if (this.checkTopDistance() === 0) {
            this.gameOver();
            return;
        }

        // 随机生成一个新方块
        const shapes = Object.keys(this.shapes);
        this.currentPieceType = shapes[Math.floor(Math.random() * shapes.length)];
        this.currentPiece = JSON.parse(JSON.stringify(this.shapes[this.currentPieceType]));

        // 设置新方块的初始位置
        this.currentPosition = {
            x: Math.floor((this.boardWidth - this.currentPiece[0].length) / 2),
            y: 0
        };

        // 只绘制当前方块
        this.drawPiece();
    }

    createBlock(x, y, pieceType) {
        const block = document.createElement('div');
        block.className = `block ${this.pieceColors[pieceType]}`;
        block.style.left = x * 16 + 'px';
        block.style.top = y * 16 + 'px';
        return block;
    }

    drawPiece() {
        this.clearBoard();
        
        // 首先绘制落点预览（在最底层）
        this.drawGhostPiece();
        
        // 绘制已固定的方块
        this.grid.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell && cell.type) {
                    this.gameBoard.appendChild(this.createBlock(x, y, cell.type));
                }
            });
        });
        
        // 绘制当前方块（在最上层）
        this.currentPiece.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    this.gameBoard.appendChild(
                        this.createBlock(
                            this.currentPosition.x + x,
                            this.currentPosition.y + y,
                            this.currentPieceType
                        )
                    );
                }
            });
        });
    }

    drawGhostPiece() {
        // 找到当前方块可以下落到的最低位置
        let ghostY = this.currentPosition.y;
        while (this.canMove(this.currentPosition.x, ghostY + 1)) {
            ghostY++;
        }

        // 绘制虚影方块
        this.currentPiece.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    const ghostBlock = document.createElement('div');
                    ghostBlock.className = 'block ghost-block';
                    ghostBlock.style.left = (this.currentPosition.x + x) * 16 + 'px';
                    ghostBlock.style.top = (ghostY + y) * 16 + 'px';
                    this.gameBoard.appendChild(ghostBlock);
                }
            });
        });
    }

    freezePiece() {
        this.currentPiece.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    this.grid[this.currentPosition.y + y][this.currentPosition.x + x] = {
                        type: this.currentPieceType
                    };
                }
            });
        });
        
        // 删除这部分代码，移除每次放置方块后的自动上升
        // if (this.autoRiseEnabled && this.currentPosition.y > 2) {
        //     this.addBottomRow();
        // }
    }

    startGame() {
        // 应用选择的游戏模式设置
        const settings = this.modeSettings[this.gameMode];
        this.baseSpeed = settings.baseSpeed;
        this.speedFactor = settings.speedFactor;
        this.gameSpeed = this.baseSpeed;
        this.autoRiseEnabled = settings.autoRise;

        // 重置游戏状态
        this.grid = Array(this.boardHeight).fill().map(() => Array(this.boardWidth).fill(0));
        this.score = 0;
        this.level = 1;
        this.updateScore();
        this.clearBoard();
        
        // 清除之前的上升计时器
        if (this.riseTimer) {
            clearInterval(this.riseTimer);
        }

        // 如果是极速模式，启用定时上升
        if (settings.riseInterval) {
            this.riseTimer = setInterval(() => {
                if (!this.isPaused) {
                    this.addBottomRow();
                }
            }, settings.riseInterval);
        }

        // 清除之前的状态
        this.currentPiece = null;
        this.currentPieceType = null;

        // 生成第一个方块
        this.spawnPiece();
        
        // 清除并重置游戏间隔
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
        }
        
        this.isPaused = false;
        this.gameBoard.classList.remove('paused');
        this.pauseBtn.textContent = '暂停';
        this.gameInterval = setInterval(() => this.moveDown(), this.gameSpeed);

        this.zenModeActive = settings.zenFeatures;
    }

    clearBoard() {
        while (this.gameBoard.firstChild) {
            this.gameBoard.removeChild(this.gameBoard.firstChild);
        }
    }

    moveDown() {
        if (this.isPaused || this.zenClearAnimationActive) return;
        
        if (this.canMove(this.currentPosition.x, this.currentPosition.y + 1)) {
            this.currentPosition.y++;
            this.drawPiece();
        } else {
            this.freezePiece();
            this.clearLines();
            
            // 在生成新方块前检查是否需要触发禅模式清除
            if (this.checkZenModeClear()) {
                this.zenClearAnimation();
            } else if (this.checkTopDistance() === 1) {
                // 如果顶部距离为0，直接结束游戏
                this.gameOver();
            } else {
                this.spawnPiece();
            }
        }
    }

    canMove(newX, newY) {
        return this.currentPiece.every((row, y) =>
            row.every((cell, x) =>
                !cell || (
                    newX + x >= 0 &&
                    newX + x < this.boardWidth &&
                    newY + y < this.boardHeight &&
                    !(this.grid[newY + y]?.[newX + x])
                )
            )
        );
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.boardHeight - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell)) {
                // 移除已完成的行
                this.grid.splice(y, 1);
                // 在顶部添加新的空行
                this.grid.unshift(Array(this.boardWidth).fill(0));
                linesCleared++;
                y++; // 因为删除了一行，所以需要新检查当前行
            }
        }

        if (linesCleared > 0) {
            // 更新分数
            this.score += linesCleared * 100 * (this.gameMode === 'speed' ? 2 : 1);
            
            // 检查等级提升
            const oldLevel = this.level;
            this.level = Math.floor(this.score / 1000) + 1;
            
            if (this.gameMode !== 'zen' && this.level > oldLevel) {
                this.gameSpeed = Math.max(
                    100,
                    Math.floor(this.baseSpeed * Math.pow(this.speedFactor, this.level - 1))
                );
                
                clearInterval(this.gameInterval);
                this.gameInterval = setInterval(() => this.moveDown(), this.gameSpeed);
                
                this.showLevelUpMessage();
            }
            
            this.updateScore();
        }
        
        this.spawnPiece();
    }

    showLevelUpMessage() {
        const message = document.createElement('div');
        message.className = 'level-up-message';
        message.textContent = `Level ${this.level}!`;
        this.gameBoard.appendChild(message);

        // 2秒后移除消息
        setTimeout(() => {
            if (message.parentNode === this.gameBoard) {
                this.gameBoard.removeChild(message);
            }
        }, 2000);
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
    }

    rotatePiece() {
        const rotated = this.currentPiece[0].map((_, i) =>
            this.currentPiece.map(row => row[i]).reverse()
        );
        
        const originalPiece = this.currentPiece;
        this.currentPiece = rotated;
        
        // 如果旋转后发生碰撞，则恢复原状
        if (!this.canMove(this.currentPosition.x, this.currentPosition.y)) {
            this.currentPiece = originalPiece;
        } else {
            this.drawPiece();
        }
    }

    hardDrop() {
        while (this.canMove(this.currentPosition.x, this.currentPosition.y + 1)) {
            this.currentPosition.y++;
        }
        this.drawPiece();
        this.freezePiece();
        this.clearLines();
        
        // 在生成新方块前检查顶部距离
        if (this.checkTopDistance() === 0) {
            this.gameOver();
        } else {
            this.spawnPiece();
        }
    }

    gameOver() {
        // 禅模式不会游戏结束，而是清除一半的方块
        if (this.gameMode === 'zen') {
            // 计算当前最高点
            let maxHeight = 0;
            for (let x = 0; x < this.boardWidth; x++) {
                for (let y = 0; y < this.boardHeight; y++) {
                    if (this.grid[y][x]) {
                        maxHeight = Math.max(maxHeight, this.boardHeight - y);
                        break;
                    }
                }
            }

            // 只当方块堆到顶部时才清除
            if (maxHeight >= this.boardHeight - 1) {
                this.clearHalfBlocks();
            }
            return;
        }

        clearInterval(this.gameInterval);
        
        // 更新结束界面的分数和等级
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-level').textContent = this.level;
        
        // 显示游戏结束界面，隐藏游戏界面
        const gameOverModal = document.getElementById('game-over-modal');
        gameOverModal.style.display = 'block';
        this.gameContainer.style.display = 'none';
        
        // 绑定按钮事件
        document.getElementById('restart-game-btn').addEventListener('click', () => {
            gameOverModal.style.display = 'none';
            this.gameContainer.style.display = 'flex';  // 显示游戏界面
            this.startGame();
        });
        
        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            gameOverModal.style.display = 'none';
            document.getElementById('mode-select').style.display = 'none'; // 确保模式选择也被隐藏
            this.mainMenu.style.display = 'flex';
        });

        // 清除上升定时器
        if (this.riseTimer) {
            clearInterval(this.riseTimer);
            this.riseTimer = null;
        }

        // 更新最高分
        if (this.gameMode === 'classic' && this.score > this.highScores.classic) {
            this.highScores.classic = this.score;
            localStorage.setItem('tetris_classic_high_score', this.score);
        } else if (this.gameMode === 'speed' && this.score > this.highScores.speed) {
            this.highScores.speed = this.score;
            localStorage.setItem('tetris_speed_high_score', this.score);
        }
        this.updateHighScores();
    }

    // 添加底部上升方法
    addBottomRow() {
        // 移除顶部一行
        this.grid.shift();
        
        // 在底部添加新行，随机生成缺口
        const newRow = Array(this.boardWidth).fill({ type: 'I' });
        const gaps = Math.min(4, Math.floor(Math.random() * 3) + 2); // 2-4个缺口
        
        // 生成不重复的缺口位置，确保缺口分布更均匀
        const sections = Math.floor(this.boardWidth / gaps);
        const gapPositions = new Set();
        
        for (let i = 0; i < gaps; i++) {
            const sectionStart = i * sections;
            const sectionEnd = (i === gaps - 1) ? this.boardWidth : (i + 1) * sections;
            gapPositions.add(sectionStart + Math.floor(Math.random() * (sectionEnd - sectionStart)));
        }
        
        // 在选定的位置创建缺口
        gapPositions.forEach(gap => {
            newRow[gap] = 0;
        });
        
        this.grid.push(newRow);

        // 检查并调整前方块位置
        if (this.currentPiece) {
            if (!this.canMove(this.currentPosition.x, this.currentPosition.y)) {
                // 尝试向上移动最多两格
                for (let i = 1; i <= 2; i++) {
                    if (this.canMove(this.currentPosition.x, this.currentPosition.y - i)) {
                        this.currentPosition.y -= i;
                        break;
                    }
                }
                
                // 只在堆积过高时结束游戏
                if (this.checkGameOver()) {
                    this.gameOver();
                    return;
                }
            }
        }

        this.drawPiece();
    }

    // 添加检查游戏结束的方法
    checkGameOver() {
        const settings = this.modeSettings[this.gameMode];
        
        // 禅模式永不结束
        if (settings.heightLimit === -1) return false;
        
        // 计算当前最高点的高度
        let maxHeight = 0;
        for (let x = 0; x < this.boardWidth; x++) {
            for (let y = 0; y < this.boardHeight; y++) {
                if (this.grid[y][x]) {
                    maxHeight = Math.max(maxHeight, this.boardHeight - y);
                    break;
                }
            }
        }

        // 如果超过允许的高度限制，游戏结束
        return maxHeight > (this.boardHeight - settings.heightLimit);
    }

    // 添加半场清除方法
    clearHalfBlocks() {
        const midPoint = Math.floor(this.boardHeight / 2);

        // 先克隆所有要清除的方块
        const blocks = this.gameBoard.querySelectorAll('.block');
        const blocksToAnimate = [];
        
        blocks.forEach(block => {
            const blockY = parseInt(block.style.top) / 30;
            const blockX = parseInt(block.style.left) / 30;
            
            if (blockY < midPoint) {
                // 克隆方块于动画
                const animatedBlock = block.cloneNode(true);
                animatedBlock.style.position = 'absolute';
                animatedBlock.style.left = block.style.left;
                animatedBlock.style.top = block.style.top;
                
                // 根据方块在行中的位置决定动画方向
                if (blockX < this.boardWidth / 2) {
                    animatedBlock.classList.add('break-left');
                } else {
                    animatedBlock.classList.add('break-right');
                }
                
                blocksToAnimate.push({
                    block: block,
                    animated: animatedBlock
                });
            }
        });

        // 添加动画方块并隐藏原方块
        blocksToAnimate.forEach(({block, animated}) => {
            this.gameBoard.appendChild(animated);
            block.style.display = 'none';
        });

        // 立即清除上半部分的方块数据
        for (let y = 0; y < midPoint; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                this.grid[y][x] = 0;
            }
        }

        // 等待动画完成后清理
        setTimeout(() => {
            // 移除所有动画方块
            blocksToAnimate.forEach(({animated}) => {
                if (animated.parentNode === this.gameBoard) {
                    this.gameBoard.removeChild(animated);
                }
            });

            // 重新绘制游戏板
            this.drawPiece();

            // 如果当前方块在上半部分，重新生成一个
            if (this.currentPosition.y < midPoint) {
                this.spawnPiece();
            }
        }, 800);
    }

    checkZenModeClear() {
        if (!this.zenModeActive) return false;
        
        const settings = this.modeSettings[this.gameMode];
        let maxHeight = 0;
        
        // 计算当前最高点
        for (let x = 0; x < this.boardWidth; x++) {
            for (let y = 0; y < this.boardHeight; y++) {
                if (this.grid[y][x]) {
                    maxHeight = Math.max(maxHeight, this.boardHeight - y);
                    break;
                }
            }
        }

        // 如果超过阈值，触发清除
        return maxHeight >= settings.clearThreshold;
    }

    zenClearAnimation() {
        this.zenClearAnimationActive = true;
        const midPoint = Math.floor(this.boardHeight / 2);
        
        // 收集所有需要动画的方块
        const blocks = this.gameBoard.querySelectorAll('.block');
        const blocksToAnimate = [];
        
        blocks.forEach(block => {
            const blockY = parseInt(block.style.top) / 16;
            if (blockY < midPoint) {
                const blockX = parseInt(block.style.left) / 16;
                const animatedBlock = block.cloneNode(true);
                animatedBlock.style.position = 'absolute';
                animatedBlock.style.left = block.style.left;
                animatedBlock.style.top = block.style.top;
                
                if (blockX < this.boardWidth / 2) {
                    animatedBlock.classList.add('break-left');
                } else {
                    animatedBlock.classList.add('break-right');
                }
                
                blocksToAnimate.push({
                    block: block,
                    animated: animatedBlock
                });
            }
        });

        // 添加动画方块并隐藏原方块
        blocksToAnimate.forEach(({block, animated}) => {
            this.gameBoard.appendChild(animated);
            block.style.display = 'none';
        });

        // 清除上半部分的方块
        for (let y = 0; y < midPoint; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                this.grid[y][x] = 0;
            }
        }

        // 修改消息内容
        const message = document.createElement('div');
        message.className = 'zen-message';
        message.textContent = '你获得了智慧之神的帮助';
        this.gameBoard.appendChild(message);

        // 延长等待时间到2秒
        setTimeout(() => {
            // 移除动画方块和消息
            blocksToAnimate.forEach(({animated}) => {
                if (animated.parentNode === this.gameBoard) {
                    this.gameBoard.removeChild(animated);
                }
            });
            
            if (message.parentNode === this.gameBoard) {
                this.gameBoard.removeChild(message);
            }

            // 重新绘制并生成新方块
            this.drawPiece();
            this.spawnPiece();
            this.zenClearAnimationActive = false;
        }, 2000);
    }

    // 添加新方法检查顶部距离
    checkTopDistance() {
        // 从上往下遍历每一行
        for (let y = 0; y < this.boardHeight; y++) {
            // 检查这一行是否有方块
            if (this.grid[y].some(cell => cell !== 0)) {
                // 返回最上方方块到顶部的距离
                return y;
            }
        }
        // 如果没有方块，返回最大距离
        return this.boardHeight;
    }

    // 添加更新最高分的方法
    updateHighScores() {
        document.getElementById('classicHighScore').textContent = this.highScores.classic;
        document.getElementById('speedHighScore').textContent = this.highScores.speed;
    }
}

// 初始化游戏
new Tetris(); 