import { useEffect, useState } from "react";
import { Icons } from "@/shared/components/press/PressIcons";
import { ModalPortal } from "@/shared/components/press/ModalPortal";
import { extractErrorMessage } from "@/shared/api/errors";
import { fmt } from "@/shared/utils/press-fmt";
import { getTodayDate, formatDisplayDate } from "@/shared/utils/format";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { parseCotizacionAmount } from "@/features/dashboard/hooks/useDashboardData";
import {
  useCotizacionesQuery,
  fetchCotizacionById,
} from "../hooks/useCotizacionesQuery";
import { useSaveCotizacion } from "../hooks/useSaveCotizacion";
import { useCotizacionPdf } from "../hooks/useCotizacionPdf";
import type { Cotizacion } from "../types";

interface DuplicateQuoteModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (message: string) => void;
  /**
   * If provided, skip the search step and open with this cotización
   * pre-selected. Useful when duplicating from the detail page.
   */
  initialCotizacion?: Cotizacion | null;
}

interface DraftItem {
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

function cotizacionToDraftItems(c: Cotizacion): DraftItem[] {
  const items = Array.isArray(c.items) ? c.items : [];
  if (items.length > 0) {
    return items.map((it, idx) => ({
      id: Date.now() + idx,
      description: it.description,
      amount: typeof it.amount === "string" ? parseFloat(it.amount) : Number(it.amount),
      quantity: Number(it.quantity ?? 1),
    }));
  }
  if (c.description) {
    const t = parseCotizacionAmount(c);
    return [{ id: Date.now(), description: c.description, amount: t, quantity: 1 }];
  }
  return [];
}

export function DuplicateQuoteModal({
  open,
  onClose,
  onCreated,
  initialCotizacion = null,
}: DuplicateQuoteModalProps) {
  const { user } = useAuth();
  const saveMutation = useSaveCotizacion();
  const { openSavedPdf, previewDraft } = useCotizacionPdf();

  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 350);
  const { data, isFetching } = useCotizacionesQuery({
    query: debounced,
    page: 1,
    pageSize: 10,
    enabled: open && !initialCotizacion,
  });
  const matches = data?.items ?? [];

  const [selected, setSelected] = useState<Cotizacion | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState<null | "preview" | "save" | "send">(null);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ItemFormState>(EMPTY_ITEM_FORM);
  const [addItemsOpen, setAddItemsOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!initialCotizacion) return;
    // Skip search — preload with the provided cotización.
    setApiError("");
    setLoadingDetail(true);
    let cancelled = false;
    (async () => {
      try {
        const full = await fetchCotizacionById(initialCotizacion.id);
        const finalCot = full ?? initialCotizacion;
        if (!cancelled) {
          setSelected(finalCot);
          setDraftItems(cotizacionToDraftItems(finalCot));
        }
      } catch (err) {
        if (!cancelled) {
          setApiError(extractErrorMessage(err) ?? "No se pudo cargar la cotización.");
          setSelected(initialCotizacion);
          setDraftItems(cotizacionToDraftItems(initialCotizacion));
        }
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, initialCotizacion]);

  if (!open) return null;

  const reset = () => {
    setQuery("");
    setSelected(null);
    setApiError("");
    setBusy(null);
    setDraftItems([]);
    setEditingItemId(null);
    setEditForm(EMPTY_ITEM_FORM);
    setAddItemsOpen(false);
  };

  const removeDraftItem = (id: number) => {
    setDraftItems((prev) => prev.filter((it) => it.id !== id));
    if (editingItemId === id) {
      setEditingItemId(null);
      setEditForm(EMPTY_ITEM_FORM);
    }
  };

  const startEditItem = (id: number) => {
    const item = draftItems.find((i) => i.id === id);
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
    if (!description || isNaN(amount) || isNaN(quantity) || amount <= 0 || quantity <= 0) {
      setApiError("Item inválido — descripción, monto y cantidad son requeridos.");
      return;
    }
    setApiError("");
    setDraftItems((prev) =>
      prev.map((it) =>
        it.id === editingItemId ? { ...it, description, amount, quantity } : it,
      ),
    );
    cancelEditItem();
  };

  const close = () => {
    if (busy || saveMutation.isPending) return;
    reset();
    onClose();
  };

  const pick = async (c: Cotizacion) => {
    setApiError("");
    setLoadingDetail(true);
    try {
      const full = await fetchCotizacionById(c.id);
      const finalCot = full ?? c;
      setSelected(finalCot);
      setDraftItems(cotizacionToDraftItems(finalCot));
    } catch (err) {
      setApiError(extractErrorMessage(err) ?? "No se pudo cargar la cotización.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const buildPayload = () => {
    if (!selected) return null;
    if (editingItemId != null) {
      setApiError("Termina de editar el item antes de continuar.");
      return null;
    }
    if (draftItems.length === 0) return null;
    const items = draftItems.map((it) => ({
      description: it.description,
      amount: it.amount,
      quantity: it.quantity,
      subtotal: it.amount * it.quantity,
    }));
    const total = items.reduce((s, it) => s + it.subtotal, 0);
    return {
      client_id: selected.client_id ?? null,
      client_name: selected.client_name ?? null,
      user_id: user?.id,
      date: getTodayDate(),
      items,
      total,
    };
  };

  const preview = async () => {
    const payload = buildPayload();
    if (!payload) {
      setApiError("La cotización seleccionada no tiene items para previsualizar.");
      return;
    }
    setApiError("");
    setBusy("preview");
    try {
      await previewDraft(payload);
    } catch (err) {
      setApiError(extractErrorMessage(err) ?? "No se pudo generar el preview.");
    } finally {
      setBusy(null);
    }
  };

  const duplicate = async (sendEmail: boolean) => {
    const payload = buildPayload();
    if (!payload) {
      setApiError("La cotización seleccionada no tiene items para duplicar.");
      return;
    }
    setApiError("");
    setBusy(sendEmail ? "send" : "save");
    try {
      const id = await saveMutation.mutateAsync({
        editingId: null,
        payload: { ...payload, sent_email: sendEmail },
      });
      onCreated?.(sendEmail ? "Cotización duplicada y enviada" : "Cotización duplicada");
      reset();
      onClose();
      if (id) await openSavedPdf(id);
    } catch (err) {
      setApiError(extractErrorMessage(err) ?? "No se pudo duplicar la cotización.");
    } finally {
      setBusy(null);
    }
  };

  const selectedTotal = draftItems.reduce((s, it) => s + it.amount * it.quantity, 0);

  const anyBusy = busy != null || saveMutation.isPending;

  return (
    <ModalPortal>
      <div className="modal-bg" onClick={close}>
        <div className="modal wide anim-in" onClick={(e) => e.stopPropagation()}>
          <div className="modal-pad">
            <div className="modal-head">
              <div>
                <h2 className="modal-title">Duplicar cotización</h2>
                <div className="modal-sub">
                  Busca una cotización existente. Se creará una nueva con la fecha de hoy.
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

            {selected ? (
              <SelectedPreview
                cotizacion={selected}
                total={selectedTotal}
                draftItems={draftItems}
                editingItemId={editingItemId}
                editForm={editForm}
                onEditFormChange={setEditForm}
                onStartEdit={startEditItem}
                onCancelEdit={cancelEditItem}
                onSaveEdit={saveEditItem}
                onRemoveItem={removeDraftItem}
                onClear={() => {
                  setSelected(null);
                  setDraftItems([]);
                  setEditingItemId(null);
                  setEditForm(EMPTY_ITEM_FORM);
                }}
              />
            ) : (
              <SearchList
                query={query}
                onQueryChange={setQuery}
                isFetching={isFetching || loadingDetail}
                matches={matches}
                onPick={pick}
              />
            )}
          </div>
          <div className="modal-foot">
            <button className="btn-ghost" onClick={close} disabled={anyBusy}>
              Cancelar
            </button>
            {selected && (
              <>
                <button
                  className="btn btn-gray"
                  onClick={() => setAddItemsOpen(true)}
                  disabled={anyBusy}
                  type="button"
                  title="Agregar items nuevos a la cotización duplicada"
                >
                  <Icons.plus size={13} /> Agregar items
                </button>
                <button
                  className="btn btn-gray"
                  onClick={preview}
                  disabled={anyBusy}
                  type="button"
                  title="Ver el PDF de la cotización duplicada antes de guardar"
                >
                  {busy === "preview" ? "Generando…" : "Ver Preview"}
                </button>
                <button
                  className="btn btn-accent"
                  onClick={() => duplicate(false)}
                  disabled={anyBusy}
                  type="button"
                >
                  {busy === "save" ? "Duplicando…" : "Duplicar con fecha de hoy"}
                </button>
                <button
                  className="btn btn-green"
                  onClick={() => duplicate(true)}
                  disabled={anyBusy}
                  type="button"
                  title="Guarda la cotización duplicada y envía el correo al cliente"
                >
                  {busy === "send" ? "Enviando…" : "Enviar con fecha de hoy"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {addItemsOpen && (
        <AddItemsModal
          onAdd={(it) => setDraftItems((prev) => [...prev, it])}
          onClose={() => setAddItemsOpen(false)}
        />
      )}
    </ModalPortal>
  );
}

interface SearchListProps {
  query: string;
  onQueryChange: (q: string) => void;
  isFetching: boolean;
  matches: Cotizacion[];
  onPick: (c: Cotizacion) => void;
}

function SearchList({ query, onQueryChange, isFetching, matches, onPick }: SearchListProps) {
  return (
    <div className="field">
      <label>Buscar cotización</label>
      <div className="search" style={{ maxWidth: "none" }}>
        <span className="search-icon">
          <Icons.search size={14} />
        </span>
        <input
          autoComplete="off"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Buscar por código, cliente o descripción…"
        />
      </div>
      <div
        style={{
          marginTop: 10,
          border: "1px solid var(--line)",
          borderRadius: 8,
          maxHeight: 360,
          overflowY: "auto",
        }}
      >
        {isFetching && (
          <div style={{ padding: "12px 14px", fontSize: 12, color: "var(--muted)" }}>
            Cargando…
          </div>
        )}
        {!isFetching && matches.length === 0 && (
          <div style={{ padding: "16px", fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
            Sin resultados
          </div>
        )}
        {!isFetching &&
          matches.map((c) => (
            <button
              key={c.id}
              type="button"
              className="search-row"
              onClick={() => onPick(c)}
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                textAlign: "left",
                padding: "10px 14px",
                border: 0,
                borderBottom: "1px solid var(--line-2)",
                cursor: "pointer",
                font: "inherit",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {c.client_name ?? "—"}{" "}
                  <span className="mono" style={{ color: "var(--muted)", fontSize: 11 }}>
                    {c.code ?? `#${c.id}`}
                  </span>
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatDisplayDate(c.date)} · {c.description ?? ""}
                </div>
              </div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                {fmt.money(parseCotizacionAmount(c))}
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}

interface SelectedPreviewProps {
  cotizacion: Cotizacion;
  total: number;
  draftItems: DraftItem[];
  editingItemId: number | null;
  editForm: ItemFormState;
  onEditFormChange: (form: ItemFormState) => void;
  onStartEdit: (id: number) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onRemoveItem: (id: number) => void;
  onClear: () => void;
}

function SelectedPreview({
  cotizacion,
  total,
  draftItems,
  editingItemId,
  editForm,
  onEditFormChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRemoveItem,
  onClear,
}: SelectedPreviewProps) {
  return (
    <div className="field">
      <label>Cotización seleccionada</label>
      <div
        style={{
          border: "1px solid var(--good-line)",
          background: "var(--good-soft)",
          borderRadius: 8,
          padding: "14px 16px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {cotizacion.client_name ?? "—"}{" "}
              <span className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>
                {cotizacion.code ?? `#${cotizacion.id}`}
              </span>
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
              {cotizacion.company_name ?? ""} · emitida {formatDisplayDate(cotizacion.date)}
            </div>
            <div
              className="mono"
              style={{ fontSize: 10, color: "var(--muted)", marginTop: 6, letterSpacing: "0.04em" }}
            >
              "Duplicar" guarda sin enviar email. "Enviar" guarda y envía al cliente.
            </div>
          </div>
          <button type="button" className="btn-ghost" onClick={onClear}>
            Cambiar
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          border: "1px solid var(--line)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <table className="ds-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th style={{ width: 36, paddingLeft: 16 }}>#</th>
              <th>Descripción</th>
              <th style={{ width: 160, textAlign: "right" }}>Cant × Monto</th>
              <th style={{ width: 110, textAlign: "right" }}>Subtotal</th>
              <th style={{ width: 150, textAlign: "right", paddingRight: 16 }} />
            </tr>
          </thead>
          <tbody>
            {draftItems.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "14px 16px", color: "var(--muted)", fontSize: 12 }}>
                  Sin items — agrega al menos uno antes de duplicar.
                </td>
              </tr>
            )}
            {draftItems.map((it, idx) => {
              const isEditing = editingItemId === it.id;
              return (
                <tr key={it.id} style={{ cursor: "default" }}>
                  <td className="mono" style={{ paddingLeft: 16 }}>{idx + 1}</td>
                  <td>
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={editForm.description}
                        onChange={(e) =>
                          onEditFormChange({ ...editForm, description: e.target.value })
                        }
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
                          onChange={(e) =>
                            onEditFormChange({ ...editForm, quantity: e.target.value })
                          }
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
                          onChange={(e) =>
                            onEditFormChange({ ...editForm, amount: e.target.value })
                          }
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
                        ? (parseFloat(editForm.amount) || 0) *
                            (parseFloat(editForm.quantity) || 0)
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
                          style={{ color: "var(--bad)", borderColor: "var(--bad-line)" }}
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
      </div>

      <div
        style={{
          marginTop: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          background: "var(--bg)",
          border: "1px solid var(--line)",
          borderRadius: 8,
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          Total estimado
        </div>
        <div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>
          {fmt.money(total)}
        </div>
      </div>
    </div>
  );
}

interface AddItemsModalProps {
  onAdd: (item: DraftItem) => void;
  onClose: () => void;
}

function AddItemsModal({ onAdd, onClose }: AddItemsModalProps) {
  const [form, setForm] = useState<ItemFormState>(EMPTY_ITEM_FORM);
  const [formError, setFormError] = useState("");

  const submitAndClose = () => {
    const description = form.description.trim();
    const amount = parseFloat(form.amount);
    const quantity = parseFloat(form.quantity);
    if (!description) {
      setFormError("Falta la descripción.");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setFormError("Monto inválido.");
      return;
    }
    if (isNaN(quantity) || quantity <= 0) {
      setFormError("Cantidad inválida.");
      return;
    }
    setFormError("");
    onAdd({ id: Date.now(), description, amount, quantity });
    onClose();
  };

  return (
    <ModalPortal>
      <div className="modal-bg" onClick={onClose} style={{ zIndex: 1000 }}>
        <div className="modal anim-in" onClick={(e) => e.stopPropagation()}>
          <div className="modal-pad">
            <div className="modal-head">
              <div>
                <h2 className="modal-title">Agregar item</h2>
                <div className="modal-sub">
                  Se agregará a la cotización duplicada.
                </div>
              </div>
              <button className="close-x" onClick={onClose} aria-label="Cerrar">
                <Icons.close size={18} />
              </button>
            </div>

            {formError && (
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
                {formError}
              </div>
            )}

            <div
              style={{
                padding: "14px 16px",
                border: "1px solid var(--line)",
                borderRadius: 8,
                background: "var(--bg)",
              }}
            >
              <div className="item-add-form">
                <div className="field item-desc" style={{ margin: 0 }}>
                  <label>Descripción</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Descripción del item…"
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>Monto ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>Cantidad</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button className="btn-ghost" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-accent" type="button" onClick={submitAndClose}>
              Agregar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
