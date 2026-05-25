import { useState } from "react";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { Icons } from "@/shared/components/press/PressIcons";
import { fmt } from "@/shared/utils/press-fmt";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useClientesQuery } from "../hooks/useClientesQuery";
import { getClientDisplayName, getClientPhone } from "../types";
import { mockClienteOrders, mockClienteTotal } from "@/shared/lib/press-mocks";
import { CreateClienteModal } from "../components/CreateClienteModal";

export default function Clientes() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState("");

  const { data } = useClientesQuery({ query: debouncedQuery, page: 1, pageSize: 50 });
  const list = data?.items ?? [];
  const total = data?.pagination?.total ?? list.length;

  return (
    <div className="content">
      <PageMeta title="Clientes · Gratex" description="Listado de clientes" />
      <PageMarks label="CLIENTES / 04" />
      <div className="page-head">
        <div>
          <h1 className="page-title">Clientes</h1>
          <div className="page-sub">{total} registros activos</div>
        </div>
        <button className="btn btn-accent" onClick={() => setCreateOpen(true)}>
          <Icons.plus size={13} /> Nuevo cliente
        </button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div className="search" style={{ maxWidth: "none" }}>
          <span className="search-icon">
            <Icons.search size={14} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, empresa, correo…"
          />
        </div>
      </div>

      <div className="panel" style={{ padding: "4px 16px" }}>
        {list.map((c) => (
          <div key={c.id} className="client">
            <div className="client-num">#{String(c.id).padStart(4, "0")}</div>
            <div>
              <div className="client-name">{getClientDisplayName(c)}</div>
              <div className="client-company">{c.company_name ?? ""}</div>
            </div>
            <div className="client-meta">
              <div className="client-mono">{c.email ?? ""}</div>
              <div className="client-mono" style={{ color: "var(--muted)" }}>
                {getClientPhone(c) ?? ""}
              </div>
            </div>
            {/* MOCK: orders + total billed are not exposed by the backend. */}
            <div className="client-mono">{mockClienteOrders(c.id)} órd.</div>
            <div className="client-mono" style={{ textAlign: "right", fontWeight: 600, fontSize: 13 }}>
              {fmt.money(mockClienteTotal(c.id))}
            </div>
            <div>
              <Icons.chevronRight size={14} style={{ color: "var(--muted)" }} />
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>Sin clientes</div>
        )}
      </div>

      <CreateClienteModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(msg) => {
          setToast(msg || "Cliente creado");
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
