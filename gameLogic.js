// Medieval Battle Simulator - Game Logic

// ==================== CONFIGURATION ====================
const GRID_SIZE = 64;

// ==================== GAME STATE ====================
let gameState = {
  // Mode and selection
  currentMode: 'viewing',
  selectedArmyType: null,
  selectedUnitType: 'footsoldiers',
  
  // Battalion data
  battalions: [],
  selectedBattalion: null,
  selectedBattalions: [],
  movementRange: [],
  
  // Interaction states
  isPlacingBattalion: false,
  pendingBattalion: null,
  isDragging: false,
  dragStartPos: null,
  hasDragged: false,
  placementPreview: null,
  
  // Game modes
  battleMode: false
};

// ==================== CANVAS MANAGEMENT ====================

/**
 * Calculate tile size based on screen height
 * @returns {number} - Size of each tile in pixels
 */
function calculateTileSize() {
  return Math.floor(window.innerHeight / GRID_SIZE);
}

/**
 * Set canvas size and return dimensions
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @returns {Object} - tileSize, canvasWidth, canvasHeight
 */
function resizeCanvas(canvas) {
  const tileSize = calculateTileSize();
  const canvasWidth = tileSize * GRID_SIZE;
  const canvasHeight = tileSize * GRID_SIZE;
  
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  return { tileSize, canvasWidth, canvasHeight };
}

// ==================== RENDERING ====================

/**
 * Draw the grid, battalions, and UI elements
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} tileSize - Size of each tile
 */
function drawGrid(ctx, canvas, tileSize) {
  clearCanvas(ctx, canvas);
  drawGridLines(ctx, canvas, tileSize);
  drawMovementRange(ctx, tileSize);
  drawBattalions(ctx, tileSize);
  drawSelectionHighlights(ctx, tileSize);
}

/**
 * Clear the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 */
function clearCanvas(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draw grid lines
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} tileSize - Size of each tile
 */
function drawGridLines(ctx, canvas, tileSize) {
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
}

/**
 * Draw all battalions
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} tileSize - Size of each tile
 */
function drawBattalions(ctx, tileSize) {
  gameState.battalions.forEach(battalion => {
    battalion.draw(ctx, tileSize);
  });
}

/**
 * Draw selection highlights for selected battalions
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} tileSize - Size of each tile
 */
function drawSelectionHighlights(ctx, tileSize) {
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

// ==================== COORDINATE UTILITIES ====================

/**
 * Convert mouse position to tile coordinates
 * @param {MouseEvent} e - Mouse event
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} tileSize - Size of each tile
 * @returns {Object} - x, y tile coordinates
 */
function getTileCoordinates(e, canvas, tileSize) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / tileSize);
  const y = Math.floor((e.clientY - rect.top) / tileSize);
  
  return { x, y };
}

/**
 * Check if coordinates are within grid bounds
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} - True if within bounds
 */
function isWithinBounds(x, y) {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

// ==================== TILE MANAGEMENT ====================

/**
 * Check if a tile is occupied by any battalion
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} - True if tile is occupied
 */
function isTileOccupied(x, y) {
  return gameState.battalions.some(b => b.x === x && b.y === y);
}

/**
 * Check if a tile is occupied, excluding specific battalions
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Array} excludeBattalions - Battalions to exclude from check
 * @returns {boolean} - True if tile is occupied by non-excluded battalion
 */
function isTileOccupiedExcluding(x, y, excludeBattalions) {
  return gameState.battalions.some(b => {
    if (b.x === x && b.y === y) {
      // Check if this battalion should be excluded
      return !excludeBattalions.some(excludeB => 
        excludeB.x === b.x && excludeB.y === b.y && excludeB.type === b.type
      );
    }
    return false;
  });
}

// ==================== BATTALION MANAGEMENT ====================

/**
 * Create battalion configuration from current UI settings
 * @returns {Object} - Battalion configuration object
 */
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

/**
 * Place a battalion at specified coordinates
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} - True if placement successful
 */
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

/**
 * Remove a battalion at specified coordinates
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} - True if removal successful
 */
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

// Battalion placement and removal functions moved above

// ==================== MOVEMENT SYSTEM ====================

/**
 * Move a single battalion to a new position
 * @param {Battalion} battalion - Battalion to move
 * @param {number} newX - New X coordinate
 * @param {number} newY - New Y coordinate
 */
function moveBattalion(battalion, newX, newY) {
  const oldX = battalion.x;
  const oldY = battalion.y;
  
  // Update battalion position
  battalion.x = newX;
  battalion.y = newY;
  
  console.log(`Moved ${battalion.type} battalion from (${oldX}, ${oldY}) to (${newX}, ${newY})`);
  
  // Redraw battlefield
  redrawBattlefield();
}

/**
 * Redraw the battlefield canvas
 */
function redrawBattlefield() {
  const canvas = document.getElementById('battlefield');
  const tileSize = calculateTileSize();
  drawGrid(canvas.getContext('2d'), canvas, tileSize);
}

/**
 * Move multiple battalions while maintaining relative positions
 * @param {Array} battalions - Array of battalions to move
 * @param {number} targetX - Target X coordinate for reference battalion
 * @param {number} targetY - Target Y coordinate for reference battalion
 * @param {Battalion} referenceBattalion - Reference battalion for positioning
 */
function moveMultipleBattalions(battalions, targetX, targetY, referenceBattalion = null) {
  console.log(`Moving ${battalions.length} battalions to target (${targetX}, ${targetY})`);
  
  const refBattalion = referenceBattalion || battalions[0];
  const deltaX = targetX - refBattalion.x;
  const deltaY = targetY - refBattalion.y;
  
  const plannedMoves = validateGroupMovement(battalions, deltaX, deltaY);
  
  if (plannedMoves.allCanMove) {
    executeGroupMovement(plannedMoves.moves);
  } else {
    console.log(`Could not move battalion group - some positions blocked or out of bounds`);
  }
  
  redrawBattlefield();
}

/**
 * Validate that all battalions in a group can move to their target positions
 * @param {Array} battalions - Array of battalions to validate
 * @param {number} deltaX - X offset for movement
 * @param {number} deltaY - Y offset for movement
 * @returns {Object} - Validation result with moves array and success flag
 */
function validateGroupMovement(battalions, deltaX, deltaY) {
  const plannedMoves = [];
  let allCanMove = true;
  
  for (const battalion of battalions) {
    const move = validateSingleBattalionMove(battalion, deltaX, deltaY, plannedMoves);
    plannedMoves.push(move);
    
    if (!move.canMove) {
      allCanMove = false;
      break;
    }
  }
  
  return { moves: plannedMoves, allCanMove };
}

/**
 * Validate a single battalion's move within a group
 * @param {Battalion} battalion - Battalion to validate
 * @param {number} deltaX - X offset for movement
 * @param {number} deltaY - Y offset for movement
 * @param {Array} plannedMoves - Already planned moves to check against
 * @returns {Object} - Move validation result
 */
function validateSingleBattalionMove(battalion, deltaX, deltaY, plannedMoves) {
  const oldX = battalion.x;
  const oldY = battalion.y;
  const newX = oldX + deltaX;
  const newY = oldY + deltaY;
  
  let canMove = isWithinBounds(newX, newY);
  
  if (canMove) {
    // Check if position is occupied by non-selected battalion
    canMove = !isPositionOccupiedByOther(newX, newY, battalion);
    
    // Check against other planned moves to prevent collisions
    if (canMove) {
      canMove = !isPositionPlannedByOther(newX, newY, plannedMoves);
    }
  }
  
  return { battalion, oldX, oldY, newX, newY, canMove };
}

/**
 * Check if a position is occupied by a battalion other than the specified one
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Battalion} excludeBattalion - Battalion to exclude from check
 * @returns {boolean} - True if position is occupied by other battalion
 */
function isPositionOccupiedByOther(x, y, excludeBattalion) {
  return gameState.battalions.some(b => 
    b.x === x && b.y === y && b !== excludeBattalion
  );
}

/**
 * Check if a position is already planned for movement by another battalion
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Array} plannedMoves - Array of planned moves
 * @returns {boolean} - True if position is already planned
 */
function isPositionPlannedByOther(x, y, plannedMoves) {
  return plannedMoves.some(move => move.newX === x && move.newY === y);
}

/**
 * Execute validated group movement
 * @param {Array} moves - Array of validated moves to execute
 */
function executeGroupMovement(moves) {
  for (const move of moves) {
    move.battalion.x = move.newX;
    move.battalion.y = move.newY;
    console.log(`Moved ${move.battalion.type} battalion from (${move.oldX}, ${move.oldY}) to (${move.newX}, ${move.newY})`);
  }
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
  
  // Handle remove mode (not allowed in battle mode)
  if (gameState.currentMode === 'removing') {
    if (!isActionAllowed('removing')) {
      console.log('Removing troops not allowed in battle mode');
      return;
    }
    if (removeBattalion(x, y)) {
      // Battalion removed successfully
      drawGrid(canvas.getContext('2d'), canvas, tileSize);
    }
    return;
  }
  
  // Check if clicking on existing battalion
  const clickedBattalion = gameState.battalions.find(b => b.x === x && b.y === y);
  
  // Handle battalion selection and interaction
  if ((gameState.currentMode === 'viewing' || gameState.currentMode === 'inspecting' || gameState.currentMode === 'battle')) {
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
        
        // Update single selection for movement range (use first selected) - only in battle mode
        gameState.selectedBattalion = gameState.selectedBattalions.length > 0 ? 
          gameState.selectedBattalions[0] : null;
        gameState.movementRange = (gameState.selectedBattalion && gameState.currentMode === 'battle') ? 
          calculateMovementRange(gameState.selectedBattalion, true, gameState.selectedBattalions) : [];
        
      } else {
        // Single selection mode
        gameState.selectedBattalion = null;
        gameState.selectedBattalions = [];
        gameState.movementRange = [];
        
        // Show modal in inspect mode
        if (gameState.currentMode === 'inspecting') {
          showBattalionModal(clickedBattalion);
        } else if (gameState.currentMode === 'battle') {
          // In battle mode, show movement range
          gameState.selectedBattalion = clickedBattalion;
          gameState.selectedBattalions = [clickedBattalion];
          gameState.movementRange = calculateMovementRange(clickedBattalion, false, null);
        } else {
          // In viewing mode, don't show movement range
          gameState.selectedBattalion = null;
          gameState.selectedBattalions = [];
          gameState.movementRange = [];
        }
      }
    } else {
      // Check if clicking on movement range tile (only in battle mode)
      if (gameState.selectedBattalion && gameState.movementRange.length > 0 && gameState.currentMode === 'battle') {
        const movementPosition = gameState.movementRange.find(pos => pos.x === x && pos.y === y);
        if (movementPosition) {
          // Move all selected battalions (if multiple selected)
          if (gameState.selectedBattalions.length > 1) {
            moveMultipleBattalions(gameState.selectedBattalions, x, y, movementPosition.referenceBattalion);
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
  
  // Handle battalion placement in create mode (not allowed in battle mode)
  if (gameState.currentMode === 'creating' && gameState.selectedArmyType) {
    if (!isActionAllowed('creating')) {
      console.log('Creating battalions not allowed in battle mode');
      return;
    }
    
    // Additional safety check: ensure we're not in a selection state
    if (gameState.selectedBattalions.length > 0) {
      console.warn('Warning: In create mode but have selected battalions, clearing selection');
      gameState.selectedBattalion = null;
      gameState.selectedBattalions = [];
      gameState.movementRange = [];
    }
    
    if (placeBattalion(x, y)) {
      drawGrid(canvas.getContext('2d'), canvas, tileSize);
    }
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
  
  // Handle placement preview for create, remove, and inspect modes (with battle mode restrictions)
  if (gameState.currentMode === 'creating' || gameState.currentMode === 'removing' || gameState.currentMode === 'inspecting') {
    // Check if action is allowed in current mode
    if ((gameState.currentMode === 'creating' && !isActionAllowed('creating')) ||
        (gameState.currentMode === 'removing' && !isActionAllowed('removing'))) {
      removePlacementPreview();
      return;
    }
    
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
    
    // Regular hover effect for viewing and battle modes
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
  
  // Only start dragging in create mode for placement (not allowed in battle mode)
  if (gameState.currentMode !== 'creating') return;
  
  if (!isActionAllowed('creating')) {
    console.log('Drag placement not allowed in battle mode');
    return;
  }
  
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
  
  // Place battalion if tile is different and not occupied (not allowed in battle mode)
  if (!isActionAllowed('creating')) {
    return;
  }
  
  // Safety check: ensure we're not in a selection state
  if (gameState.selectedBattalions.length > 0) {
    console.warn('Warning: In drag placement but have selected battalions, clearing selection');
    gameState.selectedBattalion = null;
    gameState.selectedBattalions = [];
    gameState.movementRange = [];
  }
  
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
    
    // Clear selection and movement range
    gameState.selectedBattalion = null;
    gameState.selectedBattalions = [];
    gameState.movementRange = [];
    
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

// ==================== MOVEMENT RANGE CALCULATION ====================

/**
 * Calculate movement range for a battalion or group of battalions
 * @param {Battalion} battalion - Primary battalion
 * @param {boolean} isCtrlHeld - Whether Ctrl is held (restricts movement)
 * @param {Array} selectedBattalions - Array of selected battalions for group movement
 * @returns {Array} - Array of valid movement positions
 */
function calculateMovementRange(battalion, isCtrlHeld = false, selectedBattalions = null) {
  if (isCtrlHeld && selectedBattalions && selectedBattalions.length > 1) {
    return calculateGroupMovementRange(selectedBattalions);
  } else if (isCtrlHeld) {
    return calculateRestrictedMovementRange(battalion);
  } else {
    return calculateNormalMovementRange(battalion);
  }
}

/**
 * Calculate movement range for multiple battalions (group movement)
 * @param {Array} selectedBattalions - Array of selected battalions
 * @returns {Array} - Array of valid movement positions
 */
function calculateGroupMovementRange(selectedBattalions) {
  const range = [];
  const directions = getCardinalDirections();
  
  for (const selectedBattalion of selectedBattalions) {
    for (const dir of directions) {
      for (let dist = 1; dist <= selectedBattalion.speed; dist++) {
        const targetX = selectedBattalion.x + dir.dx * dist;
        const targetY = selectedBattalion.y + dir.dy * dist;
        
        if (isWithinBounds(targetX, targetY)) {
          const canMoveGroup = validateGroupMovementToPosition(selectedBattalions, selectedBattalion, targetX, targetY);
          
          if (canMoveGroup) {
            // Check if this position is already in the range to avoid duplicates
            const exists = range.some(pos => pos.x === targetX && pos.y === targetY);
            if (!exists) {
              range.push({ x: targetX, y: targetY, referenceBattalion: selectedBattalion });
            }
          } else {
            break; // Stop in this direction if blocked
          }
        } else {
          break; // Stop if out of bounds
        }
      }
    }
  }
  
  return range;
}

/**
 * Calculate restricted movement range (cardinal directions only)
 * @param {Battalion} battalion - Battalion to calculate range for
 * @returns {Array} - Array of valid movement positions
 */
function calculateRestrictedMovementRange(battalion) {
  const range = [];
  const directions = getCardinalDirections();
  
  for (const dir of directions) {
    for (let dist = 1; dist <= battalion.speed; dist++) {
      const x = battalion.x + dir.dx * dist;
      const y = battalion.y + dir.dy * dist;
      
      if (isWithinBounds(x, y) && !isTileOccupied(x, y)) {
        range.push({ x, y });
      } else {
        break; // Stop if blocked or out of bounds
      }
    }
  }
  
  return range;
}

/**
 * Calculate normal movement range (all directions with path checking)
 * @param {Battalion} battalion - Battalion to calculate range for
 * @returns {Array} - Array of valid movement positions
 */
function calculateNormalMovementRange(battalion) {
  const range = [];
  
  for (let dx = -battalion.speed; dx <= battalion.speed; dx++) {
    for (let dy = -battalion.speed; dy <= battalion.speed; dy++) {
      const distance = Math.abs(dx) + Math.abs(dy); // Manhattan distance
      
      if (distance > 0 && distance <= battalion.speed) {
        const x = battalion.x + dx;
        const y = battalion.y + dy;
        
        if (isWithinBounds(x, y) && isValidNormalMovement(battalion, x, y, dx, dy)) {
          range.push({ x, y });
        }
      }
    }
  }
  
  return range;
}

/**
 * Get cardinal direction vectors
 * @returns {Array} - Array of direction objects
 */
function getCardinalDirections() {
  return [
    { dx: 0, dy: -1 },  // Up
    { dx: 0, dy: 1 },   // Down
    { dx: -1, dy: 0 },  // Left
    { dx: 1, dy: 0 }    // Right
  ];
}

/**
 * Validate if a group can move to a specific position
 * @param {Array} selectedBattalions - Array of selected battalions
 * @param {Battalion} referenceBattalion - Reference battalion for positioning
 * @param {number} targetX - Target X position
 * @param {number} targetY - Target Y position
 * @returns {boolean} - True if group can move to position
 */
function validateGroupMovementToPosition(selectedBattalions, referenceBattalion, targetX, targetY) {
  const deltaX = targetX - referenceBattalion.x;
  const deltaY = targetY - referenceBattalion.y;
  
  for (const battalion of selectedBattalions) {
    const newX = battalion.x + deltaX;
    const newY = battalion.y + deltaY;
    
    if (!isWithinBounds(newX, newY)) {
      return false;
    }
    
    // Check if position is occupied by battalion outside the selected group
    const isOccupiedByOutsideBattalion = gameState.battalions.some(b => 
      b.x === newX && b.y === newY && !selectedBattalions.includes(b)
    );
    
    if (isOccupiedByOutsideBattalion) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validate if normal movement is valid (with path checking)
 * @param {Battalion} battalion - Battalion to move
 * @param {number} targetX - Target X position
 * @param {number} targetY - Target Y position
 * @param {number} dx - X delta from start
 * @param {number} dy - Y delta from start
 * @returns {boolean} - True if movement is valid
 */
function isValidNormalMovement(battalion, targetX, targetY, dx, dy) {
  // Don't check the battalion's current position
  if (targetX === battalion.x && targetY === battalion.y) {
    return false;
  }
  
  // Check if destination is occupied
  if (isTileOccupied(targetX, targetY)) {
    return false;
  }
  
  // Check if path is clear (prevent jumping over battalions)
  return isPathClear(battalion.x, battalion.y, targetX, targetY);
}

/**
 * Check if the path between two points is clear of obstacles
 * @param {number} startX - Starting X coordinate
 * @param {number} startY - Starting Y coordinate
 * @param {number} endX - Ending X coordinate
 * @param {number} endY - Ending Y coordinate
 * @returns {boolean} - True if path is clear
 */
function isPathClear(startX, startY, endX, endY) {
  const dx = endX - startX;
  const dy = endY - startY;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  
  for (let step = 1; step < steps; step++) {
    const stepX = startX + Math.round((dx / steps) * step);
    const stepY = startY + Math.round((dy / steps) * step);
    
    if (isTileOccupied(stepX, stepY)) {
      return false;
    }
  }
  
  return true;
}

// ==================== UI RENDERING ====================

/**
 * Draw movement range indicators on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} tileSize - Size of each tile
 */
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

// ==================== GAME MODE MANAGEMENT ====================

/**
 * Enter battle mode
 */
function enterBattleMode() {
  gameState.battleMode = true;
  gameState.currentMode = 'battle';
  clearSelections();
  hideBattalionCreationSection();
  console.log('Entered Battle Mode');
}

/**
 * Exit battle mode
 */
function exitBattleMode() {
  gameState.battleMode = false;
  gameState.currentMode = 'viewing';
  clearSelections();
  console.log('Exited Battle Mode');
}

/**
 * Check if currently in battle mode
 * @returns {boolean} - True if in battle mode
 */
function isInBattleMode() {
  return gameState.battleMode;
}

/**
 * Check if an action is allowed in current mode
 * @param {string} action - Action type to check
 * @returns {boolean} - True if action is allowed
 */
function isActionAllowed(action) {
  if (isInBattleMode()) {
    // In battle mode, only movement is allowed
    return action === 'movement';
  }
  // In normal mode, all actions are allowed
  return true;
}

/**
 * Clear all current selections
 */
function clearSelections() {
  gameState.selectedBattalion = null;
  gameState.selectedBattalions = [];
  gameState.movementRange = [];
}

/**
 * Hide the battalion creation section
 */
function hideBattalionCreationSection() {
  document.getElementById('battalionCreationSection').classList.add('hidden');
}

// ==================== ARMY MANAGEMENT ====================

/**
 * Update troop count displays
 */
function updateArmyCounts() {
  const troopCounts = calculateTroopCounts();
  
  document.getElementById('alliedTroops').textContent = troopCounts.allied;
  document.getElementById('enemyTroops').textContent = troopCounts.enemy;
  document.getElementById('totalTroops').textContent = troopCounts.total;
}

/**
 * Calculate troop counts by army type
 * @returns {Object} - Troop count object with allied, enemy, and total counts
 */
function calculateTroopCounts() {
  const alliedTroops = gameState.battalions
    .filter(b => b.armyType === 'allied')
    .reduce((sum, b) => sum + b.soldiers, 0);
  
  const enemyTroops = gameState.battalions
    .filter(b => b.armyType === 'enemy')
    .reduce((sum, b) => sum + b.soldiers, 0);
  
  const totalTroops = gameState.battalions
    .reduce((sum, b) => sum + b.soldiers, 0);
  
  return { allied: alliedTroops, enemy: enemyTroops, total: totalTroops };
}
