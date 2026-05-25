import { useMemo, useState, type FormEvent } from "react";
import { Icons } from "@/shared/components/press/PressIcons";
import { ModalPortal } from "@/shared/components/press/ModalPortal";
import { extractErrorMessage } from "@/shared/api/errors";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate, getTodayDate, toIsoDateOnly } from "@/shared/utils/format";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useClientesQuery } from "@/features/clientes/hooks/useClientesQuery";
import {
  getClientDisplayName,
  getClientPhone,
  type Cliente,
} from "@/features/clientes/types";
import { useNextNcf } from "@/features/ncf/hooks/useNcf";
import { fetchCotizacionById, useCotizacionesQuery } from "@/features/cotizaciones/hooks/useCotizacionesQuery";
import type { Cotizacion } from "@/features/cotizaciones/types";
import { useCreateFactura } from "../hooks/useCreateFactura";
import { useFacturaPdf } from "../hooks/useFacturaPdf";

interface CreateFacturaModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (message: string) => void;
}

type Flow = "client" | "cotizacion" | null;

interface ItemDraft {
  id: number;
  description: string;
  amount: number;
  quantity: number;
}

interface ItemFormState {
  description: string;
  amount: string;
  quantity: string;
}

const EMPTY_ITEM_FORM: ItemFormState = { description: "", amount: "", quantity: "1" };

export function CreateFacturaModal({ open, onClose, onCreated }: CreateFacturaModalProps) {
  const { user } = useAuth();
  const createMutation = useCreateFactura();
  const { fetchNextNCF } = useNextNcf();
  const { openSavedPdf, previewDraft } = useFacturaPdf();

  const [flow, setFlow] = useState<Flow>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [date, setDate] = useState<string>(getTodayDate());
  const [ncf, setNcf] = useState<string>("");
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [itemForm, setItemForm] = useState<ItemFormState>(EMPTY_ITEM_FORM);
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState<null | "preview" | "save">(null);

  const totalAmount = useMemo(
    () => items.reduce((s, it) => s + it.amount * it.quantity, 0),
    [items],
  );

  const reset = () => {
    setFlow(null);
    setSelectedCliente(null);
    setSelectedCotizacion(null);
    setDate(getTodayDate());
    setNcf("");
    setItems([]);
    setItemForm(EMPTY_ITEM_FORM);
    setApiError("");
  };

  if (!open) return null;

  const close = () => {
    if (createMutation.isPending || busy) return;
    reset();
    onClose();
  };

  const addItem = () => {
    const description = itemForm.description.trim();
    const amount = parseFloat(itemForm.amount);
    const quantity = parseFloat(itemForm.quantity);
    if (!description || isNaN(amount) || isNaN(quantity) || amount <= 0 || quantity <= 0) return;
    setItems((prev) => [...prev, { id: Date.now(), description, amount, quantity }]);
    setItemForm(EMPTY_ITEM_FORM);
  };

  const removeItem = (id: number) => setItems((prev) => prev.filter((it) => it.id !== id));

  // When the client flow's cliente is chosen, pre-fetch the next NCF.
  const handleClientSelect = async (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setApiError("");
    if (!ncf) {
      const next = await fetchNextNCF();
      if (next) setNcf(next);
    }
  };

  // When a cotización is selected, copy its client + items into our state.
  const handleCotizacionSelect = async (cot: Cotizacion) => {
    setApiError("");
    let full: Cotizacion | null = cot;
    try {
      const fetched = await fetchCotizacionById(cot.id);
      if (fetched) full = fetched;
    } catch {
      // best-effort; fall back to the list result
    }
    setSelectedCotizacion(full);
    setDate(toIsoDateOnly(full?.date));

    const cotItems = Array.isArray(full?.items) ? full.items : [];
    if (cotItems.length > 0) {
      setItems(
        cotItems.map((it, idx) => ({
          id: Date.now() + idx,
          description: it.description,
          amount: typeof it.amount === "string" ? parseFloat(it.amount) : Number(it.amount),
          quantity: Number(it.quantity ?? 1),
        })),
      );
    } else if (full?.description) {
      const t = typeof full.total === "string" ? parseFloat(full.total) : Number(full.total ?? 0);
      setItems([{ id: Date.now(), description: full.description, amount: isNaN(t) ? 0 : t, quantity: 1 }]);
    } else {
      setItems([]);
    }

    setSelectedCliente({
      id: full?.client_id ?? 0,
      client_name: full?.client_name,
      company_name: full?.company_name,
      email: full?.email,
      phone_number: full?.phone_number,
      telefono: full?.telefono,
      direccion: full?.direccion,
      rnc: full?.rnc,
    });

    if (!ncf) {
      const next = await fetchNextNCF();
      if (next) setNcf(next);
    }
  };

  const buildCreatePayload = () => ({
    date,
    client: selectedCliente ? getClientDisplayName(selectedCliente) : "",
    client_id: selectedCliente?.id ?? 0,
    user_id: user?.id,
    items: items.map((it) => ({
      description: it.description,
      amount: it.amount,
      quantity: it.quantity,
    })),
    ncf: ncf || undefined,
  });

  const buildPreviewPayload = () => ({
    client_id: selectedCliente?.id ?? 0,
    items: items.map((it) => ({
      description: it.description,
      amount: it.amount,
      quantity: it.quantity,
    })),
    ncf,
    date,
  });

  const requireValid = (forPreview: boolean): string | null => {
    if (!selectedCliente?.id) return "Selecciona un cliente";
    if (items.length === 0) return "Agrega al menos un item";
    if (forPreview && !ncf) return "El preview requiere un NCF";
    return null;
  };

  const handlePreview = async () => {
    const invalid = requireValid(true);
    if (invalid) {
      setApiError(invalid);
      return;
    }
    setApiError("");
    setBusy("preview");
    try {
      await previewDraft(buildPreviewPayload());
    } catch (err) {
      setApiError(extractErrorMessage(err) ?? "No se pudo generar el preview.");
    } finally {
      setBusy(null);
    }
  };

  const handleSave = async () => {
    const invalid = requireValid(false);
    if (invalid) {
      setApiError(invalid);
      return;
    }
    setApiError("");
    setBusy("save");
    try {
      const response = await createMutation.mutateAsync(buildCreatePayload());
      onCreated?.("Factura emitida");
      const id = response?.id;
      reset();
      onClose();
      if (id) await openSavedPdf(id);
    } catch (err) {
      setApiError(extractErrorMessage(err) ?? "No se pudo guardar la factura.");
    } finally {
      setBusy(null);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleSave();
  };

  const anyBusy = busy != null || createMutation.isPending;
  const wide = flow !== null;

  return (
    <ModalPortal>
      <div className="modal-bg" onClick={close}>
        <div
          className={"modal anim-in" + (wide ? " wide" : "")}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-pad">
            <div className="modal-head">
              <div>
                <h2 className="modal-title">Nueva factura</h2>
                <div className="modal-sub">
                  {flow === null
                    ? "Elige cómo crear la factura."
                    : flow === "client"
                      ? "Desde cliente — captura libre"
                      : "Desde cotización — heredamos el detalle"}
                </div>
              </div>
              <button className="close-x" onClick={close} aria-label="Cerrar">
                <Icons.close size={18} />
              </button>
            </div>

            {apiError && (
              <div
                className="field-error"
                style={{
                  background: "#f7e9e9",
                  border: "1px solid #e8c3c3",
                  padding: "8px 10px",
                  borderRadius: 6,
                  marginBottom: 14,
                }}
              >
                {apiError}
              </div>
            )}

            {flow === null && <FlowChooser onPick={setFlow} />}

            {flow === "client" && (
              <form onSubmit={onSubmit}>
                <ClientePicker
                  selected={selectedCliente}
                  onSelect={handleClientSelect}
                  onClear={() => setSelectedCliente(null)}
                />
                <DateNcfTotal date={date} onDateChange={setDate} ncf={ncf} onNcfChange={setNcf} total={totalAmount} />
                <ItemsSection
                  itemForm={itemForm}
                  onItemFormChange={setItemForm}
                  onAddItem={addItem}
                  items={items}
                  onRemoveItem={removeItem}
                />
              </form>
            )}

            {flow === "cotizacion" && (
              <>
                {!selectedCotizacion ? (
                  <CotizacionSearch onSelect={handleCotizacionSelect} />
                ) : (
                  <form onSubmit={onSubmit}>
                    <SelectedCotizacionBanner
                      cotizacion={selectedCotizacion}
                      onClear={() => {
                        setSelectedCotizacion(null);
                        setSelectedCliente(null);
                        setItems([]);
                      }}
                    />
                    <DateNcfTotal
                      date={date}
                      onDateChange={setDate}
                      ncf={ncf}
                      onNcfChange={setNcf}
                      total={totalAmount}
                    />
                    <ItemsSection
                      itemForm={itemForm}
                      onItemFormChange={setItemForm}
                      onAddItem={addItem}
                      items={items}
                      onRemoveItem={removeItem}
                    />
                  </form>
                )}
              </>
            )}
          </div>

          {flow !== null && (
            <div className="modal-foot">
              <button type="button" className="btn-ghost" onClick={() => setFlow(null)} disabled={anyBusy}>
                ← Volver
              </button>
              <div style={{ flex: 1 }} />
              <button type="button" className="btn-ghost" onClick={close} disabled={anyBusy}>
                Cancelar
              </button>
              <button type="button" className="btn btn-gray" onClick={handlePreview} disabled={anyBusy}>
                {busy === "preview" ? "Generando…" : "Ver Preview"}
              </button>
              <button type="button" className="btn btn-green" onClick={handleSave} disabled={anyBusy}>
                {busy === "save" ? "Emitiendo…" : "Emitir factura"}
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

function FlowChooser({ onPick }: { onPick: (flow: Flow) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 6 }}>
      <button
        type="button"
        onClick={() => onPick("client")}
        style={{
          textAlign: "left",
          background: "#fff",
          border: "1px solid var(--line)",
          borderRadius: 8,
          padding: 18,
          cursor: "pointer",
          font: "inherit",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 15 }}>Desde cliente</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
          Captura libre — sin cotización previa
        </div>
      </button>
      <button
        type="button"
        onClick={() => onPick("cotizacion")}
        style={{
          textAlign: "left",
          background: "#fff",
          border: "1px solid var(--line)",
          borderRadius: 8,
          padding: 18,
          cursor: "pointer",
          font: "inherit",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 15 }}>Desde cotización</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
          Convierte una cotización existente en factura
        </div>
      </button>
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
  const { data, isLoading, error } = useClientesQuery({
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
            border: "1px solid #bcd9c5",
            background: "#eaf5ed",
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
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 6,
            boxShadow: "0 12px 30px rgba(12,12,12,0.08)",
          }}
        >
          {isLoading && (
            <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--muted)" }}>Cargando…</div>
          )}
          {!isLoading && error && (
            <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--bad)" }}>
              {error instanceof Error ? error.message : String(error)}
            </div>
          )}
          {!isLoading && !error && matches.length === 0 && (
            <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--muted)" }}>Sin resultados</div>
          )}
          {!isLoading && !error &&
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
                  background: "transparent",
                  border: 0,
                  borderBottom: "1px solid var(--line-2)",
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>{getClientDisplayName(c)}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                  {c.company_name ?? ""} {c.email ? `· ${c.email}` : ""}
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cotización search                                                   */
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
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Código, cliente o descripción…"
      />
      {query.trim() && (
        <div
          style={{
            marginTop: 8,
            maxHeight: 260,
            overflowY: "auto",
            border: "1px solid var(--line)",
            borderRadius: 6,
            background: "#fff",
          }}
        >
          {isLoading && (
            <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--muted)" }}>Cargando…</div>
          )}
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
                <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>
                  {c.client_name ?? ""}
                </div>
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

function SelectedCotizacionBanner({
  cotizacion,
  onClear,
}: {
  cotizacion: Cotizacion;
  onClear: () => void;
}) {
  return (
    <div className="field">
      <label>Cotización</label>
      <div
        style={{
          border: "1px solid #bcd9c5",
          background: "#eaf5ed",
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
          <div style={{ fontWeight: 600, fontSize: 14, marginTop: 6 }}>
            {cotizacion.client_name ?? "—"}
          </div>
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
/* Date + NCF + Total panel                                            */
/* ------------------------------------------------------------------ */

function DateNcfTotal({
  date,
  onDateChange,
  ncf,
  onNcfChange,
  total,
}: {
  date: string;
  onDateChange: (v: string) => void;
  ncf: string;
  onNcfChange: (v: string) => void;
  total: number;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 14 }}>
      <div className="field" style={{ margin: 0 }}>
        <label>Fecha</label>
        <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
      </div>
      <div className="field" style={{ margin: 0 }}>
        <label>NCF</label>
        <input value={ncf} onChange={(e) => onNcfChange(e.target.value)} placeholder="B01…" />
      </div>
      <div className="field" style={{ margin: 0 }}>
        <label>Total</label>
        <div
          className="mono"
          style={{
            padding: "9px 12px",
            border: "1px solid var(--line)",
            borderRadius: 6,
            background: "var(--bg)",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {fmt.money(total)}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Items section                                                       */
/* ------------------------------------------------------------------ */

interface ItemsSectionProps {
  itemForm: ItemFormState;
  onItemFormChange: (form: ItemFormState) => void;
  onAddItem: () => void;
  items: ItemDraft[];
  onRemoveItem: (id: number) => void;
}

function ItemsSection({
  itemForm,
  onItemFormChange,
  onAddItem,
  items,
  onRemoveItem,
}: ItemsSectionProps) {
  return (
    <>
      <div
        style={{
          marginTop: 18,
          padding: "14px 16px",
          border: "1px solid var(--line)",
          borderRadius: 8,
          background: "var(--bg)",
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 10,
            color: "var(--muted)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Items de la factura
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 90px auto", gap: 10, alignItems: "end" }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Descripción</label>
            <textarea
              rows={2}
              value={itemForm.description}
              onChange={(e) => onItemFormChange({ ...itemForm, description: e.target.value })}
              placeholder="Descripción del item…"
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Monto ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={itemForm.amount}
              onChange={(e) => onItemFormChange({ ...itemForm, amount: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Cantidad</label>
            <input
              type="number"
              step="1"
              min="1"
              value={itemForm.quantity}
              onChange={(e) => onItemFormChange({ ...itemForm, quantity: e.target.value })}
            />
          </div>
          <button type="button" className="btn btn-accent" onClick={onAddItem} style={{ height: 36 }}>
            Agregar
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12, border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
        {items.length === 0 ? (
          <div style={{ padding: "18px 16px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            No hay items agregados
          </div>
        ) : (
          <table className="ds-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: 40, paddingLeft: 16 }}>#</th>
                <th>Descripción</th>
                <th style={{ width: 140, textAlign: "right" }}>Cantidad × Monto</th>
                <th style={{ width: 110, textAlign: "right" }}>Subtotal</th>
                <th style={{ width: 100, textAlign: "right", paddingRight: 16 }} />
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id} style={{ cursor: "default" }}>
                  <td className="mono" style={{ paddingLeft: 16 }}>{idx + 1}</td>
                  <td>
                    <div style={{ whiteSpace: "pre-line", maxWidth: 360 }}>{it.description}</div>
                  </td>
                  <td className="mono" style={{ textAlign: "right" }}>
                    {it.quantity} × {fmt.money(it.amount)}
                  </td>
                  <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>
                    {fmt.money(it.amount * it.quantity)}
                  </td>
                  <td style={{ textAlign: "right", paddingRight: 16 }}>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ color: "var(--bad)", borderColor: "#e8c3c3" }}
                      onClick={() => onRemoveItem(it.id)}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
