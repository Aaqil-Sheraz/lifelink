import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { donorApi, errorMessage, sosApi } from "../services/api";
import { BLOOD_GROUPS, entityId, type Donation, type SOS } from "../types";
import { ConfirmDialog, EmptyState, Field, Icon, PageHeader, SelectField } from "../components/UI";

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [history, setHistory] = useState<Donation[]>([]);
  const [mine, setMine] = useState<SOS[]>([]);
  const [serverCooldown, setCooldown] = useState<number | null>(null);
  const daysSinceDonation = user?.lastDonatedDate ? (Date.now() - new Date(user.lastDonatedDate).getTime()) / 86400000 : null;
  const derivedCooldown = !user?.isAvailable && daysSinceDonation !== null && daysSinceDonation < 90 ? Math.ceil(90 - daysSinceDonation) : null;
  const cooldown = derivedCooldown ?? serverCooldown;
  const [confirmDonation, setConfirmDonation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: user?.name ?? "", phone: user?.phone ?? "", bloodGroup: user?.bloodGroup ?? "O+", locality: user?.locality ?? "", city: user?.city ?? "", pincode: user?.pincode ?? "" });

  useEffect(() => {
    Promise.all([donorApi.history(), sosApi.mine()])
      .then(([historyResponse, mineResponse]) => { setHistory(historyResponse.data); setMine(mineResponse.data); })
      .catch((error) => showToast(errorMessage(error, "Unable to load dashboard activity."), "error"));
  }, [showToast]);

  async function toggleAvailability() {
    if (cooldown !== null) return;
    try {
      const { data } = await donorApi.availability();
      setCooldown(null);
      if (user) updateUser({ ...user, isAvailable: data.isAvailable });
      showToast(data.isAvailable ? "You are now visible as available." : "Your availability is paused.");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const days = (error.response.data as { daysRemaining?: number }).daysRemaining;
        if (typeof days === "number") setCooldown(days);
      }
      showToast(errorMessage(error, "Unable to update availability."), "error");
    }
  }

  async function markDonated() {
    try {
      const { data } = await donorApi.donated();
      updateUser(data.user);
      showToast(data.message);
      setConfirmDonation(false);
      const response = await donorApi.history();
      setHistory(response.data);
    } catch (error) { showToast(errorMessage(error, "Unable to record donation."), "error"); }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await donorApi.updateProfile(form);
      updateUser(data.user);
      showToast("Profile updated successfully.");
    } catch (error) { showToast(errorMessage(error, "Unable to update profile."), "error"); }
    finally { setSaving(false); }
  }

  async function fulfill(id: string) {
    try {
      const { data } = await sosApi.fulfill(id);
      setMine((items) => items.map((item) => entityId(item) === id ? data : item));
      showToast("SOS request marked as fulfilled.");
    } catch (error) { showToast(errorMessage(error, "Unable to mark this request fulfilled."), "error"); }
  }

  return (
    <>
      <PageHeader eyebrow="My LifeLink" title={`Hello, ${user?.name?.split(" ")[0]}`} description="Manage your donor status, profile, donation history and requests." />
      <section className="dashboard-grid">
        <article className="status-card">
          <div className="status-card-head"><div><p className="eyebrow">Donor status</p><h2>{user?.isAvailable ? "Ready to help" : "Currently unavailable"}</h2></div><span className={user?.isAvailable ? "available" : ""}><Icon name="heart" /></span></div>
          <div className="availability-control"><span><i className={user?.isAvailable ? "on" : ""} /><span><b>{user?.isAvailable ? "Available to donate" : "Not available"}</b><small>{cooldown !== null ? `Available again in ${cooldown} days` : "Visible to people nearby"}</small></span></span><button className={`toggle ${user?.isAvailable ? "on" : ""}`} aria-label="Toggle donor availability" disabled={cooldown !== null} onClick={toggleAvailability}><i /></button></div>
          {cooldown !== null && <p className="cooldown"><Icon name="clock" />Donation recovery lock: available again in {cooldown} days.</p>}
          <button className="button secondary donated-button" onClick={() => setConfirmDonation(true)}><Icon name="blood" />I donated blood</button>
        </article>
        <article className="profile-summary"><span className="profile-avatar">{user?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><div><h2>{user?.name}</h2><p><Icon name="location" />{user?.locality}, {user?.city}</p><span className="verified"><Icon name="shield" />{user?.isVerified ? "Verified donor" : "Verification pending"}</span></div><span className="blood-badge">{user?.bloodGroup}</span></article>
      </section>
      <section className="dashboard-sections">
        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">Giving history</p><h2>Donation history</h2></div><Icon name="calendar" /></div>
          {history.length === 0 ? <EmptyState icon="blood" title="No donations recorded" description="Your donations will appear here." /> : <div className="activity-list">{history.map((item, index) => <div key={item.id ?? item._id ?? index}><span><Icon name="blood" /></span><div><b>{item.patientName ?? "Blood donation"}</b><small>{item.hospitalName ?? "Hospital donation"}</small></div><time>{new Date(item.donatedAt ?? item.createdAt ?? "").toLocaleDateString()}</time></div>)}</div>}
        </article>
        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">Requests</p><h2>My SOS requests</h2></div><Icon name="alert" /></div>
          {mine.length === 0 ? <EmptyState icon="alert" title="No SOS requests" description="Requests you create will appear here." /> : <div className="activity-list sos-mine">{mine.map((item) => <div key={entityId(item)}><span className="blood-mini">{item.bloodGroupNeeded}</span><div><b>{item.patientName}</b><small>{item.hospitalName} · {item.status}</small></div>{item.status === "active" && <button className="button tiny" onClick={() => fulfill(entityId(item))}>Mark fulfilled</button>}</div>)}</div>}
        </article>
      </section>
      <section className="panel edit-profile">
        <div className="panel-heading"><div><p className="eyebrow">Personal details</p><h2>Edit profile</h2></div><Icon name="edit" /></div>
        <form onSubmit={saveProfile}>
          <Field label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} />
          <SelectField label="Blood group" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value as typeof form.bloodGroup })}>{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</SelectField>
          <Field label="Locality" required value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })} />
          <Field label="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Field label="Pincode" required value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })} />
          <button className="button primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
        </form>
      </section>
      {confirmDonation && <ConfirmDialog title="Record a blood donation?" description="This will make you unavailable to donate for 90 days so your body has time to recover." confirmLabel="Yes, I donated" onConfirm={markDonated} onCancel={() => setConfirmDonation(false)} />}
    </>
  );
}
