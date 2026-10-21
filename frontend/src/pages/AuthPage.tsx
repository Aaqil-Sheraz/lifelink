import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { errorMessage } from "../services/api";
import { BLOOD_GROUPS, type BloodGroup } from "../types";
import { Brand, Field, Icon } from "../components/UI";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>("O+");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", locality: "", city: "", pincode: "" });

  function change(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!isLogin && !/^\d{10}$/.test(form.phone)) return showToast("Enter a valid 10-digit phone number.", "error");
    if (!isLogin && form.password.length < 6) return showToast("Password must be at least 6 characters.", "error");
    setSubmitting(true);
    try {
      const user = isLogin
        ? await login(form.email, form.password)
        : await register({ ...form, bloodGroup });
      navigate(user.role === "admin" ? "/admin" : "/sos-board", { replace: true });
    } catch (error) {
      showToast(errorMessage(error, `Unable to ${isLogin ? "sign in" : "create your account"}.`), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-form-side">
        <Link to="/login" className="auth-brand"><Brand /></Link>
        <div className="auth-form-wrap">
          <p className="eyebrow">{isLogin ? "Welcome back" : "Join the network"}</p>
          <h1>{isLogin ? "Sign in to LifeLink" : "Become a LifeLink donor"}</h1>
          <p className="auth-intro">{isLogin ? "Respond to urgent requests and manage your donor profile." : "Help your neighbourhood find safe blood donations faster."}</p>
          <form onSubmit={submit} className="auth-form">
            {!isLogin && <Field label="Full name" required autoComplete="name" value={form.name} onChange={(e) => change("name", e.target.value)} placeholder="Your full name" />}
            <Field label="Email address" required type="email" autoComplete="email" value={form.email} onChange={(e) => change("email", e.target.value)} placeholder="you@example.com" />
            {!isLogin && (
              <>
                <Field label="Phone number" required inputMode="numeric" pattern="\d{10}" maxLength={10} value={form.phone} onChange={(e) => change("phone", e.target.value.replace(/\D/g, ""))} placeholder="10-digit number" />
                <div className="field full"><span>Blood group</span><div className="blood-chips">{BLOOD_GROUPS.map((group) => <button type="button" key={group} onClick={() => setBloodGroup(group)} className={bloodGroup === group ? "active" : ""}>{group}</button>)}</div></div>
                <Field label="Locality" required value={form.locality} onChange={(e) => change("locality", e.target.value)} placeholder="Neighbourhood or society" />
                <Field label="City" required value={form.city} onChange={(e) => change("city", e.target.value)} placeholder="City" />
                <Field label="Pincode" required inputMode="numeric" pattern="\d{6}" maxLength={6} value={form.pincode} onChange={(e) => change("pincode", e.target.value.replace(/\D/g, ""))} placeholder="6-digit pincode" />
              </>
            )}
            <Field label="Password" required type="password" minLength={isLogin ? undefined : 6} autoComplete={isLogin ? "current-password" : "new-password"} value={form.password} onChange={(e) => change("password", e.target.value)} placeholder={isLogin ? "Enter your password" : "At least 6 characters"} className={isLogin ? "full" : ""} />
            <button className="button primary full submit-button" type="submit" disabled={submitting}>
              {submitting ? <span className="spinner" /> : <Icon name={isLogin ? "heart" : "plus"} />}
              {submitting ? "Please wait…" : isLogin ? "Sign in" : "Create donor account"}
            </button>
          </form>
          <p className="auth-switch">{isLogin ? "New to LifeLink?" : "Already have an account?"} <Link to={isLogin ? "/register" : "/login"}>{isLogin ? "Create an account" : "Sign in"}</Link></p>
        </div>
        <p className="auth-disclaimer">Secure connections for urgent community care.</p>
      </section>
      <aside className="auth-story">
        <div className="story-live"><span /> Community-powered response</div>
        <div>
          <span className="story-icon"><Icon name="blood" /></span>
          <h2>One quick response can change everything.</h2>
          <p>Connect verified donors with nearby families when every minute matters.</p>
          <div className="story-points">
            <span><Icon name="shield" /><b>Trusted</b><small>Verified donor network</small></span>
            <span><Icon name="location" /><b>Local</b><small>Neighbourhood matching</small></span>
            <span><Icon name="alert" /><b>Immediate</b><small>Real-time SOS alerts</small></span>
          </div>
        </div>
      </aside>
    </main>
  );
}
