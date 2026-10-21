import { Link } from "react-router";
import { Icon } from "../components/UI";

export default function NotFound() {
  return <main className="not-found"><span><Icon name="blood" /></span><p className="eyebrow">404</p><h1>Page not found</h1><p>The page you’re looking for doesn’t exist or has moved.</p><Link className="button primary" to="/sos-board">Return to SOS board</Link></main>;
}
