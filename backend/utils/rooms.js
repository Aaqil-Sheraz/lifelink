// One Socket.IO room per (locality, blood group). Locality is case-insensitive.
exports.roomName = (locality, bloodGroup) =>
  `${String(locality).trim().toLowerCase()}:${bloodGroup}`;
