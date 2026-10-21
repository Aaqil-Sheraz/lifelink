import { useEffect, useState } from "react";
import { useToast } from "../contexts/ToastContext";
import { adminApi, errorMessage, sosApi } from "../services/api";
import { entityId, type Donor, type SOS } from "../types";
import { ConfirmDialog, EmptyState, Icon, PageHeader, Skeleton } from "../components/UI";

export default function Admin() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<{ donors: number; verifiedDonors: number; activeSOS: number; fulfilled: number; expired: number } | null>(null);
  const [pending, setPending] = useState<Donor[]>([]);
  const [sos, setSos] = useState<SOS[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeId, setRemoveId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([adminApi.stats(), adminApi.pending(), adminApi.sos()])
      .then(([statsResponse, pendingResponse, sosResponse]) => { setStats(statsResponse.data); setPending(pendingResponse.data); setSos(sosResponse.data); })
      .catch((error) => showToast(errorMessage(error, "Unable to load admin dashboard."), "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  async function approve(id: string) {
    try { await adminApi.verify(id); setPending((items) => items.filter((item) => entityId(item) !== id)); setStats((value) => value ? { ...value, verifiedDonors: value.verifiedDonors + 1 } : value); showToast("Donor approved and verified."); }
    catch (error) { showToast(errorMessage(error, "Unable to verify donor."), "error"); }
  }
  async function remove() {
    if (!removeId) return;
    try { await sosApi.remove(removeId); setSos((items) => items.filter((item) => entityId(item) !== removeId)); setRemoveId(null); showToast("SOS post removed."); }
    catch (error) { showToast(errorMessage(error, "Unable to remove SOS post."), "error"); }
  }

  return (
    <>
      <PageHeader eyebrow="Administration" title="Community overview" description="Verify donors and keep emergency requests safe and accurate." />
      {loading ? <Skeleton count={4} /> : <>
        <section className="stats-grid">{[
          ["Registered donors", stats?.donors ?? 0, "users"],
          ["Verified donors", stats?.verifiedDonors ?? 0, "shield"],
          ["Active SOS", stats?.activeSOS ?? 0, "alert"],
          ["Fulfilled", stats?.fulfilled ?? 0, "check"],
          ["Expired", stats?.expired ?? 0, "clock"],
        ].map(([label, value, icon]) => <article key={String(label)}><span><Icon name={icon as "users"} /></span><div><b>{value}</b><small>{label}</small></div></article>)}</section>
        <section className="admin-columns">
          <article className="panel">
            <div className="panel-heading"><div><p className="eyebrow">Verification queue</p><h2>Pending donors</h2></div><span className="count-badge">{pending.length}</span></div>
            {pending.length === 0 ? <EmptyState icon="shield" title="All caught up" description="There are no donors waiting for verification." /> : <div className="admin-list">{pending.map((donor) => <div key={entityId(donor)}><span className="avatar">{donor.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><div><b>{donor.name}</b><small>{donor.bloodGroup} · {donor.locality}, {donor.city}</small></div><button className="button approve" onClick={() => approve(entityId(donor))}><Icon name="check" />Approve</button></div>)}</div>}
          </article>
          <article className="panel">
            <div className="panel-heading"><div><p className="eyebrow">Moderation</p><h2>All SOS posts</h2></div><span className="count-badge red">{sos.length}</span></div>
            {sos.length === 0 ? <EmptyState icon="alert" title="No SOS posts" description="SOS requests will appear here for moderation." /> : <div className="admin-list sos-admin">{sos.map((item) => <div key={entityId(item)}><span className="blood-mini">{item.bloodGroupNeeded}</span><div><b>{item.patientName}</b><small>{item.hospitalName} · <em className={item.status}>{item.status}</em></small></div><button className="button remove" onClick={() => setRemoveId(entityId(item))}>Remove</button></div>)}</div>}
          </article>
        </section>
      </>}
      {removeId && <ConfirmDialog destructive title="Remove this SOS post?" description="This immediately removes the request for all users. This action cannot be undone." confirmLabel="Remove post" onConfirm={remove} onCancel={() => setRemoveId(null)} />}
    </>
  );
}
