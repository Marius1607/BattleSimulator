class Battalion {
  constructor({
    x = 0,
    y = 0,
    type = 'footsoldiers', // 'footsoldiers', 'cavalry', 'ranged'
    armyType = 'allied', // 'allied' or 'enemy'
    discipline = 5, // 1-10
    equipment = 5, // 1-10
    range = 1, // 1-10
    morale = 5, // 1-10
    speed = 3, // 1-10
    soldiers = 100,
    active = true
  } = {}) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.armyType = armyType;
    this.discipline = discipline; 
    this.equipment = equipment;
    this.range = range;
    this.morale = morale;
    this.speed = speed;
    this.soldiers = soldiers;
    this.active = active;
  }

  increaseMorale = (value) => {
    this.morale += value;
    if (this.morale > 10) {
      this.morale = 10;
    }
  }

  draw(ctx, tileSize) {
    const centerX = this.x * tileSize + tileSize / 2;
    const centerY = this.y * tileSize + tileSize / 2;
    const size = tileSize * 0.7; // 70% of tile size
    
    // Set color based on army type
    ctx.fillStyle = this.armyType === 'allied' ? '#2563eb' : '#dc2626';
    ctx.strokeStyle = this.armyType === 'allied' ? '#1e40af' : '#b91c1c';
    ctx.lineWidth = 2;
    
    // Draw shape based on unit type
    switch(this.type) {
      case 'footsoldiers':
        // Square
        ctx.fillRect(centerX - size/2, centerY - size/2, size, size);
        ctx.strokeRect(centerX - size/2, centerY - size/2, size, size);
        break;
      case 'cavalry':
        // Hexagon
        const hexRadius = size / 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const x = centerX + hexRadius * Math.cos(angle);
          const y = centerY + hexRadius * Math.sin(angle);
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      case 'ranged':
        // Diamond
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - size/2);
        ctx.lineTo(centerX + size/2, centerY);
        ctx.lineTo(centerX, centerY + size/2);
        ctx.lineTo(centerX - size/2, centerY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
    }
  }

  retreat = () => {
    if (this.morale <= 1) {
        return true;
    }

    console.log("MORALE:  " + this.morale)
    if (this.soldiers < ((10 - this.discipline) * 10)) {
        this.morale--;
        const random = Math.floor(Math.random() * 10) + 1;
        if (random <= 5) {
            this.morale--;
        }
    }

    if (this.morale <= 1) {
        return true;
    }
    return false;
  }
}

module.exports = Battalion;