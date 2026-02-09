// Match-3 game engine với trái cây

// Danh sách trái cây với emoji và màu nền nhạt
export const FRUITS = [
  { id: 0, emoji: "🍎", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", name: "Apple" },
  { id: 1, emoji: "🍊", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800", name: "Orange" },
  { id: 2, emoji: "🍇", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800", name: "Grape" },
  { id: 3, emoji: "🍋", bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-200 dark:border-yellow-800", name: "Lemon" },
  { id: 4, emoji: "🍓", bg: "bg-pink-50 dark:bg-pink-900/20", border: "border-pink-200 dark:border-pink-800", name: "Strawberry" },
  { id: 5, emoji: "🍉", bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800", name: "Watermelon" },
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
        
        // Nếu thử quá nhiều lần, chấp nhận bất kỳ fruit nào
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
  
  // Kiểm tra hàng ngang (1 bên trái, 1 bên phải)
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
  const size = Math.min(boardSize, 8); // Giới hạn 8x8
  
  return {
    size,
    board: generateBoardWithoutMatches(size),
    selected: null, // { r, c }
    score: 0,
    moves: 0,
  };
}

// Kiểm tra nếu 2 ô có thể swap (phải lân cận)
function areAdjacent(pos1, pos2) {
  const dr = Math.abs(pos1.r - pos2.r);
  const dc = Math.abs(pos1.c - pos2.c);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

// Tìm tất cả matches trên board
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

// Xóa matches và thả các ô xuống
function removeMatchesAndDrop(board) {
  const size = board.length;
  const matches = findMatches(board);
  
  if (matches.length === 0) return { board, matchCount: 0 };
  
  // Đánh dấu các ô cần xóa
  const toRemove = new Set();
  for (const m of matches) {
    toRemove.add(`${m.r},${m.c}`);
  }
  
  // Tạo board mới
  const newBoard = JSON.parse(JSON.stringify(board));
  
  // Xóa và thả xuống cho từng cột
  for (let c = 0; c < size; c++) {
    const column = [];
    
    // Lấy các ô không bị xóa
    for (let r = size - 1; r >= 0; r--) {
      if (!toRemove.has(`${r},${c}`)) {
        column.push(newBoard[r][c]);
      }
    }
    
    // Thêm các ô mới từ trên xuống
    while (column.length < size) {
      column.push(Math.floor(Math.random() * FRUITS.length));
    }
    
    // Đặt lại vào board (đảo ngược vì đã lấy từ dưới lên)
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
    
    // Nếu chưa chọn ô nào
    if (!s.selected) {
      s.selected = { r, c };
      return s;
    }
    
    // Đã chọn ô trước đó
    const prev = s.selected;
    
    // Nếu click vào cùng ô -> bỏ chọn
    if (prev.r === r && prev.c === c) {
      s.selected = null;
      return s;
    }
    
    // Nếu không lân cận -> chọn ô mới
    if (!areAdjacent(prev, { r, c })) {
      s.selected = { r, c };
      return s;
    }
    
    // Swap 2 ô
    const temp = s.board[prev.r][prev.c];
    s.board[prev.r][prev.c] = s.board[r][c];
    s.board[r][c] = temp;
    
    // Kiểm tra match
    const matches = findMatches(s.board);
    
    if (matches.length === 0) {
      // Không có match -> swap lại
      s.board[r][c] = s.board[prev.r][prev.c];
      s.board[prev.r][prev.c] = temp;
      s.selected = null;
      return s;
    }
    
    // Có match -> xử lý cascade
    s.selected = null;
    s.moves++;
    
    let currentBoard = s.board;
    let totalMatches = 0;
    
    // Xử lý cascade matches
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
  
  // Nếu ô nằm ngoài game board
  if (r >= size || c >= size) {
    return null;
  }
  
  const fruitId = state.board[r][c];
  const fruit = FRUITS[fruitId];
  
  const isSelected = state.selected && state.selected.r === r && state.selected.c === c;
  
  return {
    bgClass: `${fruit.bg} ${isSelected ? "ring-4 ring-blue-500 ring-offset-2 shadow-lg scale-110" : "shadow-sm hover:shadow-md"}`,
    text: fruit.emoji,
    textClass: "text-2xl sm:text-3xl",
    title: `${fruit.name}${isSelected ? " (Đã chọn)" : ""}`,
    ring: isSelected,
  };
}