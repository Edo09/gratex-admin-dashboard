import { useEffect, useState, type CSSProperties } from "react";
import { Icons } from "@/shared/components/press/PressIcons";
import { ModalPortal } from "@/shared/components/press/ModalPortal";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate } from "@/shared/utils/format";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useClientesQuery } from "@/features/clientes/hooks/useClientesQuery";
import { getClientDisplayName, getClientPhone, type Cliente } from "@/features/clientes/types";
import { fetchCotizacionById, useCotizacionesQuery } from "@/features/cotizaciones/hooks/useCotizacionesQuery";
import type { Cotizacion } from "@/features/cotizaciones/types";
import { useNextNcf } from "@/features/ncf/hooks/useNcf";
import { openPdfFromBase64, pickPdfBase64 } from "@/shared/lib/pdf";
import { facturasSimplesApi } from "../api/facturasSimples";
import { useCreateFacturaSimple } from "../hooks/useCreateFacturaSimple";
import type { CreateFacturaSimplePayload } from "../types";

interface CreateFacturaSimpleModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (message: string) => void;
}

type Flow = "client" | "cotizacion" | null;

interface ItemRow {
  id: number;
  description: string;
  quantity: number;
  amount: number;
  itbis_amount: number;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const toNum = (v: string | number): number => {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return isNaN(n) ? 0 : n;
};
/** ITBIS at 18% of a line base (amount × quantity), rounded to cents. */
const itbis18 = (base: number): number => Math.round(base * 0.18 * 100) / 100;

export function CreateFacturaSimpleModal({ open, onClose, onCreated }: CreateFacturaSimpleModalProps) {
  const createFactura = useCreateFacturaSimple();
  const { fetchNextNCF } = useNextNcf();

  const [flow, setFlow] = useState<Flow>(null);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clientName, setClientName] = useState("");
  const [ncf, setNcf] = useState("");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [apiError, setApiError] = useState("");
  const [previewing, setPreviewing] = useState(false);

  // Add-item form
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState("1");
  const [amount, setAmount] = useState("");

  const resetItemForm = () => {
    setDesc("");
    setQty("1");
    setAmount("");
  };

  useEffect(() => {
    if (!open) return;
    setFlow(null);
    setSelectedCotizacion(null);
    setSelectedCliente(null);
    setClientName("");
    setNcf("");
    setItems([]);
    setApiError("");
    resetItemForm();

    // Prefill the next available B01 NCF (GET /api/ncf/next, no consume).
    let cancelled = false;
    fetchNextNCF().then((next) => {
      if (!cancelled && next) setNcf(next);
    });
    return () => {
      cancelled = true;
    };
  }, [open, fetchNextNCF]);

  if (!open) return null;

  const subtotal = items.reduce((s, it) => s + it.amount * it.quantity, 0);
  const totalItbis = items.reduce((s, it) => s + it.itbis_amount, 0);
  const total = subtotal + totalItbis;
  const anyBusy = createFactura.isPending || previewing;

  const backToFlow = () => {
    setFlow(null);
    setSelectedCotizacion(null);
    setSelectedCliente(null);
    setClientName("");
    setItems([]);
    setApiError("");
    resetItemForm();
  };

  const handleCotizacionSelect = async (cot: Cotizacion) => {
    setApiError("");
    let full: Cotizacion | null = cot;
    try {
      const fetched = await fetchCotizacionById(cot.id);
      if (fetched) full = fetched;
    } catch {
      /* best-effort */
    }
    setSelectedCotizacion(full);

    const cotItems = Array.isArray(full?.items) ? full.items : [];
    if (cotItems.length > 0) {
      setItems(
        cotItems.map((it, idx) => {
          const quantity = toNum(it.quantity ?? 1) || 1;
          const amount = toNum(it.amount);
          return {
            id: Date.now() + idx,
            description: it.description,
            quantity,
            amount,
            itbis_amount: itbis18(amount * quantity),
          };
        }),
      );
    } else if (full?.description) {
      const amount = toNum(full.total ?? 0);
      setItems([
        {
          id: Date.now(),
          description: full.description,
          quantity: 1,
          amount,
          itbis_amount: itbis18(amount),
        },
      ]);
    } else {
      setItems([]);
    }

    if (full?.client_id) {
      setSelectedCliente({
        id: full.client_id,
        client_name: full.client_name,
        company_name: full.company_name,
        email: full.email,
        phone_number: full.phone_number,
        telefono: full.telefono,
        direccion: full.direccion,
        rnc: full.rnc,
      });
      setClientName("");
    } else if (full?.client_name) {
      setSelectedCliente(null);
      setClientName(full.client_name);
    }
  };

  const addItem = () => {
    const a = parseFloat(amount);
    const q = parseFloat(qty);
    if (!desc.trim() || isNaN(a) || a <= 0) return;
    const quantity = isNaN(q) || q <= 0 ? 1 : q;
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        description: desc.trim(),
        quantity,
        amount: a,
        itbis_amount: itbis18(a * quantity),
      },
    ]);
    resetItemForm();
  };

  const removeItem = (id: number) => setItems((prev) => prev.filter((it) => it.id !== id));

  const validate = (): string | null => {
    if (!selectedCliente && !clientName.trim()) return "Selecciona un cliente o ingresa un nombre.";
    if (items.length === 0) return "Agrega al menos un concepto.";
    return null;
  };

  const buildPayload = (): CreateFacturaSimplePayload => ({
    client_id: selectedCliente?.id,
    client_name: selectedCliente ? undefined : clientName.trim(),
    date: todayISO(),
    NCF: ncf.trim() || undefined,
    items: items.map((it) => ({
      description: it.description,
      quantity: it.quantity,
      amount: it.amount,
      itbis_amount: it.itbis_amount || undefined,
    })),
  });

  const handlePreview = async () => {
    const invalid = validate();
    if (invalid) {
      setApiError(invalid);
      return;
    }
    setApiError("");
    setPreviewing(true);
    try {
      const res = await facturasSimplesApi.preview(buildPayload());
      const base64 = pickPdfBase64(res.data);
      if (base64) openPdfFromBase64(base64);
      else setApiError("No se pudo generar el preview.");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "No se pudo generar el preview.");
    } finally {
      setPreviewing(false);
    }
  };

  const submit = async () => {
    const invalid = validate();
    if (invalid) {
      setApiError(invalid);
      return;
    }
    setApiError("");

    try {
      await createFactura.mutateAsync(buildPayload());
      onCreated(ncf.trim() ? `Factura ${ncf.trim()} creada` : "Factura creada");
      onClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "No se pudo guardar la factura.");
    }
  };

  return (
    <ModalPortal>
    <div className="modal-bg" onClick={() => !anyBusy && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-pad">
          <div className="modal-head">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              {flow && (
                <button
                  className="close-x"
                  onClick={backToFlow}
                  aria-label="Volver"
                  style={{ marginTop: 2 }}
                >
                  <Icons.chevronLeft size={18} />
                </button>
              )}
              <div>
                <h2 className="modal-title">Nueva factura NCF</h2>
                <div className="modal-sub">
                  {flow === "cotizacion" ? "Desde cotización" : "Factura interna no electrónica"}
                </div>
              </div>
            </div>
            <button className="close-x" onClick={onClose} aria-label="Cerrar">
              <Icons.close size={18} />
            </button>
          </div>

          {flow === null ? (
            <FlowChooser onPick={setFlow} />
          ) : (
            <>
              {flow === "cotizacion" &&
                (selectedCotizacion ? (
                  <SelectedCotizacionBanner
                    cotizacion={selectedCotizacion}
                    onClear={() => {
                      setSelectedCotizacion(null);
                      setSelectedCliente(null);
                      setClientName("");
                      setItems([]);
                    }}
                  />
                ) : (
                  <CotizacionSearch onSelect={handleCotizacionSelect} />
                ))}

              <ClientePicker
                selected={selectedCliente}
                onSelect={setSelectedCliente}
                onClear={() => setSelectedCliente(null)}
              />

              {!selectedCliente && (
                <div className="field">
                  <label>o nombre del cliente (mostrador)</label>
                  <input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Cliente de mostrador"
                  />
                </div>
              )}

              <div className="field">
                <label>NCF (opcional)</label>
                <input value={ncf} onChange={(e) => setNcf(e.target.value)} placeholder="B0100000123" />
              </div>

              {/* Items */}
              <div className="field">
                <label>Conceptos</label>
                <div style={{ display: "grid", gap: 8 }}>
                  <input
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Descripción"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addItem();
                      }
                    }}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
                    <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Cant." inputMode="decimal" />
                    <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Precio" inputMode="decimal" />
                    <button
                      type="button"
                      className="btn"
                      onClick={addItem}
                      style={{ minWidth: 44, justifyContent: "center", padding: "0 12px" }}
                    >
                      <Icons.plus size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {items.length > 0 && (
                <div style={{ border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden", marginBottom: 14 }}>
                  {items.map((it) => (
                    <div
                      key={it.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto auto",
                        gap: 12,
                        alignItems: "center",
                        padding: "10px 12px",
                        borderBottom: "1px solid var(--line-2)",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{it.description}</div>
                        <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                          {it.quantity} × {fmt.money(it.amount)}
                          {it.itbis_amount > 0 && ` · ITBIS ${fmt.money(it.itbis_amount)}`}
                        </div>
                      </div>
                      <div className="mono" style={{ fontWeight: 600, fontSize: 13 }}>
                        {fmt.money(it.amount * it.quantity + it.itbis_amount)}
                      </div>
                      <button className="close-x" onClick={() => removeItem(it.id)} aria-label="Quitar">
                        <Icons.close size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {apiError && (
                <div
                  className="field-error"
                  style={{
                    background: "var(--bad-soft)",
                    border: "1px solid var(--bad-line)",
                    padding: "8px 10px",
                    borderRadius: 6,
                    marginBottom: 14,
                  }}
                >
                  {apiError}
                </div>
              )}
            </>
          )}
        </div>

        {flow !== null && (
          <div className="modal-foot">
            <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
              Total: {fmt.money(total)}
            </div>
            <div className="modal-foot-spacer" />
            <button className="btn-ghost" onClick={onClose} disabled={anyBusy}>
              Cancelar
            </button>
            <button className="btn btn-gray" onClick={handlePreview} disabled={anyBusy}>
              {previewing ? "Generando…" : "Ver Preview"}
            </button>
            <button className="btn btn-accent" onClick={submit} disabled={anyBusy}>
              {createFactura.isPending ? "Guardando…" : "Crear factura"}
            </button>
          </div>
        )}
      </div>
    </div>
    </ModalPortal>
  );
}

/* ------------------------------------------------------------------ */
/* Flow chooser                                                        */
/* ------------------------------------------------------------------ */

function FlowChooser({ onPick }: { onPick: (flow: Exclude<Flow, null>) => void }) {
  const cardStyle: CSSProperties = {
    textAlign: "left",
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: 18,
    cursor: "pointer",
    font: "inherit",
  };
  return (
    <div className="flow-grid">
      <button type="button" onClick={() => onPick("client")} style={cardStyle}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>Desde cliente</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
          Captura libre — sin cotización previa
        </div>
      </button>
      <button type="button" onClick={() => onPick("cotizacion")} style={cardStyle}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>Desde cotización</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
          Convierte una cotización existente en factura
        </div>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cotización search + banner                                          */
/* ------------------------------------------------------------------ */

function CotizacionSearch({ onSelect }: { onSelect: (cot: Cotizacion) => void }) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 350);
  const { data, isLoading } = useCotizacionesQuery({
    query: debounced,
    enabled: debounced.trim().length > 0,
  });
  const matches = data?.items ?? [];

  return (
    <div className="field">
      <label>Buscar cotización</label>
      <div className="search" style={{ maxWidth: "none" }}>
        <span className="search-icon">
          <Icons.search size={14} />
        </span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Código, cliente o descripción…" />
      </div>
      {query.trim() && (
        <div
          style={{
            marginTop: 8,
            maxHeight: 260,
            overflowY: "auto",
            border: "1px solid var(--line)",
            borderRadius: 6,
            background: "var(--surface)",
          }}
        >
          {isLoading && <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--muted)" }}>Cargando…</div>}
          {!isLoading && matches.length === 0 && (
            <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--muted)" }}>Sin resultados</div>
          )}
          {!isLoading &&
            matches.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  border: 0,
                  borderBottom: "1px solid var(--line-2)",
                  background: "transparent",
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span className="quote-code">{c.code ?? `#${c.id}`}</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                    {formatDisplayDate(c.date)}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>{c.client_name ?? ""}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                  {(c.description ?? "").split(/\n/).slice(0, 1).join(" ")}
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function SelectedCotizacionBanner({ cotizacion, onClear }: { cotizacion: Cotizacion; onClear: () => void }) {
  return (
    <div className="field">
      <label>Cotización</label>
      <div
        style={{
          border: "1px solid var(--good-line)",
          background: "var(--good-soft)",
          borderRadius: 6,
          padding: "12px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div>
          <span className="quote-code">{cotizacion.code ?? `#${cotizacion.id}`}</span>
          <div style={{ fontWeight: 600, fontSize: 14, marginTop: 6 }}>{cotizacion.client_name ?? "—"}</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            {(cotizacion.description ?? "").split(/\n/).slice(0, 1).join(" ")}
          </div>
        </div>
        <button type="button" className="btn-ghost" onClick={onClear}>
          Cambiar
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cliente picker                                                      */
/* ------------------------------------------------------------------ */

interface ClientePickerProps {
  selected: Cliente | null;
  onSelect: (cliente: Cliente) => void;
  onClear: () => void;
}

function ClientePicker({ selected, onSelect, onClear }: ClientePickerProps) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 350);
  const { data, isLoading } = useClientesQuery({
    query: debounced,
    enabled: !selected && debounced.trim().length > 0,
  });
  const matches = data?.items ?? [];

  if (selected) {
    return (
      <div className="field">
        <label>Cliente</label>
        <div
          style={{
            border: "1px solid var(--good-line)",
            background: "var(--good-soft)",
            borderRadius: 6,
            padding: "12px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{getClientDisplayName(selected)}</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
              {selected.company_name ?? ""}
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
              {selected.email ?? ""} {getClientPhone(selected) ? `· ${getClientPhone(selected)}` : ""}
            </div>
          </div>
          <button type="button" className="btn-ghost" onClick={onClear}>
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="field" style={{ position: "relative" }}>
      <label>Cliente</label>
      <input
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre, empresa, email o teléfono…"
      />
      {query.trim() && (
        <div
          style={{
            position: "absolute",
            zIndex: 5,
            left: 0,
            right: 0,
            top: "100%",
            marginTop: 4,
            maxHeight: 220,
            overflowY: "auto",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 6,
            boxShadow: "0 12px 30px rgba(12,12,12,0.08)",
          }}
        >
          {isLoading && <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--muted)" }}>Cargando…</div>}
          {!isLoading && matches.length === 0 && (
            <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--muted)" }}>Sin resultados</div>
          )}
          {!isLoading &&
            matches.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelect(c);
                  setQuery("");
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  border: 0,
                  borderBottom: "1px solid var(--line-2)",
                  background: "transparent",
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>{getClientDisplayName(c)}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                  {c.company_name ?? ""} {getClientPhone(c) ? `· ${getClientPhone(c)}` : ""}
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
