import { useMemo, useState } from "react";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { Icons } from "@/shared/components/press/PressIcons";
import { ComprobanteBadge } from "@/shared/components/ui/ComprobanteBadge";
import { Pager, PagerRow } from "@/shared/components/ui/Pager";
import { StatusBadge } from "@/features/facturas/components/StatusBadge";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useStoredState } from "@/shared/hooks/useStoredState";
import { useEcfRecibidosQuery } from "../hooks/useEcfRecibidosQuery";
import { AprobarEcfModal } from "../components/AprobarEcfModal";
import { AprobacionBadge } from "../components/AprobacionBadge";
import type { EcfRecibido } from "../types";

type ViewMode = "cards" | "table";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function matchesQuery(ecf: EcfRecibido, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return [ecf.e_ncf, ecf.razon_social_emisor, ecf.rnc_emisor, ecf.fecha_emision]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(needle));
}

export default function AprobarEcf() {
  const [view, setView] = useStoredState<ViewMode>("aprobar-ecf:view", "cards");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<EcfRecibido | null>(null);
  const [toast, setToast] = useState("");

  const debouncedQuery = useDebounce(query, 400);
  const { data, isFetching } = useEcfRecibidosQuery({ page, pageSize });
  const rawList = useMemo(() => data?.items ?? [], [data]);
  // El API pagina del lado servidor sin búsqueda; filtramos la página cargada.
  const list = useMemo(
    () => rawList.filter((e) => matchesQuery(e, debouncedQuery)),
    [rawList, debouncedQuery],
  );

  const pagination = data?.pagination;
  const total = pagination?.total ?? rawList.length;
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const handleQueryChange = (q: string) => {
    setQuery(q);
    setPage(1);
  };

  const handlePageSizeChange = (n: number) => {
    setPageSize(n);
    setPage(1);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2500);
  };

  return (
    <div className="content">
      <PageMeta
        title="Aprobar e-CF · Gratex"
        description="e-CF recibidos de otros emisores — aprobar o rechazar ante la DGII"
      />
      <PageMarks label="APROBAR e-CF / 08" />
      <div className="page-head">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            Aprobar e-CF <ComprobanteBadge type="ecf" size={13} />
          </h1>
          <div className="page-sub">
            {total} recibidos · año {new Date().getFullYear()}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="search" style={{ maxWidth: "none", flex: 1 }}>
          <span className="search-icon">
            <Icons.search size={14} />
          </span>
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Buscar por NCF, emisor, RNC, fecha…"
          />
        </div>
        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          style={{
            border: "1px solid var(--line)",
            borderRadius: 6,
            padding: "0 10px",
            fontSize: 12,
            fontFamily: "Geist Mono, monospace",
            background: "var(--surface)",
            color: "var(--ink)",
            cursor: "pointer",
            minWidth: 110,
          }}
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n} / página</option>
          ))}
        </select>

        <div className="seg">
          <button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")}>Cards</button>
          <button className={view === "table" ? "active" : ""} onClick={() => setView("table")}>Tabla</button>
        </div>
      </div>

      {view === "cards" ? (
        <>
          <div className="card-grid">
            {list.map((e) => (
              <EcfRecibidoCard key={e.track_id} ecf={e} onOpen={() => setSelected(e)} />
            ))}
            {list.length === 0 && (
              <div style={{ padding: 32, color: "var(--muted)", gridColumn: "1/-1" }}>
                {isFetching ? "Cargando…" : "Sin e-CF recibidos"}
              </div>
            )}
          </div>
          <Pager
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            total={total}
            canPrev={canPrev}
            canNext={canNext}
            isFetching={isFetching}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </>
      ) : (
        <div className="panel" style={{ padding: 0 }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>NCF</th>
                <th>Emisor</th>
                <th>RNC emisor</th>
                <th style={{ width: 90 }}>Tipo</th>
                <th>Fecha</th>
                <th style={{ width: 120 }}>Recepción</th>
                <th style={{ width: 120 }}>Aprobación</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th style={{ width: 120, paddingRight: 20 }} />
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.track_id} onClick={() => setSelected(e)}>
                  <td style={{ paddingLeft: 20 }}>
                    <span className="mono" style={{ fontSize: 11 }}>{e.e_ncf}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{e.razon_social_emisor || "—"}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{e.rnc_emisor}</td>
                  <td>
                    <span
                      className="mono"
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        background: "var(--bg)",
                        padding: "2px 5px",
                        borderRadius: 3,
                        letterSpacing: "0.03em",
                      }}
                    >
                      E{e.tipo_ecf}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: 11 }}>{formatDisplayDate(e.fecha_emision)}</td>
                  <td>
                    <StatusBadge estado={e.estado} />
                  </td>
                  <td>
                    <AprobacionBadge
                      estado={e.aprobacion_comercial}
                      procesada={e.aprobacion_comercial_procesada}
                    />
                  </td>
                  <td className="mono" style={{ textAlign: "right", fontWeight: 600, fontSize: 14 }}>
                    {fmt.money(Number(e.monto_total) || 0)}
                  </td>
                  <td style={{ textAlign: "right", paddingRight: 20 }}>
                    <button
                      className="btn btn-accent"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setSelected(e);
                      }}
                      style={{ fontSize: 11, padding: "4px 10px" }}
                    >
                      {e.aprobacion_comercial == null ? "Revisar" : "Reenviar"}
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", color: "var(--muted)", padding: 32 }}>
                    {isFetching ? "Cargando…" : "Sin e-CF recibidos"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <PagerRow
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            total={total}
            canPrev={canPrev}
            canNext={canNext}
            isFetching={isFetching}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </div>
      )}

      <AprobarEcfModal
        open={selected != null}
        ecf={selected}
        onClose={() => setSelected(null)}
        onDone={showToast}
      />

      {toast && (
        <div className="toast">
          <span className="swatch" style={{ background: "var(--c-magenta)" }} />
          {toast}
        </div>
      )}
    </div>
  );
}

function EcfRecibidoCard({ ecf, onOpen }: { ecf: EcfRecibido; onOpen: () => void }) {
  return (
    <div className="quote-card" onClick={onOpen}>
      <div className="quote-card-top">
        <div>
          <div className="quote-client">{ecf.razon_social_emisor || "—"}</div>
          <div className="quote-company mono">{ecf.rnc_emisor}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className="quote-code">{ecf.e_ncf}</span>
          <div className="mono" style={{ fontSize: 9, color: "var(--muted)", marginTop: 2 }}>
            e-NCF
          </div>
          <div className="quote-date">{formatDisplayDate(ecf.fecha_emision)}</div>
        </div>
      </div>
      <div className="quote-divider" />
      <div className="quote-body">
        <div className="quote-desc">Emisor te facturó este comprobante</div>
        <div>
          <div className="quote-amt-value">{fmt.money(Number(ecf.monto_total) || 0)}</div>
          <div className="quote-amt-label">Total</div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className="mono"
            style={{
              fontSize: 10,
              fontWeight: 700,
              background: "var(--c-accent, #3b82f6)",
              color: "#fff",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            E{ecf.tipo_ecf}
          </span>
          <StatusBadge estado={ecf.estado} />
          <AprobacionBadge
            estado={ecf.aprobacion_comercial}
            procesada={ecf.aprobacion_comercial_procesada}
          />
        </div>
        <span style={{ color: "var(--muted)", fontSize: 11, fontFamily: "Geist Mono" }}>
          {ecf.aprobacion_comercial == null ? "Aprobar / rechazar →" : "Reenviar →"}
        </span>
      </div>
    </div>
  );
}
