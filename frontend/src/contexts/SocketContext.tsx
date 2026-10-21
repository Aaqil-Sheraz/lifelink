import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../services/api";
import type { SOS } from "../types";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

export type SocketEvent =
  | { type: "new"; payload: SOS; key: number }
  | { type: "fulfilled" | "removed"; payload: { id: string }; key: number };

const SocketContext = createContext<{ connected: boolean; event: SocketEvent | null }>({ connected: false, event: null });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const room = `${user?.locality ?? ""}:${user?.bloodGroup ?? ""}`;
  const { showToast } = useToast();
  const [connected, setConnected] = useState(false);
  const [event, setEvent] = useState<SocketEvent | null>(null);

  useEffect(() => {
    if (!token) {
      setConnected(false);
      return;
    }
    const socket = io(SOCKET_URL, { auth: { token } });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("sos:new", (sos: SOS) => {
      setEvent({ type: "new", payload: sos, key: Date.now() });
      showToast(`URGENT: ${sos.bloodGroupNeeded} needed at ${sos.hospitalName}`, "urgent", {
        label: "View",
        onClick: () => window.location.assign(`/sos-board?focus=${sos.id ?? sos._id}`),
      });
    });
    socket.on("sos:fulfilled", (payload: { id: string }) => setEvent({ type: "fulfilled", payload, key: Date.now() }));
    socket.on("sos:removed", (payload: { id: string }) => setEvent({ type: "removed", payload, key: Date.now() }));
    return () => {
      socket.disconnect();
    };
    // `room` is a dependency so the socket reconnects (and re-joins the right room) after a profile edit
  }, [token, room, showToast]);

  return <SocketContext.Provider value={{ connected, event }}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
