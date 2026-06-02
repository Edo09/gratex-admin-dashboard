import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { Icons } from "@/shared/components/press/PressIcons";
import { ComprobanteBadge } from "@/shared/components/ui/ComprobanteBadge";
import { Pager, PagerRow } from "@/shared/components/ui/Pager";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useStoredState } from "@/shared/hooks/useStoredState";
import {
  parseFacturaAmount,
  getFacturaNcf,
  getFacturaClientName,
  getFacturaDescription,
} from "@/features/facturas/utils";
import type { Factura } from "@/features/facturas/types";
import { useFacturasSimplesQuery } from "../hooks/useFacturasSimplesQuery";
import { CreateFacturaSimpleModal } from "../components/CreateFacturaSimpleModal";

type ViewMode = "cards" | "table";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function FacturasSimples() {
  const navigate = useNavigate();
  const [view, setView] = useStoredState<ViewMode>("facturas-ncf:view", "cards");
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedQuery = useDebounce(query, 400);
  const { data, isFetching } = useFacturasSimplesQuery({ query: debouncedQuery, page, pageSize });
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

  const open = (f: Factura) => navigate(`/facturas-ncf/${f.id}`);

  return (
    <div className="content">
      <PageMeta title="Facturas NCF · Gratex" description="Listado de facturas NCF (no electrónicas)" />
      <PageMarks label="FACTURAS NCF / 04" />
      <div className="page-head">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            Facturas <ComprobanteBadge type="ncf" size={13} />
          </h1>
          <div className="page-sub">
            {total} facturas · año {new Date().getFullYear()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-accent" onClick={() => setCreateOpen(true)}>
            <Icons.plus size={13} /> Nueva factura
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
            placeholder="Buscar por NCF, no. factura, cliente…"
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
            {list.map((f) => (
              <FacturaSimpleCard key={f.id} factura={f} onOpen={() => open(f)} />
            ))}
            {list.length === 0 && (
              <div style={{ padding: 32, color: "var(--muted)", gridColumn: "1/-1" }}>
                {isFetching ? "Cargando…" : "Sin facturas"}
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
                <th>No. Factura</th>
                <th>Cliente</th>
                <th>Descripción</th>
                <th>Fecha</th>
                <th style={{ textAlign: "right", paddingRight: 20 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id} onClick={() => open(f)}>
                  <td style={{ paddingLeft: 20 }}>
                    <span className="mono" style={{ fontSize: 11 }}>
                      {f.NCF || "—"}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: 11 }}>{f.no_factura || `#${f.id}`}</td>
                  <td style={{ fontWeight: 600 }}>{getFacturaClientName(f)}</td>
                  <td style={{ color: "var(--ink-2)", maxWidth: 320 }}>
                    {getFacturaDescription(f)}
                  </td>
                  <td className="mono" style={{ fontSize: 11 }}>
                    {formatDisplayDate(f.date)}
                  </td>
                  <td
                    className="mono"
                    style={{ textAlign: "right", paddingRight: 20, fontWeight: 600, fontSize: 14 }}
                  >
                    {fmt.money(parseFacturaAmount(f))}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 32 }}>
                    {isFetching ? "Cargando…" : "Sin facturas"}
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

      <CreateFacturaSimpleModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(msg) => {
          setToast(msg);
          window.setTimeout(() => setToast(""), 2500);
        }}
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

function FacturaSimpleCard({ factura, onOpen }: { factura: Factura; onOpen: () => void }) {
  const ncf = getFacturaNcf(factura);
  return (
    <div className="quote-card" onClick={onOpen}>
      <div className="quote-card-top">
        <div>
          <div className="quote-client">{getFacturaClientName(factura)}</div>
          <div className="quote-company">{factura.company_name ?? ""}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className="quote-code">{ncf}</span>
          <div className="mono" style={{ fontSize: 9, color: "var(--muted)", marginTop: 2 }}>
            {factura.no_factura ?? ""}
          </div>
          <div className="quote-date">{formatDisplayDate(factura.date)}</div>
        </div>
      </div>
      <div className="quote-divider" />
      <div className="quote-body">
        <div className="quote-desc">{getFacturaDescription(factura)}</div>
        <div>
          <div className="quote-amt-value">{fmt.money(parseFacturaAmount(factura))}</div>
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
        <ComprobanteBadge type="ncf" />
        <span style={{ color: "var(--muted)", fontSize: 11, fontFamily: "Geist Mono" }}>
          Ver detalle →
        </span>
      </div>
    </div>
  );
}
