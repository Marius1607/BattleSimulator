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
  placementPreview: null,
  selectedBattalion: null,
  selectedBattalions: [],
  movementRange: []
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
  
  // Draw grid lines
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  
  for (let i = 0; i <= GRID_SIZE; i++) {
    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(i * tileSize, 0);
    ctx.lineTo(i * tileSize, canvas.height);
    ctx.stroke();
    
    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(0, i * tileSize);
    ctx.lineTo(canvas.width, i * tileSize);
    ctx.stroke();
  }
  
  // Draw movement range first (under battalions)
  drawMovementRange(ctx, tileSize);
  
  // Draw battalions
  gameState.battalions.forEach(battalion => {
    battalion.draw(ctx, tileSize);
  });
  
  // Highlight selected battalions
  gameState.selectedBattalions.forEach((battalion, index) => {
    ctx.strokeStyle = index === 0 ? '#ffff00' : '#ffa500'; // Yellow for primary, orange for others
    ctx.lineWidth = 3;
    ctx.strokeRect(
      battalion.x * tileSize + 2,
      battalion.y * tileSize + 2,
      tileSize - 4,
      tileSize - 4
    );
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

// Move battalion to new position
function moveBattalion(battalion, newX, newY) {
  const oldX = battalion.x;
  const oldY = battalion.y;
  
  // Update battalion position
  battalion.x = newX;
  battalion.y = newY;
  
  console.log(`Moved ${battalion.type} battalion from (${oldX}, ${oldY}) to (${newX}, ${newY})`);
  
  // Redraw battlefield
  const canvas = document.getElementById('battlefield');
  const tileSize = calculateTileSize();
  drawGrid(canvas.getContext('2d'), canvas, tileSize);
}

// Move multiple battalions maintaining relative positions
function moveMultipleBattalions(battalions, targetX, targetY) {
  console.log(`Moving ${battalions.length} battalions to target (${targetX}, ${targetY})`);
  
  // Calculate the offset from the first selected battalion to target
  const firstBattalion = battalions[0];
  const deltaX = targetX - firstBattalion.x;
  const deltaY = targetY - firstBattalion.y;
  
  // Move each battalion by the same offset to maintain formation
  battalions.forEach((battalion, index) => {
    const oldX = battalion.x;
    const oldY = battalion.y;
    const newX = oldX + deltaX;
    const newY = oldY + deltaY;
    
    // Check if new position is within bounds and not occupied
    if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE && !isTileOccupied(newX, newY)) {
      battalion.x = newX;
      battalion.y = newY;
      console.log(`Moved ${battalion.type} battalion from (${oldX}, ${oldY}) to (${newX}, ${newY})`);
    } else {
      console.log(`Could not move ${battalion.type} battalion to (${newX}, ${newY}) - blocked or out of bounds`);
    }
  });
  
  // Redraw battlefield
  const canvas = document.getElementById('battlefield');
  const tileSize = calculateTileSize();
  drawGrid(canvas.getContext('2d'), canvas, tileSize);
}

// Calculate formation positions for multiple battalions
function calculateFormationPositions(count, centerX, centerY) {
  const positions = [];
  
  const radius = Math.ceil(Math.sqrt(count) / 2);
  
  // Place first battalion at center
  positions.push({ x: centerX, y: centerY });
  
  // Place remaining battalions in a circle around center
  for (let i = 1; i < count; i++) {
    const angle = (2 * Math.PI * i) / (count - 1);
    const x = Math.round(centerX + radius * Math.cos(angle));
    const y = Math.round(centerY + radius * Math.sin(angle));
    
    // Ensure within bounds
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      positions.push({ x, y });
    } else {
      // Fallback: place in a line from center
      const offsetX = i % 2 === 0 ? Math.floor(i / 2) : -Math.floor((i + 1) / 2);
      const fallbackX = Math.max(0, Math.min(GRID_SIZE - 1, centerX + offsetX));
      positions.push({ x: fallbackX, y: centerY });
    }
  }
  
  return positions;
}

// Create formation preview for multi-selection drag
function createFormationPreview(canvas, tileSize, mouseX, mouseY) {
  if (gameState.selectedBattalions.length === 0) return;
  
  const positions = calculateFormationPositions(
    gameState.selectedBattalions.length, 
    mouseX, 
    mouseY
  );
  
  gameState.placementPreview = [];
  
  positions.forEach(pos => {
    const preview = document.createElement('div');
    preview.className = 'placement-preview formation-preview';
    preview.style.width = tileSize + 'px';
    preview.style.height = tileSize + 'px';
    preview.style.position = 'absolute';
    preview.style.pointerEvents = 'none';
    preview.style.background = 'rgba(255, 165, 0, 0.3)'; // Orange for formation
    preview.style.border = '2px solid rgba(255, 165, 0, 0.8)';
    
    const rect = canvas.getBoundingClientRect();
    preview.style.left = (rect.left + pos.x * tileSize) + 'px';
    preview.style.top = (rect.top + pos.y * tileSize) + 'px';
    
    document.body.appendChild(preview);
    gameState.placementPreview.push(preview);
  });
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
      if (e.ctrlKey || e.metaKey) {
        // Multi-selection mode - select/deselect battalions of same type
        const existingIndex = gameState.selectedBattalions.findIndex(b => 
          b.x === clickedBattalion.x && b.y === clickedBattalion.y
        );
        
        if (existingIndex !== -1) {
          // Deselect if already selected
          gameState.selectedBattalions.splice(existingIndex, 1);
        } else {
          // Check if same type as first selected battalion
          if (gameState.selectedBattalions.length === 0 || 
              gameState.selectedBattalions[0].type === clickedBattalion.type) {
            gameState.selectedBattalions.push(clickedBattalion);
          }
        }
        
        // Update single selection for movement range (use first selected)
        gameState.selectedBattalion = gameState.selectedBattalions.length > 0 ? 
          gameState.selectedBattalions[0] : null;
        gameState.movementRange = gameState.selectedBattalion ? 
          calculateMovementRange(gameState.selectedBattalion, true, gameState.selectedBattalions) : [];
        
      } else {
        // Single selection mode
        gameState.selectedBattalion = null;
        gameState.selectedBattalions = [];
        gameState.movementRange = [];
        
        // Show modal in inspect mode
        if (gameState.currentMode === 'inspecting') {
          showBattalionModal(clickedBattalion);
        } else {
          // In viewing mode, show movement range
          gameState.selectedBattalion = clickedBattalion;
          gameState.selectedBattalions = [clickedBattalion];
          gameState.movementRange = calculateMovementRange(clickedBattalion, false, null);
        }
      }
    } else {
      // Check if clicking on movement range tile
      if (gameState.selectedBattalion && gameState.movementRange.length > 0) {
        const isInMovementRange = gameState.movementRange.some(pos => pos.x === x && pos.y === y);
        if (isInMovementRange) {
          // Move all selected battalions (if multiple selected)
          if (gameState.selectedBattalions.length > 1) {
            moveMultipleBattalions(gameState.selectedBattalions, x, y);
          } else {
            // Move single battalion
            moveBattalion(gameState.selectedBattalion, x, y);
          }
          
          // Clear selection
          gameState.selectedBattalion = null;
          gameState.selectedBattalions = [];
          gameState.movementRange = [];
        } else {
          // Clear selection and movement range
          gameState.selectedBattalion = null;
          gameState.selectedBattalions = [];
          gameState.movementRange = [];
          
          // Close modal if clicking on empty tile, but only in viewing mode
          if (gameState.currentMode === 'viewing') {
            hideBattalionModal();
          }
        }
      } else {
        // Clear selection and movement range
        gameState.selectedBattalion = null;
        gameState.selectedBattalions = [];
        gameState.movementRange = [];
        
        // Close modal if clicking on empty tile, but only in viewing mode
        if (gameState.currentMode === 'viewing') {
          hideBattalionModal();
        }
        // In inspect mode, don't close modal on empty tile clicks
      }
    }
    // Redraw canvas to show/hide movement range
    const canvas = document.getElementById('battlefield');
    const tileSize = calculateTileSize();
    drawGrid(canvas.getContext('2d'), canvas, tileSize);
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

// Handle mouse down
function handleMouseDown(e, canvas, tileSize) {
  const { x, y } = getTileCoordinates(e, canvas, tileSize);
  
  // Handle multi-selection drag
  if ((e.ctrlKey || e.metaKey) && (gameState.currentMode === 'viewing' || gameState.currentMode === 'inspecting')) {
    const clickedBattalion = gameState.battalions.find(b => b.x === x && b.y === y);
    
    if (clickedBattalion) {
      // Start drag selection ONLY if clicking on selected battalion
      const isSelected = gameState.selectedBattalions.some(b => 
        b.x === clickedBattalion.x && b.y === clickedBattalion.y
      );
      
      if (isSelected) {
        gameState.isDragging = true;
        gameState.dragStartPos = { x, y };
        gameState.hasDragged = false;
        e.preventDefault(); // Prevent default behavior
        return;
      }
    }
    return; // Don't proceed with other logic in multi-select mode
  }
  
  // Only start dragging in create mode for placement
  if (gameState.currentMode !== 'creating') return;
  
  gameState.isDragging = true;
  gameState.dragStartPos = { x, y };
  gameState.hasDragged = false;
  
  // Place battalion at drag start position
  if (placeBattalion(x, y)) {
    drawGrid(canvas.getContext('2d'), canvas, tileSize);
  }
}

// Handle mouse move for drag placement
function handleDragMove(e, canvas, tileSize) {
  if (!gameState.isDragging) return;
  
  const { x, y } = getTileCoordinates(e, canvas, tileSize);
  
  // Handle multi-selection drag
  if ((e.ctrlKey || e.metaKey) && gameState.selectedBattalions.length > 0) {
    // Show preview of formation at mouse position
    removePlacementPreview();
    createFormationPreview(canvas, tileSize, x, y);
    return;
  }
  
  // Don't place on same tile as drag start
  if (x === gameState.dragStartPos.x && y === gameState.dragStartPos.y) return;
  
  // Place battalion if tile is different and not occupied
  if (placeBattalion(x, y)) {
    drawGrid(canvas.getContext('2d'), canvas, tileSize);
  }
}

// Handle mouse up
function handleMouseUp(e) {
  // Handle multi-selection drag completion
  if ((e.ctrlKey || e.metaKey) && gameState.selectedBattalions.length > 0 && gameState.isDragging) {
    // Get current mouse position for target
    const canvas = document.getElementById('battlefield');
    const rect = canvas.getBoundingClientRect();
    const tileSize = calculateTileSize();
    
    // Find the tile under the mouse
    const mouseX = Math.floor((e.clientX - rect.left) / tileSize);
    const mouseY = Math.floor((e.clientY - rect.top) / tileSize);
    
    // Move selected battalions to formation
    moveMultipleBattalions(gameState.selectedBattalions, mouseX, mouseY);
    
    // Clear preview
    removePlacementPreview();
  }
  
  gameState.isDragging = false;
  gameState.dragStartPos = null;
  gameState.hasDragged = false;
}

// Handle mouse leave to clean up
function handleMouseLeave(e) {
  gameState.isDragging = false;
  gameState.dragStartPos = null;
  gameState.hasDragged = false;
  removePlacementPreview();
}

// Calculate movement range for a battalion or group of battalions
function calculateMovementRange(battalion, isCtrlHeld = false, selectedBattalions = null) {
  const range = [];
  const speed = battalion.speed;
  const startX = battalion.x;
  const startY = battalion.y;
  
  if (isCtrlHeld && selectedBattalions && selectedBattalions.length > 1) {
    // Multi-battalion movement: check if entire group can move to each position
    const directions = [
      { dx: 0, dy: -1 },  // Up
      { dx: 0, dy: 1 },   // Down
      { dx: -1, dy: 0 },  // Left
      { dx: 1, dy: 0 }    // Right
    ];
    
    for (const dir of directions) {
      for (let dist = 1; dist <= speed; dist++) {
        const targetX = startX + dir.dx * dist;
        const targetY = startY + dir.dy * dist;
        
        // Check if target position is within bounds
        if (targetX >= 0 && targetX < GRID_SIZE && targetY >= 0 && targetY < GRID_SIZE) {
          // Check if entire group can move to this position
          const deltaX = targetX - startX;
          const deltaY = targetY - startY;
          let canMoveAll = true;
          
          for (const otherBattalion of selectedBattalions) {
            const newX = otherBattalion.x + deltaX;
            const newY = otherBattalion.y + deltaY;
            
            if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE || 
                isTileOccupied(newX, newY)) {
              canMoveAll = false;
              break;
            }
          }
          
          if (canMoveAll) {
            range.push({ x: targetX, y: targetY });
          } else {
            // Stop in this direction if group can't move further
            break;
          }
        }
      }
    }
  } else if (isCtrlHeld) {
    // Single battalion with Ctrl: restricted movement
    const directions = [
      { dx: 0, dy: -1 },  // Up
      { dx: 0, dy: 1 },   // Down
      { dx: -1, dy: 0 },  // Left
      { dx: 1, dy: 0 }    // Right
    ];
    
    for (const dir of directions) {
      for (let dist = 1; dist <= speed; dist++) {
        const x = startX + dir.dx * dist;
        const y = startY + dir.dy * dist;
        
        // Check if within grid bounds
        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
          // Check if tile is not occupied
          if (!isTileOccupied(x, y)) {
            range.push({ x, y });
          } else {
            // Stop in this direction if blocked
            break;
          }
        }
      }
    }
  } else {
    // Normal movement: all directions including diagonal
    for (let dx = -speed; dx <= speed; dx++) {
      for (let dy = -speed; dy <= speed; dy++) {
        const distance = Math.abs(dx) + Math.abs(dy); // Manhattan distance
        if (distance <= speed && distance > 0) { // Don't include current position
          const x = startX + dx;
          const y = startY + dy;
          
          // Check if within grid bounds
          if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
            // Check if tile is not occupied
            if (!isTileOccupied(x, y)) {
              range.push({ x, y });
            }
          }
        }
      }
    }
  }
  
  return range;
}

// Draw movement range on canvas
function drawMovementRange(ctx, tileSize) {
  if (gameState.movementRange.length === 0) return;
  
  ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
  ctx.lineWidth = 2;
  
  gameState.movementRange.forEach(pos => {
    ctx.fillRect(pos.x * tileSize, pos.y * tileSize, tileSize, tileSize);
    ctx.strokeRect(pos.x * tileSize, pos.y * tileSize, tileSize, tileSize);
  });
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
