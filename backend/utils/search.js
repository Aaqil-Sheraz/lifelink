// Escape user input so it can be used safely inside a RegExp (prevents regex injection).
const escapeRegex = (s) => String(s).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Case-insensitive "contains" filter, used for the browse/search screens.
// (Donor matching for SOS broadcasts stays an exact, case-insensitive match.)
exports.localityFilter = (value) => ({ $regex: escapeRegex(value), $options: 'i' });
