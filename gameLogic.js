// Medieval Battle Simulator - Game Logic

// Grid configuration
const GRID_SIZE = 64;

// Game state
let gameState = {
  currentMode: 'viewing',
  selectedArmyType: null, // 'allied' or 'enemy'
  selectedUnitType: 'footsoldiers',
  battalions: [],
  isPlacingBattalion: false,
  pendingBattalion: null,
  isDragging: false,
  dragStartPos: null,
  hasDragged: false,
  placementPreview: null
};

// Calculate tile size based on screen height
function calculateTileSize() {
  return Math.floor(window.innerHeight / GRID_SIZE);
}

// Set canvas size
function resizeCanvas(canvas) {
  const tileSize = calculateTileSize();
  const canvasWidth = tileSize * GRID_SIZE;
  const canvasHeight = tileSize * GRID_SIZE;
  
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  return { tileSize, canvasWidth, canvasHeight };
}

// Draw the grid and battalions
function drawGrid(ctx, canvas, tileSize) {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Fill with base color
  ctx.fillStyle = '#4a7c4a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid lines
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  
  // Vertical lines
  for (let x = 0; x <= GRID_SIZE; x++) {
    ctx.beginPath();
    ctx.moveTo(x * tileSize, 0);
    ctx.lineTo(x * tileSize, canvas.height);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let y = 0; y <= GRID_SIZE; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * tileSize);
    ctx.lineTo(canvas.width, y * tileSize);
    ctx.stroke();
  }
  
  // Draw all battalions
  gameState.battalions.forEach(battalion => {
    battalion.draw(ctx, tileSize);
  });
}

// Get tile coordinates from mouse position
function getTileCoordinates(e, canvas, tileSize) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / tileSize);
  const y = Math.floor((e.clientY - rect.top) / tileSize);
  
  return { x, y };
}

// Check if tile is occupied
function isTileOccupied(x, y) {
  return gameState.battalions.some(b => b.x === x && b.y === y);
}

// Create battalion from current configuration
function createBattalionFromConfig() {
  return {
    type: gameState.selectedUnitType,
    armyType: gameState.selectedArmyType,
    discipline: parseInt(document.getElementById('disciplineInput').value),
    equipment: parseInt(document.getElementById('equipmentInput').value),
    range: parseInt(document.getElementById('rangeInput').value),
    morale: parseInt(document.getElementById('moraleInput').value),
    speed: parseInt(document.getElementById('speedInput').value),
    soldiers: parseInt(document.getElementById('soldiersInput').value)
  };
}

// Place battalion at specific position
function placeBattalion(x, y) {
  if (isTileOccupied(x, y)) {
    console.log('Tile already occupied!');
    return false;
  }
  
  const config = createBattalionFromConfig();
  const battalion = new Battalion({
    x: x,
    y: y,
    ...config
  });
  
  gameState.battalions.push(battalion);
  updateArmyCounts();
  console.log(`Placed ${battalion.type} battalion at (${x}, ${y})`);
  return true;
}

// Remove battalion at specific position
function removeBattalion(x, y) {
  const index = gameState.battalions.findIndex(b => b.x === x && b.y === y);
  if (index !== -1) {
    const removed = gameState.battalions.splice(index, 1)[0];
    updateArmyCounts();
    console.log(`Removed ${removed.type} battalion at (${x}, ${y})`);
    return true;
  }
  return false;
}

// Create placement preview element
function createPlacementPreview(canvas, tileSize) {
  if (gameState.placementPreview) return;
  
  const preview = document.createElement('div');
  preview.className = 'placement-preview';
  preview.style.width = tileSize + 'px';
  preview.style.height = tileSize + 'px';
  preview.style.position = 'absolute';
  preview.style.pointerEvents = 'none';
  preview.style.zIndex = '1000';
  document.body.appendChild(preview);
  gameState.placementPreview = preview;
}

// Update placement preview position
function updatePlacementPreview(x, y, tileSize, isValid = true) {
  if (!gameState.placementPreview) return;
  
  const canvas = document.getElementById('battlefield');
  const rect = canvas.getBoundingClientRect();
  
  gameState.placementPreview.style.left = (rect.left + x * tileSize) + 'px';
  gameState.placementPreview.style.top = (rect.top + y * tileSize) + 'px';
  
  // Update preview appearance based on mode and validity
  gameState.placementPreview.className = 'placement-preview';
  
  if (gameState.currentMode === 'removing') {
    gameState.placementPreview.classList.add('remove-mode');
    if (isTileOccupied(x, y)) {
      gameState.placementPreview.classList.add('remove-hover');
    }
  } else if (gameState.currentMode === 'creating') {
    gameState.placementPreview.classList.add('create-mode');
    if (isValid) {
      gameState.placementPreview.classList.add('valid');
    } else {
      gameState.placementPreview.classList.add('invalid');
    }
  } else if (gameState.currentMode === 'inspecting') {
    gameState.placementPreview.classList.add('inspect-mode');
    if (isValid) {
      gameState.placementPreview.classList.add('valid');
    }
  }
}

// Remove placement preview
function removePlacementPreview() {
  if (gameState.placementPreview) {
    gameState.placementPreview.remove();
    gameState.placementPreview = null;
  }
}

// Handle canvas click
function handleCanvasClick(e, canvas, tileSize) {
  const { x, y } = getTileCoordinates(e, canvas, tileSize);
  
  console.log(`Clicked tile: (${x}, ${y})`);
  
  // Handle remove mode
  if (gameState.currentMode === 'removing') {
    if (removeBattalion(x, y)) {
      // Battalion removed successfully
      drawGrid(canvas.getContext('2d'), canvas, tileSize);
    }
    return;
  }
  
  // Check if clicking on existing battalion
  const clickedBattalion = gameState.battalions.find(b => b.x === x && b.y === y);
  
  // Handle modal closing on empty tile clicks
  if ((gameState.currentMode === 'viewing' || gameState.currentMode === 'inspecting')) {
    if (clickedBattalion) {
      showBattalionModal(clickedBattalion);
    } else {
      // Close modal if clicking on empty tile, but only in viewing mode
      if (gameState.currentMode === 'viewing') {
        hideBattalionModal();
      }
      // In inspect mode, don't close modal on empty tile clicks
    }
    return;
  }
  
  // Handle battalion placement in create mode
  if (gameState.currentMode === 'creating' && gameState.selectedArmyType) {
    if (placeBattalion(x, y)) {
      drawGrid(canvas.getContext('2d'), canvas, tileSize);
    }
    return;
  }
  
  // Just highlight clicked tile for visualization
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
  ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
  
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
}

// Handle mouse move for hover effects and placement preview
function handleMouseMove(e, canvas, tileSize) {
  const { x, y } = getTileCoordinates(e, canvas, tileSize);
  
  // Handle placement preview for create, remove, and inspect modes
  if (gameState.currentMode === 'creating' || gameState.currentMode === 'removing' || gameState.currentMode === 'inspecting') {
    if (!gameState.placementPreview) {
      createPlacementPreview(canvas, tileSize);
    }
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      let isValid = false;
      
      if (gameState.currentMode === 'creating') {
        isValid = !isTileOccupied(x, y);
      } else if (gameState.currentMode === 'removing') {
        isValid = isTileOccupied(x, y);
      } else if (gameState.currentMode === 'inspecting') {
        isValid = isTileOccupied(x, y);
      }
      
      updatePlacementPreview(x, y, tileSize, isValid);
    }
  } else {
    // Remove placement preview when not in create/remove/inspect mode
    removePlacementPreview();
    
    // Regular hover effect for viewing mode
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      // Redraw grid to clear previous hover
      drawGrid(canvas.getContext('2d'), canvas, tileSize);
      
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }
}

// Handle mouse down for drag functionality
function handleMouseDown(e, canvas, tileSize) {
  if (gameState.currentMode !== 'creating' || !gameState.selectedArmyType) return;
  
  const { x, y } = getTileCoordinates(e, canvas, tileSize);
  
  if (!isTileOccupied(x, y)) {
    gameState.isDragging = true;
    gameState.dragStartPos = { x, y };
    gameState.hasDragged = false;
    placeBattalion(x, y);
    drawGrid(canvas.getContext('2d'), canvas, tileSize);
  }
}

// Handle mouse move for drag placement
function handleDragMove(e, canvas, tileSize) {
  if (!gameState.isDragging) return;
  
  const { x, y } = getTileCoordinates(e, canvas, tileSize);
  
  // Check if we've actually moved from the start position
  if (x !== gameState.dragStartPos.x || y !== gameState.dragStartPos.y) {
    gameState.hasDragged = true;
    
    // Only place if the tile is different from the drag start and not occupied
    if (!isTileOccupied(x, y)) {
      if (placeBattalion(x, y)) {
        drawGrid(canvas.getContext('2d'), canvas, tileSize);
      }
    }
  }
}

// Handle mouse up
function handleMouseUp() {
  gameState.isDragging = false;
  gameState.dragStartPos = null;
  gameState.hasDragged = false;
}

// Handle mouse leave to clean up
function handleMouseLeave() {
  gameState.isDragging = false;
  gameState.dragStartPos = null;
  gameState.hasDragged = false;
  removePlacementPreview();
}

// Update troop counts
function updateArmyCounts() {
  const alliedTroops = gameState.battalions
    .filter(b => b.armyType === 'allied')
    .reduce((sum, b) => sum + b.soldiers, 0);
  
  const enemyTroops = gameState.battalions
    .filter(b => b.armyType === 'enemy')
    .reduce((sum, b) => sum + b.soldiers, 0);
  
  const totalTroops = gameState.battalions
    .reduce((sum, b) => sum + b.soldiers, 0);
  
  document.getElementById('alliedTroops').textContent = alliedTroops;
  document.getElementById('enemyTroops').textContent = enemyTroops;
  document.getElementById('totalTroops').textContent = totalTroops;
}
