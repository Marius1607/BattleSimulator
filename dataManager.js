// Medieval Battle Simulator - Data Manager
// Import and export functionality for battlefield data

// Export battlefield to JSON
function exportBattlefield() {
  const battlefieldData = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    gridSize: GRID_SIZE,
    battalions: gameState.battalions.map(battalion => ({
      x: battalion.x,
      y: battalion.y,
      type: battalion.type,
      armyType: battalion.armyType,
      discipline: battalion.discipline,
      equipment: battalion.equipment,
      range: battalion.range,
      morale: battalion.morale,
      speed: battalion.speed,
      soldiers: battalion.soldiers,
      active: battalion.active
    }))
  };
  
  return JSON.stringify(battlefieldData, null, 2);
}

// Import battlefield from JSON
function importBattlefield(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    
    // Validate data structure
    if (!data.version || !data.battalions || !Array.isArray(data.battalions)) {
      throw new Error('Invalid battlefield data format');
    }
    
    // Clear existing battalions
    gameState.battalions = [];
    
    // Import battalions
    data.battalions.forEach(battalionData => {
      const battalion = new Battalion({
        x: battalionData.x,
        y: battalionData.y,
        type: battalionData.type,
        armyType: battalionData.armyType,
        discipline: battalionData.discipline,
        equipment: battalionData.equipment,
        range: battalionData.range,
        morale: battalionData.morale,
        speed: battalionData.speed,
        soldiers: battalionData.soldiers,
        active: battalionData.active !== undefined ? battalionData.active : true
      });
      
      gameState.battalions.push(battalion);
    });
    
    // Update army counts after import
    updateArmyCounts();
    
    return {
      success: true,
      message: `Successfully imported ${data.battalions.length} battalions`,
      battalionCount: data.battalions.length
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Import failed: ${error.message}`,
      battalionCount: 0
    };
  }
}

// Download JSON file
function downloadJSON(filename, content) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

// Read JSON file
function readJSONFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        resolve(e.target.result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

// Show import/export notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    color: white;
    padding: 12px 24px;
    border-radius: 6px;
    z-index: 10000;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideDown 0.3s ease;
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { transform: translate(-50%, -100%); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideDown 0.3s ease reverse';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}
