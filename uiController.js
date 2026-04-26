// Medieval Battle Simulator - UI Controller

// ==================== PREVIEW MANAGEMENT ====================

/**
 * Update the battalion preview display with current form values
 */
function updateBattalionPreview() {
  const typeNames = {
    'footsoldiers': 'Foot Soldiers',
    'cavalry': 'Cavalry',
    'ranged': 'Ranged'
  };
  
  const previewElements = {
    previewType: typeNames[gameState.selectedUnitType] || 'Foot Soldiers',
    previewSoldiers: document.getElementById('soldiersInput').value,
    previewDiscipline: document.getElementById('disciplineInput').value,
    previewEquipment: document.getElementById('equipmentInput').value,
    previewRange: document.getElementById('rangeInput').value,
    previewMorale: document.getElementById('moraleInput').value,
    previewSpeed: document.getElementById('speedInput').value
  };
  
  Object.entries(previewElements).forEach(([elementId, value]) => {
    document.getElementById(elementId).textContent = value;
  });
}

// ==================== MODE DISPLAY ====================

/**
 * Update the current mode display text
 */
function updateCurrentModeDisplay() {
  const modeDisplay = document.getElementById('currentModeDisplay');
  const modeTexts = {
    'viewing': 'Viewing Battlefield',
    'creating': 'Creating Battalion - Click or Drag to Place',
    'inspecting': 'Inspecting Troops - Click to View Stats',
    'removing': 'Removing Troops - Click to Remove',
    'battle': 'Battle Phase - Movement Only'
  };
  
  modeDisplay.textContent = modeTexts[gameState.currentMode] || 'Unknown Mode';
}

// ==================== MODAL MANAGEMENT ====================

// Current battalion being edited
let currentEditingBattalion = null;

/**
 * Show battalion modal with current battalion stats
 * @param {Battalion} battalion - Battalion to display
 */
function showBattalionModal(battalion) {
  currentEditingBattalion = battalion;
  
  updateModalContent(battalion);
  setModalEditMode();
  document.getElementById('battalionModal').style.display = 'block';
}

/**
 * Hide the battalion modal
 */
function hideBattalionModal() {
  document.getElementById('battalionModal').style.display = 'none';
}

/**
 * Update modal content with battalion data
 * @param {Battalion} battalion - Battalion data
 */
function updateModalContent(battalion) {
  const modalFields = {
    modalType: battalion.type,
    modalArmyType: battalion.armyType,
    modalSoldiers: battalion.soldiers,
    modalDiscipline: battalion.discipline,
    modalEquipment: battalion.equipment,
    modalRange: battalion.range,
    modalMorale: battalion.morale,
    modalSpeed: battalion.speed
  };
  
  Object.entries(modalFields).forEach(([fieldId, value]) => {
    document.getElementById(fieldId).value = value;
  });
  
  document.getElementById('modalPosition').textContent = `(${battalion.x}, ${battalion.y})`;
}

/**
 * Set modal editing mode based on current game state
 */
function setModalEditMode() {
  const isEditable = gameState.currentMode === 'inspecting' && !isInBattleMode();
  const editableFields = [
    'modalType', 'modalArmyType', 'modalSoldiers',
    'modalDiscipline', 'modalEquipment', 'modalRange',
    'modalMorale', 'modalSpeed'
  ];
  
  editableFields.forEach(fieldId => {
    document.getElementById(fieldId).disabled = !isEditable;
  });
  
  document.querySelector('.modal-actions').style.display = isEditable ? 'flex' : 'none';
}

// ==================== EVENT LISTENERS ====================

/**
 * Setup all event listeners for the UI
 * @param {HTMLCanvasElement} canvas - The battlefield canvas
 */
function setupEventListeners(canvas) {
  setupArmyManagementButtons();
  setupBattalionCreationControls();
  setupModalControls();
  setupCanvasEventListeners(canvas);
  setupWindowEventListeners(canvas);
}

/**
 * Setup army management button event listeners
 */
function setupArmyManagementButtons() {
  // Create Army button
  document.getElementById('createArmyBtn').addEventListener('click', function() {
    if (isInBattleMode()) {
      showNotification('Cannot create armies during battle phase', 'error');
      return;
    }
    enterCreateMode();
  });
  
  // Inspect Troops button
  document.getElementById('inspectTroopsBtn').addEventListener('click', function() {
    toggleInspectMode();
  });
  
  // Remove Troops button
  document.getElementById('removeTroopsBtn').addEventListener('click', function() {
    if (isInBattleMode()) {
      showNotification('Cannot remove troops during battle phase', 'error');
      return;
    }
    toggleRemoveMode();
  });
}

/**
 * Enter battalion creation mode
 */
function enterCreateMode() {
  document.getElementById('battalionCreationSection').classList.remove('hidden');
  gameState.currentMode = 'creating';
  updateCurrentModeDisplay();
}

/**
 * Toggle inspect mode on/off
 */
function toggleInspectMode() {
  const button = document.getElementById('inspectTroopsBtn');
  
  if (gameState.currentMode === 'inspecting') {
    gameState.currentMode = 'viewing';
    button.classList.remove('active', 'inspect-active');
  } else {
    document.getElementById('battalionCreationSection').classList.add('hidden');
    gameState.currentMode = 'inspecting';
    button.classList.add('active', 'inspect-active');
  }
  
  updateCurrentModeDisplay();
}

/**
 * Toggle remove mode on/off
 */
function toggleRemoveMode() {
  const button = document.getElementById('removeTroopsBtn');
  
  if (gameState.currentMode === 'removing') {
    gameState.currentMode = 'viewing';
    button.classList.remove('active');
  } else {
    document.getElementById('battalionCreationSection').classList.add('hidden');
    gameState.currentMode = 'removing';
    button.classList.add('active');
  }
  
  updateCurrentModeDisplay();
}
  
/**
 * Setup battalion creation control event listeners
 */
function setupBattalionCreationControls() {
  setupArmyTypeButtons();
  setupUnitTypeSelector();
  setupInputHandlers();
  setupCreationActions();
}

/**
 * Setup army type selection buttons
 */
function setupArmyTypeButtons() {
  // Allied button
  document.getElementById('alliedBtn').addEventListener('click', function() {
    selectArmyType('allied', this);
  });
  
  // Enemy button
  document.getElementById('enemyBtn').addEventListener('click', function() {
    selectArmyType('enemy', this);
  });
}

/**
 * Select army type and update UI
 * @param {string} armyType - 'allied' or 'enemy'
 * @param {HTMLElement} button - The clicked button
 */
function selectArmyType(armyType, button) {
  gameState.selectedArmyType = armyType;
  updateArmyTypeButtonStyles(button);
  updateBattalionPreview();
}

/**
 * Update army type button visual styles
 * @param {HTMLElement} selectedButton - The selected button
 */
function updateArmyTypeButtonStyles(selectedButton) {
  const alliedBtn = document.getElementById('alliedBtn');
  const enemyBtn = document.getElementById('enemyBtn');
  const unitSelector = document.querySelector('.unit-type-selector');
  
  if (selectedButton === alliedBtn) {
    alliedBtn.classList.add('allied-selected');
    alliedBtn.classList.remove('enemy-selected');
    enemyBtn.classList.remove('allied-selected');
    enemyBtn.classList.add('enemy-selected');
    unitSelector.classList.remove('enemy-army');
  } else {
    enemyBtn.classList.add('enemy-selected');
    enemyBtn.classList.remove('allied-selected');
    alliedBtn.classList.remove('allied-selected');
    alliedBtn.classList.remove('enemy-selected');
    unitSelector.classList.add('enemy-army');
  }
}

/**
 * Setup unit type selector
 */
function setupUnitTypeSelector() {
  document.querySelectorAll('.unit-type-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      selectUnitType(this);
    });
  });
}

/**
 * Select unit type and update UI
 * @param {HTMLElement} button - The clicked unit type button
 */
function selectUnitType(button) {
  document.querySelectorAll('.unit-type-btn').forEach(b => b.classList.remove('active'));
  button.classList.add('active');
  gameState.selectedUnitType = button.dataset.type;
  updateBattalionPreview();
}

/**
 * Setup input field change handlers
 */
function setupInputHandlers() {
  const inputIds = ['soldiersInput', 'disciplineInput', 'equipmentInput', 'rangeInput', 'moraleInput', 'speedInput'];
  
  inputIds.forEach(inputId => {
    document.getElementById(inputId).addEventListener('input', updateBattalionPreview);
  });
}

/**
 * Setup creation action buttons
 */
function setupCreationActions() {
  // Cancel battalion creation
  document.getElementById('cancelBattalionBtn').addEventListener('click', function() {
    cancelBattalionCreation();
  });
}

/**
 * Cancel battalion creation and reset UI
 */
function cancelBattalionCreation() {
  gameState.currentMode = 'viewing';
  gameState.selectedArmyType = null;
  document.getElementById('battalionCreationSection').classList.add('hidden');
  resetArmyTypeButtons();
  resetModeButtons();
  updateCurrentModeDisplay();
}

/**
 * Reset army type button styles
 */
function resetArmyTypeButtons() {
  const alliedBtn = document.getElementById('alliedBtn');
  const enemyBtn = document.getElementById('enemyBtn');
  
  alliedBtn.classList.remove('allied-selected', 'enemy-selected');
  enemyBtn.classList.remove('allied-selected');
  enemyBtn.classList.add('enemy-selected');
}

/**
 * Reset mode button states
 */
function resetModeButtons() {
  document.getElementById('removeTroopsBtn').classList.remove('active');
  document.getElementById('inspectTroopsBtn').classList.remove('active', 'inspect-active');
}

/**
 * Setup import/export controls
 */
function setupImportExportControls() {
  // Export Army button
  document.getElementById('exportArmyBtn').addEventListener('click', function() {
    exportBattlefieldData();
  });
  
  // Import Army button
  document.getElementById('importArmyBtn').addEventListener('click', function() {
    if (isInBattleMode()) {
      showNotification('Cannot import armies during battle phase', 'error');
      return;
    }
    document.getElementById('importFileInput').click();
  });
}

/**
 * Export battlefield data to JSON file
 */
function exportBattlefieldData() {
  try {
    const jsonData = exportBattlefield();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `battlefield_${timestamp}.json`;
    downloadJSON(filename, jsonData);
    showNotification('Battlefield exported successfully!', 'success');
  } catch (error) {
    showNotification('Export failed: ' + error.message, 'error');
  }
}

/**
 * Setup battle mode controls
 */
function setupBattleModeControls() {
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
}

/**
 * Setup import file handling
 */
function setupImportFileHandling() {
  document.getElementById('importFileInput').addEventListener('change', async function(e) {
    await handleImportFile(e);
  });
}

/**
 * Handle import file selection and processing
 * @param {Event} e - File input change event
 */
async function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const jsonData = await readJSONFile(file);
    const result = importBattlefield(jsonData);
    
    if (result.success) {
      redrawBattlefield();
      showNotification(result.message, 'success');
    } else {
      showNotification(result.message, 'error');
    }
  } catch (error) {
    showNotification('Import failed: ' + error.message, 'error');
  }
  
  // Reset file input
  e.target.value = '';
}
  
/**
 * Setup modal control event listeners
 */
function setupModalControls() {
  // Modal close button
  document.querySelector('.modal-close').addEventListener('click', hideBattalionModal);
  
  // Cancel edit button
  document.getElementById('cancelEditBtn').addEventListener('click', hideBattalionModal);
  
  // Save edit button
  document.getElementById('saveEditBtn').addEventListener('click', function() {
    saveBattalionEdits();
  });
}

/**
 * Save battalion edits from modal
 */
function saveBattalionEdits() {
  if (!currentEditingBattalion) return;
  
  updateBattalionFromModal();
  updateArmyCounts();
  redrawBattlefield();
  showNotification('Battalion updated successfully!', 'success');
  hideBattalionModal();
}

/**
 * Update battalion data from modal inputs
 */
function updateBattalionFromModal() {
  const modalFields = {
    type: 'modalType',
    armyType: 'modalArmyType',
    soldiers: 'modalSoldiers',
    discipline: 'modalDiscipline',
    equipment: 'modalEquipment',
    range: 'modalRange',
    morale: 'modalMorale',
    speed: 'modalSpeed'
  };
  
  Object.entries(modalFields).forEach(([property, fieldId]) => {
    const value = document.getElementById(fieldId).value;
    currentEditingBattalion[property] = property === 'type' || property === 'armyType' 
      ? value 
      : parseInt(value);
  });
}
  
/**
 * Setup canvas event listeners
 * @param {HTMLCanvasElement} canvas - The battlefield canvas
 */
function setupCanvasEventListeners(canvas) {
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
}

/**
 * Setup window event listeners
 * @param {HTMLCanvasElement} canvas - The battlefield canvas
 */
function setupWindowEventListeners(canvas) {
  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    handleModalOutsideClick(e);
  });
  
  // Window resize
  window.addEventListener('resize', function() {
    handleWindowResize(canvas);
  });
}

/**
 * Handle clicks outside the modal
 * @param {Event} e - Click event
 */
function handleModalOutsideClick(e) {
  const modal = document.getElementById('battalionModal');
  if (e.target === modal) {
    hideBattalionModal();
  }
  
  // Don't change mode when clicking outside modal in inspect mode
  if (modal.style.display === 'block' && gameState.currentMode === 'inspecting') {
    e.stopPropagation();
  }
}

/**
 * Handle window resize events
 * @param {HTMLCanvasElement} canvas - The battlefield canvas
 */
function handleWindowResize(canvas) {
  const { tileSize } = resizeCanvas(canvas);
  drawGrid(canvas.getContext('2d'), canvas, tileSize);
}

// ==================== INITIALIZATION ====================

/**
 * Initialize the UI components
 * @param {HTMLCanvasElement} canvas - The battlefield canvas
 */
function initializeUI(canvas) {
  setupEventListeners(canvas);
  setupImportExportControls();
  setupImportFileHandling();
  setupBattleModeControls();
  initializeDefaultState();
  initializeDisplays();
  setupCanvas(canvas);
}

/**
 * Initialize default game state
 */
function initializeDefaultState() {
  gameState.selectedArmyType = 'allied';
  document.getElementById('alliedBtn').classList.add('allied-selected');
  document.getElementById('enemyBtn').classList.add('enemy-selected');
}

/**
 * Initialize UI displays
 */
function initializeDisplays() {
  updateBattalionPreview();
  updateCurrentModeDisplay();
  updateArmyCounts();
}

/**
 * Setup canvas with initial size and drawing
 * @param {HTMLCanvasElement} canvas - The battlefield canvas
 */
function setupCanvas(canvas) {
  const { tileSize } = resizeCanvas(canvas);
  drawGrid(canvas.getContext('2d'), canvas, tileSize);
}
