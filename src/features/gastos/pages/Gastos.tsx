import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { Icons } from "@/shared/components/press/PressIcons";
import { Pager, PagerRow } from "@/shared/components/ui/Pager";
import { StatusBadge } from "@/features/facturas/components/StatusBadge";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useStoredState } from "@/shared/hooks/useStoredState";
import { useGastosQuery } from "../hooks/useGastosQuery";
import { CreateGastoModal } from "../components/CreateGastoModal";
import { CATEGORIA_LABELS, TIPO_GASTO_LABELS } from "../constants";
import { parseGastoAmount, getGastoDescription, getGastoNcf } from "../utils";
import type { Gasto, GastoCategoria } from "../types";

type ViewMode = "cards" | "table";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const CATEGORIA_FILTERS: { label: string; value: GastoCategoria | "" }[] = [
  { label: "Todos", value: "" },
  { label: "Gastos menores", value: "gastos_menores" },
  { label: "Facturas proveedores", value: "facturas_proveedores" },
];

export default function Gastos() {
  const navigate = useNavigate();
  const [view, setView] = useStoredState<ViewMode>("gastos:view", "cards");
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState<GastoCategoria | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedQuery = useDebounce(query, 400);
  const { data, isFetching } = useGastosQuery({
    query: debouncedQuery,
    page,
    pageSize,
    categoria: categoria || undefined,
  });
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

  const handleCategoriaChange = (c: GastoCategoria | "") => {
    setCategoria(c);
    setPage(1);
  };

  const open = (g: Gasto) => navigate(`/gastos/${g.id}`);

  return (
    <div className="content">
      <PageMeta title="Gastos · Gratex" description="Gastos y comprobantes de costos (e-CF)" />
      <PageMarks label="GASTOS / 05" />
      <div className="page-head">
        <div>
          <h1 className="page-title">Gastos</h1>
          <div className="page-sub">
            {total} gastos · año {new Date().getFullYear()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-accent" onClick={() => setCreateOpen(true)}>
            <Icons.plus size={13} /> Nuevo gasto
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
            placeholder="Buscar por NCF, RNC, proveedor…"
          />
        </div>
        <div className="seg">
          {CATEGORIA_FILTERS.map((f) => (
            <button
              key={f.value || "all"}
              className={categoria === f.value ? "active" : ""}
              onClick={() => handleCategoriaChange(f.value)}
            >
              {f.label}
            </button>
          ))}
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
            {list.map((g) => (
              <GastoCard key={g.id} gasto={g} onOpen={() => open(g)} />
            ))}
            {list.length === 0 && (
              <div style={{ padding: 32, color: "var(--muted)", gridColumn: "1/-1" }}>
                {isFetching ? "Cargando…" : "Sin gastos"}
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
                <th>Tipo</th>
                <th>Proveedor</th>
                <th>Categoría</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th style={{ textAlign: "right", paddingRight: 20 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {list.map((g) => (
                <tr key={g.id} onClick={() => open(g)}>
                  <td style={{ paddingLeft: 20 }}>
                    <span className="mono" style={{ fontSize: 11 }}>{g.ncf || "—"}</span>
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>{g.tipo_gasto}</span>{" "}
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{TIPO_GASTO_LABELS[g.tipo_gasto]?.short}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{g.nombre_proveedor || "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--ink-2)" }}>{CATEGORIA_LABELS[g.categoria]}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{formatDisplayDate(g.fecha)}</td>
                  <td>{g.estado_dgii ? <StatusBadge estado={g.estado_dgii} /> : "—"}</td>
                  <td className="mono" style={{ textAlign: "right", paddingRight: 20, fontWeight: 600, fontSize: 14 }}>
                    {fmt.money(parseGastoAmount(g))}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: 32 }}>
                    {isFetching ? "Cargando…" : "Sin gastos"}
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

      <CreateGastoModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(msg) => {
          setToast(msg);
          window.setTimeout(() => setToast(""), 4000);
        }}
      />

      {toast && (
        <div className="toast">
          <span className="swatch" style={{ background: "var(--c-accent, #3b82f6)" }} />
          {toast}
        </div>
      )}
    </div>
  );
}

function GastoCard({ gasto, onOpen }: { gasto: Gasto; onOpen: () => void }) {
  return (
    <div className="quote-card" onClick={onOpen}>
      <div className="quote-card-top">
        <div>
          <div className="quote-client">{gasto.nombre_proveedor || "—"}</div>
          <div className="quote-company">{CATEGORIA_LABELS[gasto.categoria]}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className="quote-code">{getGastoNcf(gasto)}</span>
          <div className="mono" style={{ fontSize: 9, color: "var(--muted)", marginTop: 2 }}>
            {gasto.tipo_gasto} · {TIPO_GASTO_LABELS[gasto.tipo_gasto]?.short}
          </div>
          <div className="quote-date">{formatDisplayDate(gasto.fecha)}</div>
        </div>
      </div>
      <div className="quote-divider" />
      <div className="quote-body">
        <div className="quote-desc">{getGastoDescription(gasto)}</div>
        <div>
          <div className="quote-amt-value">{fmt.money(parseGastoAmount(gasto))}</div>
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
        {gasto.estado_dgii ? <StatusBadge estado={gasto.estado_dgii} /> : <span />}
        <span style={{ color: "var(--muted)", fontSize: 11, fontFamily: "Geist Mono" }}>
          Ver detalle →
        </span>
      </div>
    </div>
  );
}
