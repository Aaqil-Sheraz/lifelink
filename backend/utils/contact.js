const digits = (p) => String(p || '').replace(/\D/g, '');

const withCountryCode = (phone) => {
  const d = digits(phone);
  const cc = process.env.DEFAULT_COUNTRY_CODE || '91';
  return d.length === 10 ? `${cc}${d}` : d;
};

// Ready-made click-to-call / WhatsApp links for the frontend.
exports.contactLinks = (phone, message = '') => ({
  tel: `tel:+${withCountryCode(phone)}`,
  whatsapp: `https://wa.me/${withCountryCode(phone)}${
    message ? `?text=${encodeURIComponent(message)}` : ''
  }`
});

exports.donorWithLinks = (donor) => {
  const d = donor.toObject ? donor.toObject() : donor;
  return {
    ...d,
    contact: exports.contactLinks(
      d.phone,
      `Hi ${d.name}, there is an urgent need for ${d.bloodGroup} blood in ${d.locality}. Can you help?`
    )
  };
};

exports.sosWithLinks = (sos) => {
  const s = sos.toObject ? sos.toObject() : sos;
  return {
    ...s,
    contact: exports.contactLinks(
      s.requestedBy && s.requestedBy.phone,
      `Hi, I saw your SOS for ${s.bloodGroupNeeded} blood for ${s.patientName} at ${s.hospitalName}. I can donate.`
    )
  };
};
