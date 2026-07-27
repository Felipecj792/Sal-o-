import React, { useState, useEffect, useMemo } from "react";
import {
  Scissors, Calendar, Users, Plus, X, Check, Clock, Phone,
  Search, ChevronLeft, ChevronRight, Trash2, Pencil, DollarSign,
  Ban, Sparkles
} from "lucide-react";

const C = {
  bg: "#FBF6F3",
  surface: "#FFFFFF",
  border: "#EEE0DC",
  wine: "#5B2333",
  wineDeep: "#42192A",
  wineSoft: "#7A3347",
  gold: "#B8935A",
  goldSoft: "#E9D9BE",
  blush: "#F1DCD8",
  text: "#2A1F22",
  textMuted: "#8A7477",
  success: "#4F7A5B",
  successBg: "#E7F0E9",
  danger: "#A54848",
  dangerBg: "#F6E7E7",
};

const WEEKDAYS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const DEFAULT_SERVICES = [
  { id: "s1", name: "Corte feminino", duration: 45, price: 70 },
  { id: "s2", name: "Escova", duration: 40, price: 60 },
  { id: "s3", name: "Coloração", duration: 120, price: 180 },
  { id: "s4", name: "Hidratação", duration: 50, price: 90 },
  { id: "s5", name: "Manicure", duration: 30, price: 35 },
];

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function toISODate(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function prettyDate(d) {
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}
function prettyDateShort(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}
function money(n) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function loadKey(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

function Btn({ children, onClick, variant = "primary", type = "button", style, disabled, small }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center",
    borderRadius: 12, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid transparent", transition: "transform .12s ease, opacity .12s ease",
    padding: small ? "6px 12px" : "10px 18px", fontSize: small ? 13 : 14, opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary: { background: C.wine, color: "#fff" },
    ghost: { background: "transparent", color: C.wine, border: "1px solid " + C.border },
    subtle: { background: C.blush, color: C.wineDeep },
    danger: { background: C.dangerBg, color: C.danger },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, letterSpacing: 0.3, textTransform: "uppercase" }}>{label}</span>
      <div style={{ marginTop: 6 }}>{children}</div>
    </label>
  );
}
const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid " + C.border,
  fontSize: 14, color: C.text, background: "#fff", outline: "none", boxSizing: "border-box",
};

function Modal({ title, onClose, children, wide }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(42,31,34,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: C.surface, borderRadius: 20, width: "100%", maxWidth: wide ? 520 : 420, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(66,25,42,0.25)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid " + C.border }}>
          <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.wineDeep }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4 }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    agendado: { bg: C.goldSoft, color: "#7A5A22", label: "Agendado" },
    concluido: { bg: C.successBg, color: C.success, label: "Concluído" },
    cancelado: { bg: C.dangerBg, color: C.danger, label: "Cancelado" },
  };
  const s = map[status] || map.agendado;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, textTransform: "uppercase", letterSpacing: 0.4 }}>
      {s.label}
    </span>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [tab, setTab] = useState("hoje");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [search, setSearch] = useState("");
  const [expandedClient, setExpandedClient] = useState(null);
  const [apptModal, setApptModal] = useState(null);
  const [clientModal, setClientModal] = useState(null);
  const [serviceModal, setServiceModal] = useState(null);

  useEffect(() => {
    (async () => {
      const [c, s, a] = await Promise.all([
        loadKey("salon_clients_v1", []),
        loadKey("salon_services_v1", DEFAULT_SERVICES),
        loadKey("salon_appointments_v1", []),
      ]);
      setClients(c);
      setServices(s);
      setAppointments(a);
      setLoaded(true);
    })();
  }, []);
  useEffect(() => { if (loaded) saveKey("salon_clients_v1", clients); }, [clients, loaded]);
  useEffect(() => { if (loaded) saveKey("salon_services_v1", services); }, [services, loaded]);
  useEffect(() => { if (loaded) saveKey("salon_appointments_v1", appointments); }, [appointments, loaded]);

  const clientMap = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients]);
  const serviceMap = useMemo(() => Object.fromEntries(services.map((s) => [s.id, s])), [services]);

  const todayISO = toISODate(new Date());
  const viewISO = toISODate(currentDate);

  const dayAppointments = useMemo(
    () => appointments.filter((a) => a.date === viewISO).sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, viewISO]
  );
  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.date === todayISO).sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, todayISO]
  );
  const todayRevenue = todayAppointments
    .filter((a) => a.status !== "cancelado")
    .reduce((sum, a) => sum + (serviceMap[a.serviceId]?.price || 0), 0);

  const monthPrefix = todayISO.slice(0, 7);
  const monthRevenue = appointments
    .filter((a) => a.date.startsWith(monthPrefix) && a.status === "concluido")
    .reduce((sum, a) => sum + (serviceMap[a.serviceId]?.price || 0), 0);

  function upsertAppointment(data) {
    setAppointments((prev) => {
      const exists = prev.some((a) => a.id === data.id);
      return exists ? prev.map((a) => (a.id === data.id ? data : a)) : [...prev, data];
    });
  }
  function deleteAppointment(id) {
    if (window.confirm("Excluir este agendamento?")) {
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    }
  }
  function setApptStatus(id, status) {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }
  function upsertClient(data) {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === data.id);
      return exists ? prev.map((c) => (c.id === data.id ? data : c)) : [...prev, data];
    });
  }
  function deleteClient(id) {
    if (window.confirm("Excluir cliente? Os agendamentos vinculados serão mantidos, mas sem cliente associado.")) {
      setClients((prev) => prev.filter((c) => c.id !== id));
    }
  }
  function upsertService(data) {
    setServices((prev) => {
      const exists = prev.some((s) => s.id === data.id);
      return exists ? prev.map((s) => (s.id === data.id ? data : s)) : [...prev, data];
    });
  }
  function deleteService(id) {
    if (window.confirm("Excluir este serviço?")) {
      setServices((prev) => prev.filter((s) => s.id !== id));
    }
  }

  function exportBackup() {
    const data = { clients, services, appointments };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "backup_" + todayISO + ".json";
    link.click();
  }

  function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.clients) setClients(data.clients);
        if (data.services) setServices(data.services);
        if (data.appointments) setAppointments(data.appointments);
        alert("✅ Backup restaurado com sucesso!");
      } catch {
        alert("❌ Arquivo inválido.");
      }
    };
    reader.readAsText(file);
  }

  const filteredClients = clients.filter((c) =>
    (c.name + " " + (c.phone || "")).toLowerCase().includes(search.toLowerCase())
  );

  const NAV = [
    { id: "hoje", label: "Hoje", icon: Sparkles },
    { id: "agenda", label: "Agenda", icon: Calendar },
    { id: "clientes", label: "Clientes", icon: Users },
    { id: "servicos", label: "Serviços", icon: Scissors },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: ${C.blush}; }
        input:focus, select:focus, textarea:focus { border-color: ${C.gold} !important; box-shadow: 0 0 0 3px ${C.goldSoft}; }
      `}</style>

      <div style={{ height: 4, background: "linear-gradient(90deg, " + C.wine + ", " + C.gold + ")" }} />

      <header style={{ padding: "20px 20px 0", maxWidth: 880, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: C.wine, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Scissors size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 24, color: C.wineDeep, lineHeight: 1.1 }}>
                Salão da Maria
              </h1>
              <span style={{ fontSize: 12.5, color: C.textMuted }}>agendamento &amp; gestão de clientes</span>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 6 }}>
            <Btn small variant="ghost" onClick={exportBackup}>
              💾 Backup
            </Btn>
            <label style={{ cursor: "pointer" }}>
              <Btn small variant="ghost">
                📂 Restaurar
              </Btn>
              <input type="file" accept=".json" onChange={importBackup} style={{ display: "none" }} />
            </label>
          </div>
        </div>

        <nav style={{ display: "flex", gap: 6, marginTop: 18, borderBottom: "1px solid " + C.border, overflowX: "auto" }}>
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = tab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "none", border: "none",
                  borderBottom: active ? "2px solid " + C.wine : "2px solid transparent", color: active ? C.wineDeep : C.textMuted,
                  fontWeight: active ? 700 : 500, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                <Icon size={16} /> {n.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "20px 20px 60px" }}>
        {!loaded ? (
          <div style={{ textAlign: "center", padding: 60, color: C.textMuted }}>Carregando...</div>
        ) : tab === "hoje" ? (
          <HojeView
            todayAppointments={todayAppointments}
            clientMap={clientMap}
            serviceMap={serviceMap}
            todayRevenue={todayRevenue}
            monthRevenue={monthRevenue}
            onNew={() => setApptModal({ defaultDate: todayISO })}
            onStatus={setApptStatus}
            onDelete={deleteAppointment}
            onEdit={(a) => setApptModal({ editing: a })}
          />
        ) : tab === "agenda" ? (
          <AgendaView
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            dayAppointments={dayAppointments}
            clientMap={clientMap}
            serviceMap={serviceMap}
            onNew={() => setApptModal({ defaultDate: viewISO })}
            onStatus={setApptStatus}
            onDelete={deleteAppointment}
            onEdit={(a) => setApptModal({ editing: a })}
          />
        ) : tab === "clientes" ? (
          <ClientesView
            clients={filteredClients}
            search={search}
            setSearch={setSearch}
            appointments={appointments}
            serviceMap={serviceMap}
            expandedClient={expandedClient}
            setExpandedClient={setExpandedClient}
            onNew={() => setClientModal({})}
            onEdit={(c) => setClientModal({ editing: c })}
            onDelete={deleteClient}
          />
        ) : (
          <ServicosView services={services} onNew={() => setServiceModal({})} onEdit={(s) => setServiceModal({ editing: s })} onDelete={deleteService} />
        )}
      </main>

      <footer style={{ textAlign: "center", padding: "20px", color: C.textMuted, fontSize: 12, borderTop: "1px solid " + C.border, maxWidth: 880, margin: "0 auto" }}>
        © {new Date().getFullYear()} · Salão da Maria · v1.0 · Feito com 💇
      </footer>

      {apptModal && (
        <AppointmentModal
          data={apptModal}
          clients={clients}
          services={services}
          onClose={() => setApptModal(null)}
          onSave={(appt) => { upsertAppointment(appt); setApptModal(null); }}
          onCreateClient={(c) => upsertClient(c)}
        />
      )}
      {clientModal && (
        <ClientModal
          data={clientModal}
          onClose={() => setClientModal(null)}
          onSave={(c) => { upsertClient(c); setClientModal(null); }}
        />
      )}
      {serviceModal && (
        <ServiceModal
          data={serviceModal}
          onClose={() => setServiceModal(null)}
          onSave={(s) => { upsertService(s); setServiceModal(null); }}
        />
      )}
    </div>
  );
}
function ApptRow({ a, client, service, onStatus, onDelete, onEdit }) {
  const cancelled = a.status === "cancelado";
  const statusColors = {
    agendado: { bg: C.goldSoft, color: "#7A5A22" },
    concluido: { bg: C.successBg, color: C.success },
    cancelado: { bg: C.dangerBg, color: C.danger },
  };
  const currentStatus = statusColors[a.status] || statusColors.agendado;

  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        marginBottom: 16,
        background: C.surface,
        borderRadius: 16,
        padding: "14px 18px",
        border: "1px solid " + C.border,
        boxShadow: "0 2px 8px rgba(91, 35, 51, 0.06)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        opacity: cancelled ? 0.6 : 1,
        cursor: "default",
      }}
    >
      {/* Horário */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 56,
          background: C.blush,
          borderRadius: 12,
          padding: "6px 10px",
        }}
      >
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 700,
            fontSize: 18,
            color: C.wineDeep,
            lineHeight: 1.2,
          }}
        >
          {a.time}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            textTransform: "uppercase",
            color: C.textMuted,
            letterSpacing: 0.5,
          }}
        >
          Horário
        </span>
      </div>

      {/* Conteúdo principal */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: C.wineDeep,
                textDecoration: cancelled ? "line-through" : "none",
              }}
            >
              {client?.name || "Cliente removido"}
            </div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 1 }}>
              {service?.name || "Serviço removido"}
              <span style={{ fontWeight: 600, color: C.wine, marginLeft: 6 }}>
                {service ? money(service.price) : ""}
              </span>
            </div>
            {a.notes && (
              <div
                style={{
                  fontSize: 12.5,
                  color: C.textMuted,
                  marginTop: 4,
                  fontStyle: "italic",
                  background: C.bg,
                  padding: "2px 10px",
                  borderRadius: 8,
                  display: "inline-block",
                }}
              >
                ✏️ {a.notes}
              </div>
            )}
          </div>

          {/* Status */}
          <span
            style={{
              background: currentStatus.bg,
              color: currentStatus.color,
              fontSize: 10,
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: 999,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              whiteSpace: "nowrap",
            }}
          >
            {a.status === "agendado" && "📌 Agendado"}
            {a.status === "concluido" && "✅ Concluído"}
            {a.status === "cancelado" && "❌ Cancelado"}
          </span>
        </div>

        {/* Botões de ação */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          {a.status !== "concluido" && (
            <button
              onClick={() => onStatus(a.id, "concluido")}
              style={{
                background: C.successBg,
                border: "none",
                borderRadius: 8,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: C.success,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "background 0.2s",
              }}
            >
              <Check size={13} /> Concluir
            </button>
          )}
          {a.status !== "cancelado" && (
            <button
              onClick={() => onStatus(a.id, "cancelado")}
              style={{
                background: C.dangerBg,
                border: "none",
                borderRadius: 8,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: C.danger,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "background 0.2s",
              }}
            >
              <Ban size={13} /> Cancelar
            </button>
          )}
          {a.status === "cancelado" && (
            <button
              onClick={() => onStatus(a.id, "agendado")}
              style={{
                background: C.goldSoft,
                border: "none",
                borderRadius: 8,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: "#7A5A22",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              ↻ Reativar
            </button>
          )}
          <button
            onClick={() => onEdit(a)}
            style={{
              background: "transparent",
              border: "1px solid " + C.border,
              borderRadius: 8,
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
              color: C.textMuted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "background 0.2s",
            }}
          >
            <Pencil size={13} /> Editar
          </button>
          <button
            onClick={() => onDelete(a.id)}
            style={{
              background: "transparent",
              border: "1px solid " + C.dangerBg,
              borderRadius: 8,
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
              color: C.danger,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "background 0.2s",
            }}
          >
            <Trash2 size={13} /> Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
function EmptyState({ text, cta, onCta }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: C.textMuted, background: C.surface, borderRadius: 16, border: "1px dashed " + C.border }}>
      <p style={{ margin: "0 0 14px", fontSize: 14 }}>{text}</p>
      {cta && <Btn onClick={onCta}><Plus size={15} /> {cta}</Btn>}
    </div>
  );
}

function HojeView({ todayAppointments, clientMap, serviceMap, todayRevenue, monthRevenue, onNew, onStatus, onDelete, onEdit }) {
  const pending = todayAppointments.filter((a) => a.status === "agendado").length;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 22 }}>
        <StatCard icon={Calendar} label="Hoje" value={String(todayAppointments.length)} sub="atendimentos" />
        <StatCard icon={Clock} label="Pendentes" value={String(pending)} sub="a atender" />
        <StatCard icon={DollarSign} label="Previsto hoje" value={money(todayRevenue)} sub="em serviços" />
        <StatCard icon={Sparkles} label="Faturado no mês" value={money(monthRevenue)} sub="concluídos" />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 19, color: C.wineDeep }}>{prettyDate(new Date())}</h2>
        <Btn onClick={onNew}><Plus size={15} /> Novo agendamento</Btn>
      </div>

      {todayAppointments.length === 0 ? (
        <EmptyState text="Nenhum agendamento para hoje." cta="Agendar atendimento" onCta={onNew} />
      ) : (
        todayAppointments.map((a) => (
          <ApptRow key={a.id} a={a} client={clientMap[a.clientId]} service={serviceMap[a.serviceId]} onStatus={onStatus} onDelete={onDelete} onEdit={onEdit} />
        ))
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.gold, marginBottom: 8 }}>
        <Icon size={16} />
        <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: C.textMuted }}>{label}</span>
      </div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.wineDeep }}>{value}</div>
      <div style={{ fontSize: 12, color: C.textMuted }}>{sub}</div>
    </div>
  );
}

function AgendaView({ currentDate, setCurrentDate, dayAppointments, clientMap, serviceMap, onNew, onStatus, onDelete, onEdit }) {
  function shiftDay(delta) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + delta);
    setCurrentDate(d);
  }
  const navBtn = { background: "#fff", border: "1px solid " + C.border, borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.wineDeep };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => shiftDay(-1)} style={navBtn}><ChevronLeft size={18} /></button>
          <div style={{ minWidth: 200, textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 17, color: C.wineDeep, textTransform: "capitalize" }}>
              {prettyDate(currentDate)}
            </div>
          </div>
          <button onClick={() => shiftDay(1)} style={navBtn}><ChevronRight size={18} /></button>
          <Btn small variant="ghost" onClick={() => setCurrentDate(new Date())}>Hoje</Btn>
        </div>
        <Btn onClick={onNew}><Plus size={15} /> Novo agendamento</Btn>
      </div>

      {dayAppointments.length === 0 ? (
        <EmptyState text="Nenhum agendamento para este dia." cta="Agendar atendimento" onCta={onNew} />
      ) : (
        dayAppointments.map((a) => (
          <ApptRow key={a.id} a={a} client={clientMap[a.clientId]} service={serviceMap[a.serviceId]} onStatus={onStatus} onDelete={onDelete} onEdit={onEdit} />
        ))
      )}
    </div>
  );
}

function ClientesView({ clients, search, setSearch, appointments, serviceMap, expandedClient, setExpandedClient, onNew, onEdit, onDelete }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: C.textMuted }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..." style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
        <Btn onClick={onNew}><Plus size={15} /> Nova cliente</Btn>
      </div>

      {clients.length === 0 ? (
        <EmptyState text="Nenhuma cliente encontrada." cta="Cadastrar cliente" onCta={onNew} />
      ) : (
        clients.slice().sort((a, b) => a.name.localeCompare(b.name)).map((c) => {
          const history = appointments.filter((a) => a.clientId === c.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
          const totalSpent = history.filter((a) => a.status === "concluido").reduce((s, a) => s + (serviceMap[a.serviceId]?.price || 0), 0);
          const expanded = expandedClient === c.id;
          return (
            <div key={c.id} style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 14, marginBottom: 12, overflow: "hidden" }}>
              <div style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExpandedClient(expanded ? null : c.id)}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: C.textMuted, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                    {c.phone && <><Phone size={12} /> {c.phone}</>}
                    <span style={{ marginLeft: c.phone ? 8 : 0 }}>· {history.length} atendimento{history.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.success }}>{money(totalSpent)}</span>
                  <button onClick={(e) => { e.stopPropagation(); onEdit(c); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4 }}><Pencil size={15} /></button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4 }}><Trash2 size={15} /></button>
                </div>
              </div>
              {expanded && (
                <div style={{ borderTop: "1px solid " + C.border, padding: 14, background: C.bg }}>
                  {c.notes && <p style={{ fontSize: 13, color: C.textMuted, marginTop: 0, fontStyle: "italic" }}>{c.notes}</p>}
                  {history.length === 0 ? (
                    <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>Sem histórico de atendimentos ainda.</p>
                  ) : (
                    history.map((a) => (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid " + C.border }}>
                        <span>{prettyDateShort(a.date)} · {a.time} — {serviceMap[a.serviceId]?.name || "Serviço removido"}</span>
                        <StatusBadge status={a.status} />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function ServicosView({ services, onNew, onEdit, onDelete }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 19, color: C.wineDeep }}>Catálogo de serviços</h2>
        <Btn onClick={onNew}><Plus size={15} /> Novo serviço</Btn>
      </div>
      {services.length === 0 ? (
        <EmptyState text="Nenhum serviço cadastrado." cta="Cadastrar serviço" onCta={onNew} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 12 }}>
          {services.map((s) => (
            <div key={s.id} style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Scissors size={16} color={C.gold} />
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => onEdit(s)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 2 }}><Pencil size={14} /></button>
                  <button onClick={() => onDelete(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 2 }}><Trash2 size={14} /></button>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginTop: 10 }}>{s.name}</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{s.duration} min</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: C.wineDeep, marginTop: 8 }}>{money(s.price)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentModal({ data, clients, services, onClose, onSave, onCreateClient }) {
  const editing = data.editing;
  const [clientMode, setClientMode] = useState("existing");
  const [clientId, setClientId] = useState(editing?.clientId || "");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [serviceId, setServiceId] = useState(editing?.serviceId || services[0]?.id || "");
  const [date, setDate] = useState(editing?.date || data.defaultDate || toISODate(new Date()));
  const [time, setTime] = useState(editing?.time || "09:00");
  const [notes, setNotes] = useState(editing?.notes || "");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    let finalClientId = clientId;
    if (clientMode === "new") {
      if (!newName.trim()) { setError("Informe o nome da cliente."); return; }
      finalClientId = genId();
      onCreateClient({ id: finalClientId, name: newName.trim(), phone: newPhone.trim(), notes: "" });
    } else if (!finalClientId) {
      setError("Selecione uma cliente.");
      return;
    }
    if (!serviceId) { setError("Selecione um serviço."); return; }
    if (!date || !time) { setError("Informe data e horário."); return; }
    onSave({
      id: editing?.id || genId(),
      clientId: finalClientId,
      serviceId,
      date,
      time,
      notes: notes.trim(),
      status: editing?.status || "agendado",
    });
  }

  return (
    <Modal title={editing ? "Editar agendamento" : "Novo agendamento"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Cliente">
          {!editing && (
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <Btn small variant={clientMode === "existing" ? "primary" : "ghost"} onClick={() => setClientMode("existing")} type="button">Já cadastrada</Btn>
              <Btn small variant={clientMode === "new" ? "primary" : "ghost"} onClick={() => setClientMode("new")} type="button">Nova cliente</Btn>
            </div>
          )}
          {clientMode === "existing" || editing ? (
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={inputStyle}>
              <option value="">Selecione...</option>
              {clients.slice().sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome" style={inputStyle} />
              <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Telefone" style={inputStyle} />
            </div>
          )}
        </Field>

        <Field label="Serviço">
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={inputStyle}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name} — {money(s.price)}</option>
            ))}
          </select>
        </Field>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Field label="Data">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Horário">
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle} />
            </Field>
          </div>
        </div>

        <Field label="Observações (opcional)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={inputStyle} />
        </Field>

        {error && <p style={{ color: C.danger, fontSize: 13, marginTop: -6 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
          <Btn variant="ghost" onClick={onClose} type="button">Cancelar</Btn>
          <Btn type="submit">{editing ? "Salvar alterações" : "Agendar"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function ClientModal({ data, onClose, onSave }) {
  const editing = data.editing;
  const [name, setName] = useState(editing?.name || "");
  const [phone, setPhone] = useState(editing?.phone || "");
  const [notes, setNotes] = useState(editing?.notes || "");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError("Informe o nome da cliente."); return; }
    onSave({ id: editing?.id || genId(), name: name.trim(), phone: phone.trim(), notes: notes.trim() });
  }

  return (
    <Modal title={editing ? "Editar cliente" : "Nova cliente"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Nome"><input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} autoFocus /></Field>
        <Field label="Telefone"><input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="(00) 00000-0000" /></Field>
        <Field label="Observações (preferências, alergias, etc.)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={inputStyle} />
        </Field>
        {error && <p style={{ color: C.danger, fontSize: 13, marginTop: -6 }}>{error}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
          <Btn variant="ghost" onClick={onClose} type="button">Cancelar</Btn>
          <Btn type="submit">Salvar</Btn>
        </div>
      </form>
    </Modal>
  );
}

function ServiceModal({ data, onClose, onSave }) {
  const editing = data.editing;
  const [name, setName] = useState(editing?.name || "");
  const [duration, setDuration] = useState(editing?.duration || 30);
  const [price, setPrice] = useState(editing?.price ?? 0);
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError("Informe o nome do serviço."); return; }
    onSave({ id: editing?.id || genId(), name: name.trim(), duration: Number(duration), price: Number(price) });
  }

  return (
    <Modal title={editing ? "Editar serviço" : "Novo serviço"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Nome do serviço"><input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} autoFocus /></Field>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Field label="Duração (min)"><input type="number" min={5} step={5} value={duration} onChange={(e) => setDuration(e.target.value)} style={inputStyle} /></Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Preço (R$)"><input type="number" min={0} step={5} value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} /></Field>
          </div>
        </div>
        {error && <p style={{ color: C.danger, fontSize: 13, marginTop: -6 }}>{error}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
          <Btn variant="ghost" onClick={onClose} type="button">Cancelar</Btn>
          <Btn type="submit">Salvar</Btn>
        </div>
      </form>
    </Modal>
  );
}