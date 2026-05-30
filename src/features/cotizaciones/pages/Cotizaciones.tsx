import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { Icons } from "@/shared/components/press/PressIcons";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useStoredState } from "@/shared/hooks/useStoredState";
import { useCotizacionesQuery } from "../hooks/useCotizacionesQuery";
import { parseCotizacionAmount } from "@/features/dashboard/hooks/useDashboardData";
import { CreateQuoteModal } from "../components/CreateQuoteModal";
import { DuplicateQuoteModal } from "../components/DuplicateQuoteModal";
import type { Cotizacion } from "../types";

type ViewMode = "cards" | "table";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function Cotizaciones() {
  const navigate = useNavigate();
  const [view, setView] = useStoredState<ViewMode>("cotizaciones:view", "cards");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [toast, setToast] = useState("");

  const debouncedQuery = useDebounce(query, 400);
  const { data, isFetching } = useCotizacionesQuery({ query: debouncedQuery, page, pageSize });
  const list = data?.items ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? list.length;
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

  const open = (c: Cotizacion) => navigate(`/cotizaciones/${c.id}`);

  return (
    <div className="content">
      <PageMeta title="Cotizaciones · Gratex" description="Listado de cotizaciones" />
      <PageMarks label="COTIZACIONES / 02" />
      <div className="page-head">
        <div>
          <h1 className="page-title">Cotizaciones</h1>
          <div className="page-sub">{total} registros · ord. fecha desc.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn btn-green"
            onClick={() => setDuplicateOpen(true)}
            title="Duplicar una cotización existente con la fecha de hoy"
          >
            <Icons.copy size={14} sw={2.5} /> Duplicar cotización
          </button>
          <button className="btn btn-accent" onClick={() => setCreateOpen(true)}>
            <Icons.plus size={13} /> Crear cotización
          </button>
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
            placeholder="Buscar por fecha, código, cliente o descripción…"
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

        <button hidden className="btn-ghost">
          <Icons.download size={13} /> Exportar
        </button>
      </div>

      {view === "cards" ? (
        <>
          <div className="card-grid">
            {list.map((c) => (
              <CotizacionCard key={c.id} cotizacion={c} onOpen={() => open(c)} />
            ))}
            {list.length === 0 && (
              <div style={{ padding: 32, color: "var(--muted)", gridColumn: "1/-1" }}>
                Sin cotizaciones
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
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: 32 }}>
                    Sin cotizaciones
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

      <CreateQuoteModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(msg) => {
          setToast(msg);
          window.setTimeout(() => setToast(""), 2500);
        }}
      />

      <DuplicateQuoteModal
        open={duplicateOpen}
        onClose={() => setDuplicateOpen(false)}
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

interface PagerProps {
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  canPrev: boolean;
  canNext: boolean;
  isFetching: boolean;
  onPrev: () => void;
  onNext: () => void;
}

function PagerRow({ page, pageSize, totalPages, total, canPrev, canNext, isFetching, onPrev, onNext }: PagerProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        borderTop: "1px solid var(--line)",
        gap: 12,
      }}
    >
      <div className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em" }}>
        {total > 0
          ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total}`
          : "0 de 0"}
        {isFetching && " · cargando…"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button className="btn-ghost" disabled={!canPrev} onClick={onPrev} style={{ opacity: canPrev ? 1 : 0.4 }}>
          <Icons.chevronLeft size={13} /> Anterior
        </button>
        <span className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em" }}>
          Página {page} de {totalPages}
        </span>
        <button className="btn-ghost" disabled={!canNext} onClick={onNext} style={{ opacity: canNext ? 1 : 0.4 }}>
          Siguiente <Icons.chevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

function Pager(props: PagerProps) {
  const { page, pageSize, totalPages, total, canPrev, canNext, isFetching, onPrev, onNext } = props;
  if (totalPages <= 1) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        gap: 12,
      }}
    >
      <div className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em" }}>
        {total > 0
          ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total}`
          : "0 de 0"}
        {isFetching && " · cargando…"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button className="btn-ghost" disabled={!canPrev} onClick={onPrev} style={{ opacity: canPrev ? 1 : 0.4 }}>
          <Icons.chevronLeft size={13} /> Anterior
        </button>
        <span className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em" }}>
          Página {page} de {totalPages}
        </span>
        <button className="btn-ghost" disabled={!canNext} onClick={onNext} style={{ opacity: canNext ? 1 : 0.4 }}>
          Siguiente <Icons.chevronRight size={13} />
        </button>
      </div>
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
