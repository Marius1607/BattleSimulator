const Battalion = require('./Battalion.js');
const { battleRound, computeAttack } = require('./battleHelper.js');

const b1 = new Battalion();
const b2 = new Battalion();
console.log('Round 1');
console.log('Battalion 1:', b1);
console.log('Battalion 2:', b2);

battleRound(b1, b2);

console.log('Battalion 1:', b1.soldiers);
console.log('Battalion 2:', b2.soldiers);

for (let round = 2; round <= 8; round++) {
  if (!b1.active || !b2.active) {
    console.log(`Battle ended before round ${round}`);
    break;
  }
  
  console.log(`Round ${round}`);
  battleRound(b1, b2);

  console.log("b1.morale: ", b1.morale);
  console.log("b2.morale: ", b2.morale);
  console.log('Battalion 1:', b1.soldiers);
  console.log('Battalion 2:', b2.soldiers);
}

