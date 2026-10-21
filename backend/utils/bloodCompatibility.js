const { BLOOD_GROUPS } = require('./constants');

// Red blood cell compatibility, derived from antigens so there is no hand-typed table to get wrong:
//  - a donor can give to a recipient only if the donor has no A/B antigen the recipient lacks
//  - Rh-positive donors can only give to Rh-positive recipients (Rh-negative donors can give to anyone)
// Result: O- is the universal donor, AB+ the universal recipient, O+ -> all positive groups, etc.
const antigens = (g) => ({ A: g.includes('A'), B: g.includes('B'), rh: g.endsWith('+') });

const canDonate = (donor, recipient) => {
  const d = antigens(donor);
  const r = antigens(recipient);
  return (!d.A || r.A) && (!d.B || r.B) && (!d.rh || r.rh);
};

// Groups whose donors can give blood to a patient who needs `needed`
exports.donorGroupsFor = (needed) => BLOOD_GROUPS.filter((g) => canDonate(g, needed));

// Groups of patients a donor of `donor` can give blood to
exports.recipientGroupsOf = (donor) => BLOOD_GROUPS.filter((g) => canDonate(donor, g));

exports.canDonate = canDonate;
