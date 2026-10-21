import { useEffect, useState } from "react";
import { useToast } from "../contexts/ToastContext";
import { donorApi, errorMessage } from "../services/api";
import { BLOOD_GROUPS, donorGroupsFor, entityId, type Donor } from "../types";
import { EmptyState, Icon, PageHeader, Skeleton } from "../components/UI";

export default function Donors() {
  const { showToast } = useToast();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [bloodGroup, setBloodGroup] = useState("");
  const [locality, setLocality] = useState("");
  const [available, setAvailable] = useState(true);
  const [compatible, setCompatible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      donorApi.list({ bloodGroup: !compatible ? bloodGroup || undefined : undefined, compatibleWith: compatible ? bloodGroup || undefined : undefined, locality: locality || undefined, available: available || undefined, page, limit: 9 })
        .then(({ data }) => { setDonors((current) => page === 1 ? data.donors : [...current, ...data.donors]); setTotal(data.total); })
        .catch((error) => showToast(errorMessage(error, "Unable to load donors."), "error"))
        .finally(() => setLoading(false));
    }, locality ? 350 : 0);
    return () => window.clearTimeout(timer);
  }, [bloodGroup, compatible, locality, available, page, showToast]);

  function resetPage(run: () => void) { setPage(1); run(); }

  return (
    <>
      <PageHeader eyebrow="Donor directory" title="Find a donor" description="Search verified community donors by blood group and locality." />
      <section className="filter-panel donor-filters">
        <label className="search-field"><Icon name="search" /><input value={locality} onChange={(e) => resetPage(() => setLocality(e.target.value))} placeholder="Search locality" aria-label="Search locality" /></label>
        <select value={bloodGroup} onChange={(e) => resetPage(() => setBloodGroup(e.target.value))} aria-label="Blood group the patient needs"><option value="">All blood groups</option>{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select>
        <label className="switch-row"><span><b>Include compatible groups</b><small>{bloodGroup && compatible ? `Showing ${donorGroupsFor(bloodGroup).join(", ")} donors` : "e.g. O- can donate to anyone"}</small></span><input type="checkbox" checked={compatible} onChange={(e) => resetPage(() => setCompatible(e.target.checked))} /><i /></label>
        <label className="switch-row"><span><b>Available only</b><small>Ready to donate now</small></span><input type="checkbox" checked={available} onChange={(e) => resetPage(() => setAvailable(e.target.checked))} /><i /></label>
      </section>
      {loading && page === 1 ? <Skeleton /> : donors.length === 0 ? <EmptyState icon="users" title="No donors found" description="Try a nearby locality or a different blood group." /> : (
        <>
          <div className="donor-grid">{donors.map((donor) => <article className="donor-card" key={entityId(donor)}><div className="donor-top"><span className="avatar">{donor.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><span className="blood-badge small">{donor.bloodGroup}</span></div><div className="donor-name"><h2>{donor.name}</h2>{donor.isVerified && <span title="Verified donor"><Icon name="shield" /></span>}</div><p className="donor-location"><Icon name="location" />{donor.locality}, {donor.city}</p><span className={`availability ${donor.isAvailable ? "yes" : ""}`}><i />{donor.isAvailable ? "Available" : "Unavailable"}</span><div className="contact-actions"><a className="button call" href={donor.contact?.tel}><Icon name="phone" />Call</a><a className="button whatsapp" href={donor.contact?.whatsapp} target="_blank" rel="noreferrer"><Icon name="message" />WhatsApp</a></div></article>)}</div>
          {donors.length < total && <div className="load-more"><button className="button secondary" disabled={loading} onClick={() => setPage((value) => value + 1)}>{loading ? "Loading…" : `Load more (${total - donors.length} remaining)`}</button></div>}
        </>
      )}
    </>
  );
}
