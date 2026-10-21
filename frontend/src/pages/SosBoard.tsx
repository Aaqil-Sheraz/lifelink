import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { useToast } from "../contexts/ToastContext";
import { errorMessage, sosApi } from "../services/api";
import { BLOOD_GROUPS, entityId, recipientGroupsOf, type SOS } from "../types";
import { EmptyState, Icon, PageHeader, Skeleton } from "../components/UI";

function hoursLeft(date: string) {
  const hours = Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 3600000));
  return hours ? `${hours}h left` : "Expiring soon";
}

export default function SosBoard() {
  const [items, setItems] = useState<SOS[]>([]);
  const [loading, setLoading] = useState(true);
  const [bloodGroup, setBloodGroup] = useState("");
  const [locality, setLocality] = useState("");
  const [canHelp, setCanHelp] = useState(false);
  const { user } = useAuth();
  const [query] = useSearchParams();
  const { event } = useSocket();
  const { showToast } = useToast();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      sosApi.active({ bloodGroup: bloodGroup || undefined, canDonate: canHelp ? user?.bloodGroup : undefined, locality: locality || undefined })
        .then(({ data }) => setItems([...data].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))))
        .catch((error) => showToast(errorMessage(error, "Unable to load active SOS requests."), "error"))
        .finally(() => setLoading(false));
    }, locality ? 350 : 0);
    return () => window.clearTimeout(timer);
  }, [bloodGroup, locality, canHelp, user?.bloodGroup, showToast]);

  useEffect(() => {
    if (!event) return;
    if (event.type === "new") setItems((current) => [event.payload, ...current.filter((item) => entityId(item) !== entityId(event.payload))]);
    else setItems((current) => current.filter((item) => entityId(item) !== event.payload.id));
  }, [event]);

  const focusId = query.get("focus");
  const cards = useMemo(() => items.filter((item) => item.status === "active"), [items]);

  return (
    <>
      <PageHeader eyebrow="Live requests" title="SOS Board" description="Active blood requests, updated in real time for your community." action={<Link className="button primary header-action" to="/post-sos"><Icon name="plus" />Post SOS</Link>} />
      <section className="filter-panel" aria-label="Filter requests">
        <div className="filter-label">Blood group</div>
        <div className="blood-chips compact"><button className={!bloodGroup ? "active" : ""} onClick={() => setBloodGroup("")}>All</button>{BLOOD_GROUPS.map((group) => <button key={group} className={bloodGroup === group ? "active" : ""} onClick={() => setBloodGroup(group)}>{group}</button>)}</div>
        {user?.bloodGroup && <label className="switch-row"><span><b>Requests I can help with</b><small>{user.bloodGroup} can donate to {recipientGroupsOf(user.bloodGroup).join(", ")}</small></span><input type="checkbox" checked={canHelp} onChange={(e) => setCanHelp(e.target.checked)} /><i /></label>}
        <label className="search-field"><Icon name="location" /><input value={locality} onChange={(e) => setLocality(e.target.value)} placeholder="Filter by locality" aria-label="Filter by locality" /></label>
      </section>
      {loading ? <Skeleton /> : cards.length === 0 ? <EmptyState icon="alert" title="No active requests in your area" description="Try changing the blood group or locality filters. New SOS alerts will appear here live." /> : (
        <div className="card-grid">
          {cards.map((sos) => <SOSCard key={entityId(sos)} sos={sos} focused={focusId === entityId(sos)} />)}
        </div>
      )}
      <Link className="floating-sos" to="/post-sos"><Icon name="plus" />Post SOS</Link>
    </>
  );
}

export function SOSCard({ sos, focused = false, adminAction }: { sos: SOS; focused?: boolean; adminAction?: React.ReactNode }) {
  const urgencyLabels = { critical: "Critical", "within 24h": "Within 24h", planned: "Planned" };
  return (
    <article className={`sos-card ${focused ? "focused" : ""}`} id={`sos-${entityId(sos)}`}>
      <div className="sos-card-top">
        <span className="blood-badge">{sos.bloodGroupNeeded}</span>
        <div className="sos-title"><span className={`urgency ${sos.urgency.replace(" ", "-")}`}>{urgencyLabels[sos.urgency]}</span><h2>{sos.patientName}</h2><p>{sos.unitsNeeded} {sos.unitsNeeded === 1 ? "unit" : "units"} needed</p></div>
        <span className="expires"><Icon name="clock" />{hoursLeft(sos.expiresAt)}</span>
      </div>
      <div className="sos-details">
        <p><Icon name="location" /><span><b>{sos.hospitalName}</b><small>{sos.hospitalAddress}</small></span></p>
        <p><Icon name="home" /><span><b>{sos.locality}</b><small>Requested by {sos.requestedBy?.name}{sos.requestedBy?.relation ? ` · ${sos.requestedBy.relation}` : ""}</small></span></p>
      </div>
      <div className="contact-actions">
        <a className="button call" href={sos.contact?.tel}><Icon name="phone" />Call</a>
        <a className="button whatsapp" href={sos.contact?.whatsapp} target="_blank" rel="noreferrer"><Icon name="message" />WhatsApp</a>
        {adminAction}
      </div>
    </article>
  );
}
