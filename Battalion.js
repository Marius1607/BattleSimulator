class Battalion {
  constructor({
    discipline = 5, // 1-10
    equipment = 5, // 1-10
    range = 1, // 1-10
    morale = 5, // 1-10
    speed = 3, // 1-10
    soldiers = 100,
    active = true
  } = {}) {
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