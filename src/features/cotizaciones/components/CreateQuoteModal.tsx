import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Icons } from "@/shared/components/press/PressIcons";
import { ModalPortal } from "@/shared/components/press/ModalPortal";
import { extractErrorMessage } from "@/shared/api/errors";
import { fmt } from "@/shared/utils/press-fmt";
import { getTodayDate, toIsoDateOnly } from "@/shared/utils/format";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useClientesQuery } from "@/features/clientes/hooks/useClientesQuery";
import {
  getClientDisplayName,
  getClientPhone,
  type Cliente,
} from "@/features/clientes/types";
import { useSaveCotizacion } from "../hooks/useSaveCotizacion";
import { useCotizacionPdf } from "../hooks/useCotizacionPdf";
import type { Cotizacion } from "../types";

interface CreateQuoteModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (message: string) => void;
  /**
   * If provided, the modal opens in edit mode: pre-fills cliente / date /
   * items from this record, and the save mutation updates instead of creates.
   */
  editingCotizacion?: Cotizacion | null;
}

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

export function CreateQuoteModal({
  open,
  onClose,
  onCreated,
  editingCotizacion = null,
}: CreateQuoteModalProps) {
  const { user } = useAuth();
  const saveMutation = useSaveCotizacion();
  const { openSavedPdf, previewDraft } = useCotizacionPdf();

  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [date, setDate] = useState<string>(getTodayDate());
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [itemForm, setItemForm] = useState<ItemFormState>(EMPTY_ITEM_FORM);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ItemFormState>(EMPTY_ITEM_FORM);

  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState<null | "preview" | "save" | "send">(null);

  const isEditMode = editingCotizacion != null;

  // Re-hydrate the form whenever the modal opens with an editingCotizacion.
  useEffect(() => {
    if (!open) return;
    if (!editingCotizacion) {
      // create flow — start blank
      setSelectedCliente(null);
      setDate(getTodayDate());
      setItems([]);
      setApiError("");
      return;
    }

    const cot = editingCotizacion;
    setDate(toIsoDateOnly(cot.date));
    setSelectedCliente({
      id: cot.client_id ?? 0,
      client_name: cot.client_name,
      company_name: cot.company_name,
      email: cot.email,
      phone_number: cot.phone_number,
      telefono: cot.telefono,
      direccion: cot.direccion,
      rnc: cot.rnc,
    });

    const cotItems = Array.isArray(cot.items) ? cot.items : [];
    if (cotItems.length > 0) {
      setItems(
        cotItems.map((it, idx) => ({
          id: (it.id as number | undefined) ?? Date.now() + idx,
          description: it.description,
          amount: typeof it.amount === "string" ? parseFloat(it.amount) : Number(it.amount),
          quantity: Number(it.quantity ?? 1),
        })),
      );
    } else if (cot.description) {
      const t = typeof cot.total === "string" ? parseFloat(cot.total) : Number(cot.total ?? 0);
      setItems([
        { id: Date.now(), description: cot.description, amount: isNaN(t) ? 0 : t, quantity: 1 },
      ]);
    } else {
      setItems([]);
    }
    setApiError("");
  }, [open, editingCotizacion]);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.amount * item.quantity, 0),
    [items],
  );

  if (!open) return null;

  const reset = () => {
    setSelectedCliente(null);
    setDate(getTodayDate());
    setItems([]);
    setItemForm(EMPTY_ITEM_FORM);
    setEditingItemId(null);
    setEditForm(EMPTY_ITEM_FORM);
    setApiError("");
  };

  const close = () => {
    if (saveMutation.isPending || busy) return;
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

  const startEditItem = (id: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setEditingItemId(id);
    setEditForm({
      description: item.description,
      amount: item.amount.toString(),
      quantity: item.quantity.toString(),
    });
  };

  const cancelEditItem = () => {
    setEditingItemId(null);
    setEditForm(EMPTY_ITEM_FORM);
  };

  const saveEditItem = () => {
    if (editingItemId == null) return;
    const description = editForm.description.trim();
    const amount = parseFloat(editForm.amount);
    const quantity = parseFloat(editForm.quantity);
    if (!description || isNaN(amount) || isNaN(quantity) || amount <= 0 || quantity <= 0) return;
    setItems((prev) =>
      prev.map((it) =>
        it.id === editingItemId ? { ...it, description, amount, quantity } : it,
      ),
    );
    cancelEditItem();
  };

  const buildPayload = () => ({
    client_id: selectedCliente?.id ?? null,
    client_name: selectedCliente ? getClientDisplayName(selectedCliente) : null,
    user_id: user?.id,
    date,
    items: items.map((it) => ({
      description: it.description,
      amount: it.amount,
      quantity: it.quantity,
      subtotal: it.amount * it.quantity,
    })),
    total: totalAmount,
  });

  const requireValid = (): string | null => {
    if (!selectedCliente) return "Selecciona un cliente";
    if (items.length === 0) return "Agrega al menos un item";
    return null;
  };

  const handlePreview = async () => {
    const invalid = requireValid();
    if (invalid) {
      setApiError(invalid);
      return;
    }
    setApiError("");
    setBusy("preview");
    try {
      await previewDraft(buildPayload());
    } catch (err) {
      setApiError(extractErrorMessage(err) ?? "No se pudo generar el preview.");
    } finally {
      setBusy(null);
    }
  };

  const handleSave = async (sendEmail: boolean) => {
    const invalid = requireValid();
    if (invalid) {
      setApiError(invalid);
      return;
    }
    setApiError("");
    setBusy(sendEmail ? "send" : "save");
    try {
      const id = await saveMutation.mutateAsync({
        editingId: editingCotizacion?.id ?? null,
        payload: { ...buildPayload(), sent_email: sendEmail },
      });
      onCreated?.(
        isEditMode
          ? sendEmail
            ? "Cotización actualizada y enviada"
            : "Cotización actualizada"
          : sendEmail
            ? "Cotización enviada"
            : "Cotización creada",
      );
      reset();
      onClose();
      if (id) {
        // Open the generated PDF in a new tab so the user sees the saved doc.
        await openSavedPdf(id);
      }
    } catch (err) {
      setApiError(extractErrorMessage(err) ?? "No se pudo guardar la cotización.");
    } finally {
      setBusy(null);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleSave(false);
  };

  const anyBusy = busy != null || saveMutation.isPending;

  return (
    <ModalPortal>
      <div className="modal-bg" onClick={close}>
        <div className="modal wide anim-in" onClick={(e) => e.stopPropagation()}>
          <div className="modal-pad">
            <div className="modal-head">
              <div>
                <h2 className="modal-title">
                  {isEditMode ? "Editar cotización" : "Nueva cotización"}
                </h2>
                <div className="modal-sub">
                  {isEditMode
                    ? `Editando ${editingCotizacion?.code ?? `#${editingCotizacion?.id}`}`
                    : "Completa los datos y agrega los items."}
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

            <form onSubmit={onSubmit}>
              <ClientePicker
                selected={selectedCliente}
                onSelect={setSelectedCliente}
                onClear={() => setSelectedCliente(null)}
              />

              <div className="field-row" style={{ marginTop: 14 }}>
                <div className="field">
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Total estimado</label>
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
                    {fmt.money(totalAmount)}
                  </div>
                </div>
              </div>

              <ItemsSection
                itemForm={itemForm}
                onItemFormChange={setItemForm}
                onAddItem={addItem}
                items={items}
                editingItemId={editingItemId}
                editForm={editForm}
                onEditFormChange={setEditForm}
                onStartEdit={startEditItem}
                onCancelEdit={cancelEditItem}
                onSaveEdit={saveEditItem}
                onRemoveItem={removeItem}
              />
            </form>
          </div>
          <div className="modal-foot">
            <button className="btn-ghost" onClick={close} disabled={anyBusy}>
              Cancelar
            </button>
            <button
              className="btn btn-gray"
              onClick={handlePreview}
              disabled={anyBusy}
              type="button"
            >
              {busy === "preview" ? "Generando…" : "Ver Preview"}
            </button>
            <button
              className="btn btn-blue"
              onClick={() => handleSave(false)}
              disabled={anyBusy}
              type="button"
            >
              {busy === "save" ? "Guardando…" : isEditMode ? "Actualizar" : "Guardar"}
            </button>
            <button
              className="btn btn-green"
              onClick={() => handleSave(true)}
              disabled={anyBusy}
              type="button"
            >
              {busy === "send" ? "Enviando…" : isEditMode ? "Actualizar y enviar" : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

/* ------------------------------------------------------------------ */
/* Cliente picker — debounced server-side search + selected card view */
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
            <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--muted)" }}>
              Cargando…
            </div>
          )}
          {!isLoading && error && (
            <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--bad)" }}>
              {error instanceof Error ? error.message : String(error)}
            </div>
          )}
          {!isLoading && !error && matches.length === 0 && (
            <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--muted)" }}>
              Sin resultados
            </div>
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
/* Items section — add form + table with inline edit                  */
/* ------------------------------------------------------------------ */

interface ItemsSectionProps {
  itemForm: ItemFormState;
  onItemFormChange: (form: ItemFormState) => void;
  onAddItem: () => void;
  items: ItemDraft[];
  editingItemId: number | null;
  editForm: ItemFormState;
  onEditFormChange: (form: ItemFormState) => void;
  onStartEdit: (id: number) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onRemoveItem: (id: number) => void;
}

function ItemsSection({
  itemForm,
  onItemFormChange,
  onAddItem,
  items,
  editingItemId,
  editForm,
  onEditFormChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
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
          Items de la cotización
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
                <th style={{ width: 150, textAlign: "right", paddingRight: 16 }} />
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const isEditing = editingItemId === it.id;
                return (
                  <tr key={it.id} style={{ cursor: "default" }}>
                    <td className="mono" style={{ paddingLeft: 16 }}>{idx + 1}</td>
                    <td>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={editForm.description}
                          onChange={(e) => onEditFormChange({ ...editForm, description: e.target.value })}
                          style={{
                            width: "100%",
                            border: "1px solid var(--line)",
                            borderRadius: 6,
                            padding: "6px 8px",
                            fontFamily: "inherit",
                            fontSize: 13,
                          }}
                        />
                      ) : (
                        <div style={{ whiteSpace: "pre-line", maxWidth: 360 }}>{it.description}</div>
                      )}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {isEditing ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <input
                            type="number"
                            step="1"
                            min="1"
                            value={editForm.quantity}
                            onChange={(e) => onEditFormChange({ ...editForm, quantity: e.target.value })}
                            style={{
                              width: "100%",
                              border: "1px solid var(--line)",
                              borderRadius: 6,
                              padding: "4px 8px",
                              textAlign: "right",
                              fontFamily: "inherit",
                              fontSize: 12,
                            }}
                          />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editForm.amount}
                            onChange={(e) => onEditFormChange({ ...editForm, amount: e.target.value })}
                            style={{
                              width: "100%",
                              border: "1px solid var(--line)",
                              borderRadius: 6,
                              padding: "4px 8px",
                              textAlign: "right",
                              fontFamily: "inherit",
                              fontSize: 12,
                            }}
                          />
                        </div>
                      ) : (
                        <>{it.quantity} × {fmt.money(it.amount)}</>
                      )}
                    </td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>
                      {fmt.money(
                        isEditing
                          ? (parseFloat(editForm.amount) || 0) * (parseFloat(editForm.quantity) || 0)
                          : it.amount * it.quantity,
                      )}
                    </td>
                    <td style={{ textAlign: "right", paddingRight: 16 }}>
                      {isEditing ? (
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button type="button" className="btn-ghost" onClick={onCancelEdit}>
                            Cancelar
                          </button>
                          <button type="button" className="btn btn-green" onClick={onSaveEdit}>
                            Guardar
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button
                            type="button"
                            className="btn-ghost"
                            style={{ color: "var(--bad)", borderColor: "#e8c3c3" }}
                            onClick={() => onRemoveItem(it.id)}
                          >
                            Quitar
                          </button>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => onStartEdit(it.id)}
                          >
                            Editar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
