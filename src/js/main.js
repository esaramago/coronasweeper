import '/src/css/main.scss';

const Minesweeper = {

    // content
    content: {
        nextLevel: 'Next level',
        restart: 'Restart',
        hiddenCell: 'Hidden cell',
    },

    // elements
    elements: {
        grid: document.getElementById('grid'),
        restart: document.querySelector('.js-restart'),
        levelCurrent: document.querySelector('.js-level-current'),
        levelBest: document.querySelector('.js-level-best'),
        levelBestContainer: document.querySelector('.js-level-best-container'),
    },

    // constants
    minesNumber: 5,
    gridRows: 8,
    longPressTime: 400,

    // levels
    levelCurrent: 1,
    levelBest: null,

    positions: [
        { // top
            row(row) { return row - 1 },
            col(col) { return col }
        },
        { // topRight
            row(row) { return row - 1 },
            col(col) { return col + 1 }
        },
        { // right
            row(row) { return row },
            col(col) { return col + 1 }
        },
        { // rightBottom
            row(row) { return row + 1 },
            col(col) { return col + 1 }
        },
        { // bottom
            row(row) { return row + 1 },
            col(col) { return col }
        },
        { // bottomLeft
            row(row) { return row + 1 },
            col(col) { return col - 1 }
        },
        { // left
            row(row) { return row },
            col(col) { return col - 1 }
        },
        { // leftTop
            row(row) { return row - 1 },
            col(col) { return col - 1 }
        },
    ],

    init() {
        // set grid styles
        this.elements.grid.style.gridTemplateColumns = `repeat(${this.gridRows}, 1fr)`;
        this.elements.grid.style.gridTemplateRows = `repeat(${this.gridRows}, 1fr)`;

        this.start();

        // events for desktop
        this.elements.grid.addEventListener('touchstart', this.onPressCell.bind(this), {passive: true});
        this.elements.grid.addEventListener('touchend', this.onLeaveCell.bind(this), {passive: true});

        // events for mobile
        this.elements.grid.addEventListener('mousedown', this.onPressCell.bind(this));
        this.elements.grid.addEventListener('mouseup', this.onLeaveCell.bind(this));

        // on restart event
        this.elements.restart.addEventListener('click', this.onRestart.bind(this));
        
    },
    start() {
        // variables
        this.delay = null;
        this.longPress = false;
        this.isLost = false;
        this.isWon = false;
        this.revealedCells = 0;
        this.mines = [];
        this.grid = [];
        this.levelBest = localStorage.getItem('levelBest');
        this.isFirstMove = true;
        this.maxCoordinate = this.gridRows - 1;

        this.renderLevels();
        
        // add random mines
        for (let i = 0; i < this.minesNumber; i++) {
            this.addMine();
        }

        this.setGrid();
        this.renderGrid();
    },

    //#region SET
    addMine() {

        const _this = this;

        var row = _randomIntFromInterval();
        var col = _randomIntFromInterval();

        // check if is repeated
        var isRepeated = this.mines.findIndex(x => {
            return x.row == row && x.col == col
        });

        // push to array if is not repeated
        if (isRepeated < 0) {
            this.mines.push({
                row: row,
                col: col
            });
        }
        else {
            this.addMine(); // run function until mine position is not repeated
        }

        function _randomIntFromInterval() {
            return Math.floor(Math.random() * (_this.maxCoordinate - 0 + 1) + 0); // 0 == min coordinate
        }
    },
    setGrid() {

        for (let row = 0; row < this.gridRows; row++) {
            
            var cells = [];
            for (let cell = 0; cell < this.gridRows; cell++) {

                var hasMine = this.mines.findIndex(x => x.row === row && x.col === cell) > -1;
                cells.push({
                    hasMine: hasMine,
                    number: 0
                });
            }
            this.grid.push(cells);
        }
    },
    setPositions(row, col) {

        for (let i = 0; i < this.positions.length; i++) {
            const pos = this.positions[i];

            var rowPos = pos.row(row);
            var colPos = pos.col(col);

            if (this.isCellInsideGrid(rowPos, colPos)) {// check if cell is inside the grid
                this.grid[rowPos][colPos].number++;
            }
        }
    },
    //#endregion SET


    //#region RENDER
    revealCell(btn) {

        var _this = this;
        var row = parseInt(btn.dataset.row);
        var col = parseInt(btn.dataset.col);
        
        var html = '';
        var cell = this.grid[row][col];

        if (cell.hasMine) {

            // prevent to loose on first move
            if (this.isFirstMove) {

                // remove mine
                var indexOfMine = this.mines.findIndex(x => x.row === row && x.col === col);
                this.mines.splice(indexOfMine, 1);

                // change the position of the mine
                this.addMine();

                // restart
                this.grid = [];
                this.setGrid();
                this.renderGrid();

                var btn = this.elements.grid.querySelector(`[data-row="${row}"][data-col="${col}"]`)
                this.revealCell(btn);
            }
            else {
                // Lost :( !!!
                btn.classList.add('has-mine');
                html = `<svg viewBox="0 0 500 525" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linecap="round" stroke-linejoin="round"><path fill="none" d="M0 0h500v525H0z"/><path d="M169.179 89.83a184.826 184.826 0 0151.248-14.897V51.644l.002-.353c-12.226-2.041-21.556-12.674-21.556-25.469C198.873 11.571 210.449 0 224.709 0h43.109c14.26 0 25.836 11.571 25.836 25.822 0 12.795-9.33 23.428-21.556 25.469l.002.353v23.288a184.8 184.8 0 0153.809 16.084l7.41-12.827.11-.187c-5.867-4.83-7.56-13.336-3.635-20.13 4.372-7.569 14.069-10.166 21.642-5.796l22.892 13.209c7.573 4.37 10.171 14.062 5.799 21.63-3.925 6.794-12.142 9.582-19.26 6.919l-.108.189-7.486 12.959a187.382 187.382 0 0139.866 37.952l-1.22-2.112 22.803-13.158c.103-.06.207-.119.311-.177-4.398-11.744.206-25.302 11.429-31.777 12.501-7.214 28.509-2.927 35.727 9.567l21.818 37.77c7.218 12.494 2.928 28.493-9.573 35.706-11.222 6.476-25.272 3.683-33.25-5.996-.102.061-.205.121-.309.181l-22.605 13.044a184.736 184.736 0 0113.479 55.376h15.364l.216.002c1.252-7.493 7.776-13.211 15.626-13.211 8.744 0 15.843 7.095 15.843 15.834v26.419c0 8.739-7.099 15.834-15.843 15.834-7.85 0-14.374-5.719-15.626-13.211l-.216.001h-15.364a184.78 184.78 0 01-11.321 49.939l25.098 14.483c.121.069.242.14.361.211 9.319-11.306 25.73-14.568 38.838-7.004 14.602 8.425 19.612 27.113 11.182 41.707l-25.485 44.117c-8.431 14.594-27.13 19.601-41.731 11.176-13.109-7.565-18.487-23.4-13.35-37.118a33.62 33.62 0 01-.364-.207l-25.286-14.591a187.406 187.406 0 01-34.472 32.275l7.709 13.346c.037.062.072.125.108.188 7.118-2.662 15.335.125 19.26 6.92 4.372 7.568 1.774 17.26-5.799 21.629l-22.892 13.21c-7.573 4.369-17.27 1.772-21.642-5.796-3.925-6.794-2.232-15.3 3.634-20.13l-.109-.187-7.43-12.861a184.809 184.809 0 01-52.337 16.58v26.12c0 .128-.001.256-.003.383 13.249 2.211 23.361 13.735 23.361 27.601 0 15.444-12.545 27.983-27.999 27.983h-46.716c-15.454 0-28-12.539-28-27.983 0-13.866 10.112-25.39 23.361-27.601-.002-.127-.002-.255-.002-.383v-25.681a184.84 184.84 0 01-52.711-15.802l-6.727 11.644-.109.187c5.866 4.83 7.559 13.336 3.634 20.13-4.372 7.568-14.069 10.165-21.642 5.796l-22.892-13.21c-7.573-4.369-10.171-14.061-5.799-21.629 3.925-6.795 12.142-9.582 19.261-6.92.035-.063.07-.126.107-.188l6.767-11.715a187.363 187.363 0 01-38.595-36.151L77.906 388.83c-.111.064-.222.127-.334.189 4.708 12.57-.221 27.08-12.232 34.011-13.379 7.72-30.513 3.132-38.238-10.24L3.751 372.366C-3.974 358.994.617 341.87 13.996 334.15c12.012-6.931 27.049-3.941 35.587 6.418l.331-.194 23.017-13.281a184.768 184.768 0 01-12.141-52.067H48.661l-.217-.001c-1.252 7.492-7.776 13.211-15.626 13.211-8.744 0-15.843-7.095-15.843-15.834v-26.419c0-8.739 7.099-15.834 15.843-15.834 7.85 0 14.374 5.718 15.626 13.211l.217-.002H60.79a184.73 184.73 0 0113.558-55.565l-21.39-12.342-.325-.191c-8.409 10.202-23.218 13.146-35.048 6.32-13.176-7.603-17.697-24.467-10.09-37.636l22.998-39.812c7.608-13.169 24.481-17.688 37.658-10.085 11.829 6.826 16.683 21.116 12.047 33.496.109.061.219.123.328.186l22.342 12.892a187.374 187.374 0 0138.708-35.239l-6.562-11.359-.108-.189c-7.118 2.663-15.335-.125-19.26-6.919-4.372-7.568-1.774-17.26 5.799-21.63l22.892-13.209c7.573-4.37 17.27-1.773 21.642 5.796 3.925 6.794 2.232 15.3-3.634 20.13l.109.187 6.725 11.641z" fill="#00ab51"/><ellipse cx="185.545" cy="258.277" rx="41.054" ry="52.587" fill="#f1dcf1" stroke="#004e00" stroke-width="4.47"/><ellipse cx="185.545" cy="258.277" rx="18.46" ry="29.016" fill="#940c8a"/><g><ellipse cx="297.074" cy="243.416" rx="47.074" ry="60.298" fill="#cef1e0" stroke="#004e00" stroke-width="5.13"/><ellipse cx="297.074" cy="243.416" rx="21.167" ry="33.271" fill="#0082ae"/></g><path d="M385.472 303.715c0 35.138-75.228 104.722-139.21 104.722-63.981 0-136.099-80.561-136.099-115.697 27.934 23.492 72.118 73.995 136.099 73.995 63.982 0 115.466-33.247 139.21-63.02z" fill="#d0e9ae" fill-rule="nonzero" stroke="#004f00" stroke-width="6.27"/><path d="M236.209 191.058l93.012-66.007 14.927 29.838-110.038 41.886-1.941 1.631-91.839-34.959 14.926-29.837 80.953 57.448z" fill-opacity=".44"/></svg>`;
                this.isLost = true;
            }
        }
        else if (cell.number > 0) { // has number
            html = this.renderCellContent(cell.number);
        }
        else { // is empty
            
            for (let i = 0; i < this.positions.length; i++) {
                var pos = this.positions[i];
                
                var rowPos = pos.row(row);
                var colPos = pos.col(col);
                
                if (this.isCellInsideGrid(rowPos, colPos)) {// check if cell is inside the grid
                    var btnX = this.elements.grid.querySelector(`[data-row="${rowPos}"][data-col="${colPos}"]`);
                    if (btnX) {
                        var isRevealed = btnX.classList.contains('is-revealed');
                        if (!isRevealed) {
                            
                            // reveal cell
                            var cellX = this.grid[rowPos][colPos];
                            var htmlX = this.renderCellContent(cellX.number);
                            _render(btnX, htmlX);
                        }
                    }
                    
                }
            }
        }

        _render(btn, html);

        this.isFirstMove = false;
        
        function _render(btn, html) {
            // reveal cell
            btn.classList.add('is-revealed');
            btn.innerHTML = html;
            btn.disabled = true;
            _this.revealedCells++; // add one revealed cell
        }

    },
    renderCellContent(number) {
        var number = number || ''; // prevent zeros
        return `<span>${number}</span>`
    },

    renderGrid() {

        var _this = this;
        var html = '';

        for (let row = 0; row < this.grid.length; row++) {
            var rowNr = row;
            const cells = this.grid[row];

            for (let col = 0; col < cells.length; col++) {
                var colNr = col;
                const cell = cells[col];

                // set data
                if (cell.hasMine) {
                    this.setPositions(rowNr, colNr);
                }

                // render cell
                html = html + _renderCell(rowNr, colNr);

            }
        }

        function _renderCell(row, col) {
            return `
                <button class="c-cell" data-col="${col}" data-row="${row}">
                    <span class="is-visually-hidden">${_this.content.hiddenCell}</span>
                </button>`;
        }

        document.getElementById('grid').innerHTML = html;

    },

    renderLevels() {
        this.elements.levelCurrent.textContent = this.levelCurrent;
        if (this.levelBest) {
            this.elements.levelBest.textContent = this.levelBest;
            this.elements.levelBestContainer.removeAttribute('hidden');
        }
    },
    //#endregion RENDER


    //#region EVENTS
    onPressCell(e) {

        this.longPress = false;
        this.delay = setTimeout(toggleFlag.bind(this, e.target), this.longPressTime);

        function toggleFlag(btn) {
            btn.classList.toggle('has-flag');
            this.longPress = true;
        }
    },
    onLeaveCell(e) {

        // prevent tap more than one cell at the same time
        var _this = this;
        this.disableGrid();
        setTimeout(() => {
            if(!this.isLost && !this.isWon)
                _this.enableGrid();
        }, 60);

        if (!this.longPress && e.target.matches('button') && !e.target.matches('.has-flag')) {

            this.revealCell(e.target);

            if (this.isLost) {

                // GAME LOST :(

                this.elements.grid.querySelectorAll('button').forEach(e => {
                    this.revealCell(e);
                });
                
                this.disableGrid();

                this.elements.restart.textContent = this.content.restart; // set restart text
                document.body.classList.add('is-lost');

                this.levelCurrent = 1; // back to level 1
                this.minesNumber = 5; // back to level 1 difficulty
                
            }
            else {
                var totalCells = this.gridRows * this.gridRows; // get number of cells
                var notRevealedCells = totalCells - this.minesNumber - this.revealedCells;
                if (notRevealedCells === 0) {

                    // GAME WON!!!
                    this.isWon = true;
                    
                    this.disableGrid();
                    this.elements.restart.textContent = this.content.nextLevel; // set restart text
                    document.body.classList.add('is-won');

                    // save level in localstorage
                    if (this.levelCurrent > this.levelBest) {
                        this.levelBest = this.levelCurrent;
                        localStorage.setItem('levelBest', this.levelCurrent);
                    }

                    ++this.levelCurrent; // add one level
                    this.minesNumber = this.minesNumber + 2; // increase difficulty (nr of mines)

                }
            }
        }

        clearTimeout(this.delay);


    },

    onRestart() {
        
        this.elements.grid.classList.remove('is-disabled');
        this.elements.grid.innerHTML = '';

        document.body.classList.remove('is-lost');
        document.body.classList.remove('is-won');

        this.start();
    },
    //#endregion EVENTS


    //#region GENERAL
    disableGrid() {
        this.elements.grid.classList.add('is-disabled');
    },
    enableGrid() {
        this.elements.grid.classList.remove('is-disabled');
    },
    isCellInsideGrid(rowPos, colPos) {
        // check if cell with the given coordinates is inside the grid
        return rowPos > -1 & rowPos < this.gridRows && colPos > -1 && colPos < this.gridRows;
    }
    //#endregion GENERAL
}
Minesweeper.init();

// set Minesweeper global
//window.Minesweeper = Minesweeper;