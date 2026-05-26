import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { Icons } from "@/shared/components/press/PressIcons";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useCotizacionesQuery } from "../hooks/useCotizacionesQuery";
import { parseCotizacionAmount } from "@/features/dashboard/hooks/useDashboardData";
import { CreateQuoteModal } from "../components/CreateQuoteModal";
import type { Cotizacion } from "../types";

type ViewMode = "cards" | "table";

export default function Cotizaciones() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>("cards");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState("");

  const debouncedQuery = useDebounce(query, 400);
  const { data } = useCotizacionesQuery({ query: debouncedQuery, page: 1, pageSize: 50 });
  const list = data?.items ?? [];

  const open = (c: Cotizacion) => navigate(`/cotizaciones/${c.id}`);

  return (
    <div className="content">
      <PageMeta title="Cotizaciones · Gratex" description="Listado de cotizaciones" />
      <PageMarks label="COTIZACIONES / 02" />
      <div className="page-head">
        <div>
          <h1 className="page-title">Cotizaciones</h1>
          <div className="page-sub">{list.length} registros · ord. fecha desc.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="seg">
            <button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")}>Cards</button>
            <button className={view === "table" ? "active" : ""} onClick={() => setView("table")}>Tabla</button>
          </div>
          <button className="btn btn-accent" onClick={() => setCreateOpen(true)}>
            <Icons.plus size={13} /> Crear cotización
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div className="search" style={{ maxWidth: "none", flex: 1 }}>
          <span className="search-icon">
            <Icons.search size={14} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por fecha, código, cliente o descripción…"
          />
        </div>
        <button className="btn-ghost">
          <Icons.filter size={13} /> Filtrar
        </button>
        <button className="btn-ghost">
          <Icons.download size={13} /> Exportar
        </button>
      </div>

      {view === "cards" ? (
        <div className="card-grid">
          {list.map((c) => (
            <CotizacionCard key={c.id} cotizacion={c} onOpen={() => open(c)} />
          ))}
        </div>
      ) : (
        <div className="panel" style={{ padding: 0 }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Código</th>
                <th>Cliente</th>
                <th>Descripción</th>
                <th>Fecha</th>
                <th style={{ textAlign: "right", paddingRight: 20 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} onClick={() => open(c)}>
                  <td style={{ paddingLeft: 20 }}>
                    <span className="quote-code">{c.code ?? `#${c.id}`}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.client_name ?? "—"}</div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                      {c.company_name ?? ""}
                    </div>
                  </td>
                  <td style={{ color: "var(--ink-2)", maxWidth: 320 }}>{c.description ?? "—"}</td>
                  <td className="mono" style={{ fontSize: 11 }}>
                    {formatDisplayDate(c.date)}
                  </td>
                  <td className="mono" style={{ textAlign: "right", paddingRight: 20, fontWeight: 600, fontSize: 14 }}>
                    {fmt.money(parseCotizacionAmount(c))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateQuoteModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(msg) => {
          setToast(msg);
          window.setTimeout(() => setToast(""), 2500);
        }}
      />

      {toast && (
        <div className="toast">
          <span className="swatch" style={{ background: "var(--c-cyan)" }} />
          {toast}
        </div>
      )}
    </div>
  );
}

function CotizacionCard({ cotizacion, onOpen }: { cotizacion: Cotizacion; onOpen: () => void }) {
  return (
    <div className="quote-card" onClick={onOpen}>
      <div className="quote-card-top">
        <div>
          <div className="quote-client">{cotizacion.client_name ?? "—"}</div>
          <div className="quote-company">{cotizacion.company_name ?? ""}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className="quote-code">{cotizacion.code ?? `#${cotizacion.id}`}</span>
          <div className="quote-date">{formatDisplayDate(cotizacion.date)}</div>
        </div>
      </div>
      <div className="quote-divider" />
      <div className="quote-body">
        <div className="quote-desc">{cotizacion.description ?? "—"}</div>
        <div>
          <div className="quote-amt-value">{fmt.money(parseCotizacionAmount(cotizacion))}</div>
          <div className="quote-amt-label">Total neto</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 12 }}>
        <span style={{ color: "var(--muted)", fontSize: 11, fontFamily: "Geist Mono" }}>
          Ver detalle →
        </span>
      </div>
    </div>
  );
}
