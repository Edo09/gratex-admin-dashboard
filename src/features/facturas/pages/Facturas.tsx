import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { Icons } from "@/shared/components/press/PressIcons";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { parseFacturaAmount } from "@/features/dashboard/hooks/useDashboardData";
import { useFacturasQuery } from "../hooks/useFacturasQuery";
import { CreateFacturaModal } from "../components/CreateFacturaModal";
import type { Factura } from "../types";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function Facturas() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedQuery = useDebounce(query, 400);
  const { data, isFetching } = useFacturasQuery({ query: debouncedQuery, page, pageSize });
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

  const open = (f: Factura) => navigate(`/facturas/${f.id}`);

  return (
    <div className="content">
      <PageMeta title="Facturas · Gratex" description="Listado de facturas" />
      <PageMarks label="FACTURAS / 03" />
      <div className="page-head">
        <div>
          <h1 className="page-title">Facturas</h1>
          <div className="page-sub">
            {total} emisiones · año {new Date().getFullYear()}
          </div>
        </div>
        <button className="btn btn-accent" onClick={() => setCreateOpen(true)}>
          <Icons.plus size={13} /> Nueva factura
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div className="search" style={{ maxWidth: "none", flex: 1 }}>
          <span className="search-icon">
            <Icons.search size={14} />
          </span>
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Buscar por NCF, cliente, fecha…"
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
            background: "white",
            color: "var(--ink)",
            cursor: "pointer",
            minWidth: 110,
          }}
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n} / página</option>
          ))}
        </select>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table className="ds-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20 }}>NCF</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th style={{ textAlign: "right", paddingRight: 20 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {list.map((f) => (
              <tr key={f.id} onClick={() => open(f)}>
                <td style={{ paddingLeft: 20 }}>
                  <span className="mono" style={{ fontSize: 11 }}>
                    {f.no_factura ?? f.NCF ?? `#${f.id}`}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{f.client_name ?? f.client ?? "—"}</td>
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
                <td colSpan={4} style={{ textAlign: "center", color: "var(--muted)", padding: 32 }}>
                  {isFetching ? "Cargando…" : "Sin facturas"}
                </td>
              </tr>
            )}
          </tbody>
        </table>

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
            <button
              className="btn-ghost"
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ opacity: canPrev ? 1 : 0.4 }}
            >
              <Icons.chevronLeft size={13} /> Anterior
            </button>
            <span className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em" }}>
              Página {page} de {totalPages}
            </span>
            <button
              className="btn-ghost"
              disabled={!canNext}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{ opacity: canNext ? 1 : 0.4 }}
            >
              Siguiente <Icons.chevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      <CreateFacturaModal
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
