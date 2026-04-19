// Medieval Battle Simulator - UI Controller

// Update battalion preview
function updateBattalionPreview() {
  const typeNames = {
    'footsoldiers': 'Foot Soldiers',
    'cavalry': 'Cavalry',
    'ranged': 'Ranged'
  };
  
  document.getElementById('previewType').textContent = typeNames[gameState.selectedUnitType] || 'Foot Soldiers';
  document.getElementById('previewSoldiers').textContent = document.getElementById('soldiersInput').value;
  document.getElementById('previewDiscipline').textContent = document.getElementById('disciplineInput').value;
  document.getElementById('previewEquipment').textContent = document.getElementById('equipmentInput').value;
  document.getElementById('previewRange').textContent = document.getElementById('rangeInput').value;
  document.getElementById('previewMorale').textContent = document.getElementById('moraleInput').value;
  document.getElementById('previewSpeed').textContent = document.getElementById('speedInput').value;
}

// Update current mode display
function updateCurrentModeDisplay() {
  const modeDisplay = document.getElementById('currentModeDisplay');
  switch(gameState.currentMode) {
    case 'viewing':
      modeDisplay.textContent = 'Viewing Battlefield';
      break;
    case 'creating':
      modeDisplay.textContent = 'Creating Battalion - Click or Drag to Place';
      break;
    case 'inspecting':
      modeDisplay.textContent = 'Inspecting Troops - Click to View Stats';
      break;
    case 'removing':
      modeDisplay.textContent = 'Removing Troops - Click to Remove';
      break;
    case 'battle':
      modeDisplay.textContent = 'Battle Phase - Movement Only';
      break;
    default:
      modeDisplay.textContent = 'Unknown Mode';
  }
}

// Current battalion being edited
let currentEditingBattalion = null;

// Show battalion modal with stats
function showBattalionModal(battalion) {
  const modal = document.getElementById('battalionModal');
  currentEditingBattalion = battalion;
  
  // Update modal content
  document.getElementById('modalType').value = battalion.type;
  document.getElementById('modalArmyType').value = battalion.armyType;
  document.getElementById('modalSoldiers').value = battalion.soldiers;
  document.getElementById('modalDiscipline').value = battalion.discipline;
  document.getElementById('modalEquipment').value = battalion.equipment;
  document.getElementById('modalRange').value = battalion.range;
  document.getElementById('modalMorale').value = battalion.morale;
  document.getElementById('modalSpeed').value = battalion.speed;
  document.getElementById('modalPosition').textContent = `(${battalion.x}, ${battalion.y})`;
  
  // Enable/disable editing based on mode (not allowed in battle mode)
  const isEditable = gameState.currentMode === 'inspecting' && !isInBattleMode();
  document.getElementById('modalType').disabled = !isEditable;
  document.getElementById('modalArmyType').disabled = !isEditable;
  document.getElementById('modalSoldiers').disabled = !isEditable;
  document.getElementById('modalDiscipline').disabled = !isEditable;
  document.getElementById('modalEquipment').disabled = !isEditable;
  document.getElementById('modalRange').disabled = !isEditable;
  document.getElementById('modalMorale').disabled = !isEditable;
  document.getElementById('modalSpeed').disabled = !isEditable;
  
  // Show/hide action buttons based on mode
  document.querySelector('.modal-actions').style.display = isEditable ? 'flex' : 'none';
  
  // Show modal
  modal.style.display = 'block';
}

// Hide battalion modal
function hideBattalionModal() {
  const modal = document.getElementById('battalionModal');
  modal.style.display = 'none';
}

// Setup event listeners
function setupEventListeners(canvas) {
  // Create Army button (restricted in battle mode)
  document.getElementById('createArmyBtn').addEventListener('click', function() {
    if (isInBattleMode()) {
      showNotification('Cannot create armies during battle phase', 'error');
      return;
    }
    // Show battalion creation section
    document.getElementById('battalionCreationSection').classList.remove('hidden');
    gameState.currentMode = 'creating';
    updateCurrentModeDisplay();
  });
  
  // Inspect Troops button
  document.getElementById('inspectTroopsBtn').addEventListener('click', function() {
    // Toggle inspect mode
    if (gameState.currentMode === 'inspecting') {
      gameState.currentMode = 'viewing';
      this.classList.remove('active');
      this.classList.remove('inspect-active');
    } else {
      // Hide battalion creation section if open
      document.getElementById('battalionCreationSection').classList.add('hidden');
      gameState.currentMode = 'inspecting';
      this.classList.add('active');
      this.classList.add('inspect-active');
    }
    updateCurrentModeDisplay();
  });
  
    
  // Remove Troops button (restricted in battle mode)
  document.getElementById('removeTroopsBtn').addEventListener('click', function() {
    if (isInBattleMode()) {
      showNotification('Cannot remove troops during battle phase', 'error');
      return;
    }
    // Toggle remove mode
    if (gameState.currentMode === 'removing') {
      gameState.currentMode = 'viewing';
      this.classList.remove('active');
    } else {
      // Hide battalion creation section if open
      document.getElementById('battalionCreationSection').classList.add('hidden');
      gameState.currentMode = 'removing';
      this.classList.add('active');
    }
    updateCurrentModeDisplay();
  });
  
  // Army type buttons
  document.getElementById('alliedBtn').addEventListener('click', function() {
    gameState.selectedArmyType = 'allied';
    this.classList.add('allied-selected');
    this.classList.remove('enemy-selected');
    document.getElementById('enemyBtn').classList.remove('allied-selected');
    document.getElementById('enemyBtn').classList.add('enemy-selected');
    
    // Update unit type selector colors
    document.querySelector('.unit-type-selector').classList.remove('enemy-army');
    
    updateBattalionPreview();
  });
  
  document.getElementById('enemyBtn').addEventListener('click', function() {
    gameState.selectedArmyType = 'enemy';
    this.classList.add('enemy-selected');
    this.classList.remove('allied-selected');
    document.getElementById('alliedBtn').classList.remove('allied-selected');
    document.getElementById('alliedBtn').classList.remove('enemy-selected');
    
    // Update unit type selector colors
    document.querySelector('.unit-type-selector').classList.add('enemy-army');
    
    updateBattalionPreview();
  });
  
  // Unit type selector
  document.querySelectorAll('.unit-type-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.unit-type-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      gameState.selectedUnitType = this.dataset.type;
      updateBattalionPreview();
    });
  });
  
  // Input change handlers
  ['soldiersInput', 'disciplineInput', 'equipmentInput', 'rangeInput', 'moraleInput', 'speedInput'].forEach(inputId => {
    document.getElementById(inputId).addEventListener('input', updateBattalionPreview);
  });
  
  // Cancel battalion creation
  document.getElementById('cancelBattalionBtn').addEventListener('click', function() {
    gameState.currentMode = 'viewing';
    gameState.selectedArmyType = null;
    document.getElementById('battalionCreationSection').classList.add('hidden');
    
    // Reset army type buttons
    document.getElementById('alliedBtn').classList.remove('allied-selected');
    document.getElementById('alliedBtn').classList.remove('enemy-selected');
    document.getElementById('enemyBtn').classList.remove('allied-selected');
    document.getElementById('enemyBtn').classList.add('enemy-selected');
    
    // Reset remove button
    document.getElementById('removeTroopsBtn').classList.remove('active');
    
    // Reset inspect button
    document.getElementById('inspectTroopsBtn').classList.remove('active');
    document.getElementById('inspectTroopsBtn').classList.remove('inspect-active');
    
    updateCurrentModeDisplay();
  });
  
  // Export Army button
  document.getElementById('exportArmyBtn').addEventListener('click', function() {
    try {
      const jsonData = exportBattlefield();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `battlefield_${timestamp}.json`;
      downloadJSON(filename, jsonData);
      showNotification('Battlefield exported successfully!', 'success');
    } catch (error) {
      showNotification('Export failed: ' + error.message, 'error');
    }
  });
  
  // Import Army button (restricted in battle mode)
  document.getElementById('importArmyBtn').addEventListener('click', function() {
    if (isInBattleMode()) {
      showNotification('Cannot import armies during battle phase', 'error');
      return;
    }
    document.getElementById('importFileInput').click();
  });
  
  // Battle Mode button
  document.getElementById('battleModeBtn').addEventListener('click', function() {
    if (isInBattleMode()) {
      // Exit battle mode
      exitBattleMode();
      this.textContent = 'Start Battle';
      this.classList.remove('battle-active');
      
      // Show restricted buttons
      document.getElementById('createArmyBtn').style.display = 'block';
      document.getElementById('removeTroopsBtn').style.display = 'block';
      document.getElementById('importArmyBtn').style.display = 'block';
      
      showNotification('Battle phase ended', 'success');
    } else {
      // Enter battle mode
      enterBattleMode();
      this.textContent = 'End Battle';
      this.classList.add('battle-active');
      
      // Hide restricted buttons
      document.getElementById('createArmyBtn').style.display = 'none';
      document.getElementById('removeTroopsBtn').style.display = 'none';
      document.getElementById('importArmyBtn').style.display = 'none';
      
      // Reset other mode buttons
      document.getElementById('inspectTroopsBtn').classList.remove('active');
      document.getElementById('inspectTroopsBtn').classList.remove('inspect-active');
      document.getElementById('removeTroopsBtn').classList.remove('active');
      
      showNotification('Battle phase started - Only movement allowed', 'success');
    }
    updateCurrentModeDisplay();
  });
  
  // Import file input change handler
  document.getElementById('importFileInput').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const jsonData = await readJSONFile(file);
      const result = importBattlefield(jsonData);
      
      if (result.success) {
        // Redraw the battlefield
        const canvas = document.getElementById('battlefield');
        const tileSize = calculateTileSize();
        drawGrid(canvas.getContext('2d'), canvas, tileSize);
        
        showNotification(result.message, 'success');
      } else {
        showNotification(result.message, 'error');
      }
    } catch (error) {
      showNotification('Import failed: ' + error.message, 'error');
    }
    
    // Reset file input
    this.value = '';
  });
  
  // Modal close button
  document.querySelector('.modal-close').addEventListener('click', hideBattalionModal);
  
  // Cancel edit button
  document.getElementById('cancelEditBtn').addEventListener('click', hideBattalionModal);
  
  // Save edit button
  document.getElementById('saveEditBtn').addEventListener('click', function() {
    if (!currentEditingBattalion) return;
    
    // Update battalion with new values
    currentEditingBattalion.type = document.getElementById('modalType').value;
    currentEditingBattalion.armyType = document.getElementById('modalArmyType').value;
    currentEditingBattalion.soldiers = parseInt(document.getElementById('modalSoldiers').value);
    currentEditingBattalion.discipline = parseInt(document.getElementById('modalDiscipline').value);
    currentEditingBattalion.equipment = parseInt(document.getElementById('modalEquipment').value);
    currentEditingBattalion.range = parseInt(document.getElementById('modalRange').value);
    currentEditingBattalion.morale = parseInt(document.getElementById('modalMorale').value);
    currentEditingBattalion.speed = parseInt(document.getElementById('modalSpeed').value);
    
    // Update army counts
    updateArmyCounts();
    
    // Redraw battlefield
    const canvas = document.getElementById('battlefield');
    const tileSize = calculateTileSize();
    drawGrid(canvas.getContext('2d'), canvas, tileSize);
    
    // Show notification
    showNotification('Battalion updated successfully!', 'success');
    
    // Close modal
    hideBattalionModal();
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    const modal = document.getElementById('battalionModal');
    if (e.target === modal) {
      hideBattalionModal();
    }
    // Don't change mode when clicking outside modal in inspect mode
    if (modal.style.display === 'block' && gameState.currentMode === 'inspecting') {
      e.stopPropagation();
    }
  });
  
  // Canvas event listeners
  canvas.addEventListener('click', function(e) {
    handleCanvasClick(e, canvas, calculateTileSize());
  });
  
  canvas.addEventListener('mousemove', function(e) {
    if (gameState.isDragging) {
      handleDragMove(e, canvas, calculateTileSize());
    }
  });
  
  canvas.addEventListener('mousedown', function(e) {
    handleMouseDown(e, canvas, calculateTileSize());
  });
  
  canvas.addEventListener('mouseup', function(e) {
    handleMouseUp(e);
  });
  
  canvas.addEventListener('mouseleave', function(e) {
    handleMouseLeave(e);
  });
  
  // Window resize
  window.addEventListener('resize', function() {
    const { tileSize } = resizeCanvas(canvas);
    drawGrid(canvas.getContext('2d'), canvas, tileSize);
  });
}

// Initialize UI
function initializeUI(canvas) {
  // Setup event listeners
  setupEventListeners(canvas);
  
  // Preselect Allied army type
  gameState.selectedArmyType = 'allied';
  document.getElementById('alliedBtn').classList.add('allied-selected');
  document.getElementById('enemyBtn').classList.add('enemy-selected');
  
  // Initialize displays
  updateBattalionPreview();
  updateCurrentModeDisplay();
  updateArmyCounts();
  
  // Setup canvas size
  const { tileSize } = resizeCanvas(canvas);
  drawGrid(canvas.getContext('2d'), canvas, tileSize);
}
