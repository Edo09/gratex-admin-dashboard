import { useState } from "react";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { Icons } from "@/shared/components/press/PressIcons";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useClientesQuery } from "../hooks/useClientesQuery";
import { getClientDisplayName, getClientPhone, type Cliente } from "../types";
import { CreateClienteModal } from "../components/CreateClienteModal";
import { EditClienteModal } from "../components/EditClienteModal";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { useDeleteCliente } from "../hooks/useDeleteCliente";

export default function Clientes() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [createOpen, setCreateOpen] = useState(false);
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);
  const [deleteCliente, setDeleteCliente] = useState<Cliente | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [toast, setToast] = useState("");

  const deleteMutation = useDeleteCliente();

  const { data } = useClientesQuery({ query: debouncedQuery, page: 1, pageSize: 50 });
  const list = data?.items ?? [];
  const total = data?.pagination?.total ?? list.length;

  const confirmDelete = async () => {
    if (!deleteCliente) return;
    setDeleteError("");
    try {
      const message = await deleteMutation.mutateAsync(deleteCliente.id);
      setToast(message || "Cliente eliminado");
      window.setTimeout(() => setToast(""), 2500);
      setDeleteCliente(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "No se pudo eliminar el cliente.");
    }
  };

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
          <div key={c.id} className="client" onClick={() => setEditCliente(c)}>
            <div className="client-num">#{String(c.id).padStart(4, "0")}</div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <div className="client-name">{getClientDisplayName(c)}</div>
                {c.rnc && (
                  <span
                    className="mono"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      padding: "2px 7px",
                      background: "var(--bg)",
                      border: "1px solid var(--line)",
                      borderRadius: 999,
                      color: "var(--ink-2)",
                    }}
                    title="RNC del cliente"
                  >
                    <span style={{ color: "var(--muted)", fontWeight: 700 }}>RNC</span>
                    {c.rnc}
                  </span>
                )}
              </div>
              <div className="client-company">{c.company_name ?? ""}</div>
            </div>
            <div className="client-meta">
              <div className="client-mono">{c.email ?? ""}</div>
              <div className="client-mono" style={{ color: "var(--muted)" }}>
                {getClientPhone(c) ?? ""}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
              <button
                style={{
                  background: "var(--bad-soft)",
                  border: "1.5px solid var(--bad)",
                  borderRadius: 6,
                  cursor: "pointer",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--bad)",
                  transition: "background 0.12s, color 0.12s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bad)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fdecec";
                  e.currentTarget.style.color = "var(--bad)";
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteError("");
                  setDeleteCliente(c);
                }}
                title="Eliminar cliente"
              >
                <Icons.trash size={14} sw={2} />
              </button>
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

      <EditClienteModal
        cliente={editCliente}
        open={!!editCliente}
        onClose={() => setEditCliente(null)}
        onUpdated={(msg) => {
          setToast(msg || "Cliente actualizado");
          window.setTimeout(() => setToast(""), 2500);
        }}
      />

      <DeleteConfirmModal
        open={!!deleteCliente}
        clienteName={deleteCliente ? (getClientDisplayName(deleteCliente)) : ""}
        isDeleting={deleteMutation.isPending}
        error={deleteError}
        onClose={() => setDeleteCliente(null)}
        onConfirm={confirmDelete}
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
