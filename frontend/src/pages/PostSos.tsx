import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { errorMessage, sosApi } from "../services/api";
import { BLOOD_GROUPS, URGENCIES, donorGroupsFor, type BloodGroup, type Urgency } from "../types";
import { Field, Icon, PageHeader, SelectField, TextareaField } from "../components/UI";

export default function PostSos() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ matched: number; online: number; locality: string } | null>(null);
  const [form, setForm] = useState({
    patientName: "", bloodGroupNeeded: "O+" as BloodGroup, unitsNeeded: 1, hospitalName: "", hospitalAddress: "",
    locality: user?.locality ?? "", urgency: "critical" as Urgency, contactName: user?.name ?? "", contactPhone: user?.phone ?? "", relation: "",
  });

  const set = (key: keyof typeof form, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (form.contactPhone && !/^\d{10}$/.test(form.contactPhone)) return showToast("Enter a valid 10-digit contact number.", "error");
    setSubmitting(true);
    try {
      const { data } = await sosApi.create(form);
      setSuccess({ matched: data.matchedDonors, online: data.alertedOnline ?? 0, locality: form.locality });
    } catch (error) {
      showToast(errorMessage(error, "Unable to send the SOS alert."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) return <div className="success-state"><span><Icon name="check" /></span><p className="eyebrow">Alert sent</p><h1>Your community has been notified</h1><p>Alert sent to <b>{success.matched} matching donors</b> in {success.locality}. <b>{success.online}</b> of them {success.online === 1 ? "is" : "are"} online and received the live alert now; the rest will see it on the SOS board.</p><div><Link className="button primary" to="/sos-board">View SOS board</Link><button className="button secondary" onClick={() => setSuccess(null)}>Post another</button></div></div>;

  return (
    <>
      <PageHeader eyebrow="Emergency request" title="Post an SOS alert" description="Share accurate details so nearby matching donors can respond quickly." />
      <form className="form-card sos-form" onSubmit={submit}>
        <div className="form-section-heading"><span>1</span><div><h2>Patient & blood requirement</h2><p>Who needs help and what is required?</p></div></div>
        <Field label="Patient name" required value={form.patientName} onChange={(e) => set("patientName", e.target.value)} placeholder="Patient's full name" />
        <SelectField label="Blood group needed" value={form.bloodGroupNeeded} onChange={(e) => set("bloodGroupNeeded", e.target.value)}>{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</SelectField>
        <p className="help-text">Donors with {donorGroupsFor(form.bloodGroupNeeded).join(", ")} blood will be alerted.</p>
        <div className="field"><span>Units needed</span><div className="stepper"><button type="button" aria-label="Decrease units" onClick={() => set("unitsNeeded", Math.max(1, form.unitsNeeded - 1))}>−</button><b>{form.unitsNeeded}</b><button type="button" aria-label="Increase units" onClick={() => set("unitsNeeded", form.unitsNeeded + 1)}>+</button></div></div>
        <div className="field full"><span>Urgency</span><div className="segments">{URGENCIES.map((urgency) => <button type="button" key={urgency} className={form.urgency === urgency ? "active" : ""} onClick={() => set("urgency", urgency)}>{urgency === "critical" ? "Critical" : urgency === "within 24h" ? "Within 24h" : "Planned"}</button>)}</div></div>
        <div className="form-divider" />
        <div className="form-section-heading full"><span>2</span><div><h2>Hospital details</h2><p>Help donors reach the right place.</p></div></div>
        <Field label="Hospital name" required value={form.hospitalName} onChange={(e) => set("hospitalName", e.target.value)} placeholder="Hospital name" />
        <Field label="Locality" required value={form.locality} onChange={(e) => set("locality", e.target.value)} placeholder="Hospital locality" />
        <TextareaField label="Hospital address" required className="full" value={form.hospitalAddress} onChange={(e) => set("hospitalAddress", e.target.value)} placeholder="Full address with nearby landmark" />
        <div className="form-divider" />
        <div className="form-section-heading full"><span>3</span><div><h2>Contact person</h2><p>Optional; your profile details are pre-filled.</p></div></div>
        <Field label="Contact name" value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Contact person" />
        <Field label="Contact phone" inputMode="numeric" maxLength={10} value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value.replace(/\D/g, ""))} placeholder="10-digit number" />
        <Field label="Relation to patient" className="full" value={form.relation} onChange={(e) => set("relation", e.target.value)} placeholder="e.g. Parent, friend, self" />
        <button className="button primary full send-sos" type="submit" disabled={submitting}>{submitting ? <span className="spinner" /> : <Icon name="alert" />}{submitting ? "Sending alert…" : "Send SOS Alert"}</button>
        <p className="form-note full"><Icon name="shield" />Only post verified medical needs. Donors will still be screened by the hospital.</p>
      </form>
    </>
  );
}
