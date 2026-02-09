// Match-3 game engine với trái cây

// Danh sách trái cây với emoji và màu nền nhạt
export const FRUITS = [
  { id: 0, emoji: "🍎", bg: "bg-red-50 dark:bg-red-900/20", name: "Táo" },
  { id: 1, emoji: "🍊", bg: "bg-orange-50 dark:bg-orange-900/20", name: "Cam" },
  { id: 2, emoji: "🍇", bg: "bg-purple-50 dark:bg-purple-900/20", name: "Nho" },
  { id: 3, emoji: "🍋", bg: "bg-yellow-50 dark:bg-yellow-900/20", name: "Chanh" },
  { id: 4, emoji: "🍓", bg: "bg-pink-50 dark:bg-pink-900/20", name: "Dâu" },
  { id: 5, emoji: "🍉", bg: "bg-green-50 dark:bg-green-900/20", name: "Dưa hấu" },
];

// Tạo board không có match-3 ban đầu
function generateBoardWithoutMatches(size) {
  const board = [];
  
  for (let r = 0; r < size; r++) {
    board[r] = [];
    for (let c = 0; c < size; c++) {
      let fruit;
      let attempts = 0;
      const maxAttempts = 50;
      
      do {
        fruit = Math.floor(Math.random() * FRUITS.length);
        attempts++;
        
        if (attempts >= maxAttempts) break;
        
      } while (wouldCreateMatch(board, r, c, fruit));
      
      board[r][c] = fruit;
    }
  }
  
  return board;
}

// Kiểm tra nếu đặt fruit tại (r,c) sẽ tạo match-3
function wouldCreateMatch(board, r, c, fruit) {
  // Kiểm tra hàng ngang (2 ô bên trái)
  if (c >= 2 && board[r][c - 1] === fruit && board[r][c - 2] === fruit) {
    return true;
  }
  
  // Kiểm tra hàng dọc (2 ô phía trên)
  if (r >= 2 && board[r - 1][c] === fruit && board[r - 2][c] === fruit) {
    return true;
  }
  
  // Kiểm tra hàng ngang (1 trái, 1 phải)
  if (c >= 1 && c < board[0].length - 1 && 
      board[r][c - 1] === fruit && board[r][c + 1] === fruit) {
    return true;
  }
  
  // Kiểm tra hàng dọc (1 trên, 1 dưới)
  if (r >= 1 && r < board.length - 1 && 
      board[r - 1][c] === fruit && board[r + 1][c] === fruit) {
    return true;
  }
  
  return false;
}

export function createMatch3({ boardSize }) {
  const size = Math.min(boardSize, 8);
  
  return {
    size,
    board: generateBoardWithoutMatches(size),
    selected: null,
    score: 0,
    moves: 0,
  };
}

function areAdjacent(pos1, pos2) {
  const dr = Math.abs(pos1.r - pos2.r);
  const dc = Math.abs(pos1.c - pos2.c);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

function findMatches(board) {
  const size = board.length;
  const matches = [];
  
  // Tìm matches theo hàng ngang
  for (let r = 0; r < size; r++) {
    let start = 0;
    for (let c = 1; c <= size; c++) {
      if (c === size || board[r][c] !== board[r][start]) {
        const len = c - start;
        if (len >= 3) {
          for (let i = start; i < c; i++) {
            matches.push({ r, c: i });
          }
        }
        start = c;
      }
    }
  }
  
  // Tìm matches theo hàng dọc
  for (let c = 0; c < size; c++) {
    let start = 0;
    for (let r = 1; r <= size; r++) {
      if (r === size || board[r][c] !== board[start][c]) {
        const len = r - start;
        if (len >= 3) {
          for (let i = start; i < r; i++) {
            matches.push({ r: i, c });
          }
        }
        start = r;
      }
    }
  }
  
  // Loại bỏ duplicate
  const uniqueMatches = [];
  const seen = new Set();
  for (const m of matches) {
    const key = `${m.r},${m.c}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueMatches.push(m);
    }
  }
  
  return uniqueMatches;
}

function removeMatchesAndDrop(board) {
  const size = board.length;
  const matches = findMatches(board);
  
  if (matches.length === 0) return { board, matchCount: 0 };
  
  const toRemove = new Set();
  for (const m of matches) {
    toRemove.add(`${m.r},${m.c}`);
  }
  
  const newBoard = JSON.parse(JSON.stringify(board));
  
  for (let c = 0; c < size; c++) {
    const column = [];
    
    for (let r = size - 1; r >= 0; r--) {
      if (!toRemove.has(`${r},${c}`)) {
        column.push(newBoard[r][c]);
      }
    }
    
    while (column.length < size) {
      column.push(Math.floor(Math.random() * FRUITS.length));
    }
    
    for (let r = 0; r < size; r++) {
      newBoard[r][c] = column[size - 1 - r];
    }
  }
  
  return { board: newBoard, matchCount: matches.length };
}

export function stepMatch3(state, action) {
  const s = JSON.parse(JSON.stringify(state));
  
  if (action.type === "SELECT") {
    const { r, c } = action;
    
    if (!s.selected) {
      s.selected = { r, c };
      return s;
    }
    
    const prev = s.selected;
    
    if (prev.r === r && prev.c === c) {
      s.selected = null;
      return s;
    }
    
    if (!areAdjacent(prev, { r, c })) {
      s.selected = { r, c };
      return s;
    }
    
    // Swap
    const temp = s.board[prev.r][prev.c];
    s.board[prev.r][prev.c] = s.board[r][c];
    s.board[r][c] = temp;
    
    const matches = findMatches(s.board);
    
    if (matches.length === 0) {
      // Swap lại
      s.board[r][c] = s.board[prev.r][prev.c];
      s.board[prev.r][prev.c] = temp;
      s.selected = null;
      return s;
    }
    
    // Có match
    s.selected = null;
    s.moves++;
    
    let currentBoard = s.board;
    let totalMatches = 0;
    
    while (true) {
      const result = removeMatchesAndDrop(currentBoard);
      if (result.matchCount === 0) break;
      
      totalMatches += result.matchCount;
      currentBoard = result.board;
    }
    
    s.board = currentBoard;
    s.score += totalMatches * 10;
    
    return s;
  }
  
  return s;
}

export function viewMatch3({ state, r, c }) {
  const size = state.size;
  
  if (r >= size || c >= size) {
    return null;
  }
  
  const fruitId = state.board[r][c];
  const fruit = FRUITS[fruitId];
  
  const isSelected = state.selected && state.selected.r === r && state.selected.c === c;
  
  return {
    bgClass: `${fruit.bg} ${isSelected ? "ring-2 ring-blue-500" : ""}`,
    text: fruit.emoji,
    textClass: "text-2xl",
    title: `${fruit.name}${isSelected ? " (Đã chọn)" : ""}`,
    ring: isSelected,
  };
}