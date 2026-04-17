const battleRound = (b1, b2) => {
  let casualtiesB1 = 0;
  let casualtiesB2 = 0;

  const engagements = Math.min(b1.soldiers, b2.soldiers);

  const b1a = Math.max(0, b1.soldiers - b2.soldiers);
  const b2a = Math.max(0, b2.soldiers - b1.soldiers);
  for (let i = 0; i < engagements; i++) {
    const b1Attack = computeAttack(b1, b1a);
    const b2Attack = computeAttack(b2, b2a);

    if (b1Attack - b2Attack > 0.1) {
      casualtiesB2++;
    } else if (b2Attack - b1Attack > 0.1) {
      casualtiesB1++;
    }
  }
  b1.soldiers = Math.max(0, b1.soldiers - casualtiesB1);
  b2.soldiers = Math.max(0, b2.soldiers - casualtiesB2);

  if (b1.soldiers > b2.soldiers) {
    if (checkForDefeat(b2)) {
      console.log('B1 wins');
      b2.active = false;
      b1.increaseMorale(5);
      return;
    }

    if (checkForDefeat(b1)) {
      console.log('B2 wins');
      b1.active = false;
      b2.increaseMorale(5);
      return;
    }
  } 
  if (b2.soldiers > b1.soldiers) {
    if (checkForDefeat(b1)) {
      console.log('B2 wins');
      b1.active = false;
      b2.increaseMorale(5);
      return;
    }

    if (checkForDefeat(b2)) {
      console.log('B1 wins');
      b2.active = false;
      b1.increaseMorale(5);
      return;
    }
  }
};

function checkForDefeat(b) {
  if (b.soldiers === 0 || b.retreat()) {
    return true;
  }
  return false;
}

function computeAttack(b, extra) {
  if (!b.active) {
    return 0;
  }
  const randomPart = (Math.floor(Math.random() * 10) + 1) / 10;

  const statsPart =
    (b.equipment * 0.5 +
     b.discipline * 0.3 +
     b.morale * 0.2) / 10;

  const extraPart = extra / 100;

  return (randomPart * 0.4) + (statsPart * 0.4) + (extraPart * 0.2);
}

module.exports = { battleRound, computeAttack };