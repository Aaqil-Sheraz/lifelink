export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;
export const URGENCIES = ["critical", "within 24h", "planned"] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];
export type Urgency = (typeof URGENCIES)[number];

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  role: "donor" | "admin";
  bloodGroup: BloodGroup;
  locality: string;
  city: string;
  pincode?: string;
  isAvailable?: boolean;
  isVerified?: boolean;
  lastDonatedDate?: string;
}

export interface Contact {
  tel: string;
  whatsapp: string;
}

export interface Donor extends User {
  contact: Contact;
}

export interface SOS {
  id?: string;
  _id?: string;
  patientName: string;
  bloodGroupNeeded: BloodGroup;
  unitsNeeded: number;
  hospitalName: string;
  hospitalAddress: string;
  locality: string;
  urgency: Urgency;
  status: string;
  expiresAt: string;
  requestedBy: {
    id?: string;
    _id?: string;
    name: string;
    phone: string;
    relation?: string;
  };
  createdAt: string;
  contact: Contact;
}

export interface Donation {
  id?: string;
  _id?: string;
  donatedAt?: string;
  createdAt?: string;
  hospitalName?: string;
  patientName?: string;
  bloodGroup?: BloodGroup;
}

export const entityId = (item: { id?: string; _id?: string }) => item.id ?? item._id ?? "";

// Red blood cell compatibility (mirrors the backend): O- is the universal donor, O+ gives to all positive groups, etc.
const antigens = (g: string) => ({ A: g.includes("A"), B: g.includes("B"), rh: g.endsWith("+") });
export const canDonate = (donor: string, recipient: string) => {
  const d = antigens(donor), r = antigens(recipient);
  return (!d.A || r.A) && (!d.B || r.B) && (!d.rh || r.rh);
};
export const donorGroupsFor = (needed: string) => BLOOD_GROUPS.filter((g) => canDonate(g, needed));
export const recipientGroupsOf = (donor: string) => BLOOD_GROUPS.filter((g) => canDonate(donor, g));
