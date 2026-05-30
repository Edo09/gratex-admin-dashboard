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

interface ExtraItem {
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
  const [busy, setBusy] = useState<null | "preview" | "save">(null);
  const [extraItems, setExtraItems] = useState<ExtraItem[]>([]);
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
        if (!cancelled) setSelected(full ?? initialCotizacion);
      } catch (err) {
        if (!cancelled) {
          setApiError(extractErrorMessage(err) ?? "No se pudo cargar la cotización.");
          setSelected(initialCotizacion);
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
    setExtraItems([]);
    setAddItemsOpen(false);
  };

  const removeExtraItem = (id: number) =>
    setExtraItems((prev) => prev.filter((it) => it.id !== id));

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
      setSelected(full ?? c);
    } catch (err) {
      setApiError(extractErrorMessage(err) ?? "No se pudo cargar la cotización.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const buildPayload = () => {
    if (!selected) return null;
    let items = (selected.items ?? []).map((it) => {
      const amount = typeof it.amount === "string" ? parseFloat(it.amount) : Number(it.amount);
      const quantity = Number(it.quantity ?? 1);
      return {
        description: it.description,
        amount,
        quantity,
        subtotal: amount * quantity,
      };
    });
    if (items.length === 0 && selected.description) {
      const t = parseCotizacionAmount(selected);
      items = [{ description: selected.description, amount: t, quantity: 1, subtotal: t }];
    }
    const extras = extraItems.map((it) => ({
      description: it.description,
      amount: it.amount,
      quantity: it.quantity,
      subtotal: it.amount * it.quantity,
    }));
    items = [...items, ...extras];
    if (items.length === 0) return null;
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

  const duplicate = async () => {
    const payload = buildPayload();
    if (!payload) {
      setApiError("La cotización seleccionada no tiene items para duplicar.");
      return;
    }
    setApiError("");
    setBusy("save");
    try {
      const id = await saveMutation.mutateAsync({ editingId: null, payload });
      onCreated?.("Cotización duplicada");
      reset();
      onClose();
      if (id) await openSavedPdf(id);
    } catch (err) {
      setApiError(extractErrorMessage(err) ?? "No se pudo duplicar la cotización.");
    } finally {
      setBusy(null);
    }
  };

  const originalTotal = selected
    ? (selected.items ?? []).reduce((s, it) => {
        const a = typeof it.amount === "string" ? parseFloat(it.amount) : Number(it.amount);
        const q = Number(it.quantity ?? 1);
        return s + a * q;
      }, 0) || parseCotizacionAmount(selected)
    : 0;
  const extrasTotal = extraItems.reduce((s, it) => s + it.amount * it.quantity, 0);
  const selectedTotal = originalTotal + extrasTotal;

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
                extraItems={extraItems}
                onRemoveExtra={removeExtraItem}
                onClear={() => {
                  setSelected(null);
                  setExtraItems([]);
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
                  title="Agregar items adicionales antes de duplicar"
                >
                  <Icons.plus size={13} /> Agregar items
                  {extraItems.length > 0 ? ` (${extraItems.length})` : ""}
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
                  onClick={duplicate}
                  disabled={anyBusy}
                  type="button"
                >
                  {busy === "save" ? "Duplicando…" : "Duplicar con fecha de hoy"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {addItemsOpen && (
        <AddItemsModal
          existing={extraItems}
          onAdd={(it) => setExtraItems((prev) => [...prev, it])}
          onRemove={removeExtraItem}
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
  extraItems: ExtraItem[];
  onRemoveExtra: (id: number) => void;
  onClear: () => void;
}

function SelectedPreview({
  cotizacion,
  total,
  extraItems,
  onRemoveExtra,
  onClear,
}: SelectedPreviewProps) {
  const items = cotizacion.items ?? [];
  const originalCount = items.length;
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
              <th style={{ width: 40, paddingLeft: 16 }}>#</th>
              <th>Descripción</th>
              <th style={{ width: 140, textAlign: "right" }}>Cant × Monto</th>
              <th style={{ width: 110, textAlign: "right", paddingRight: 16 }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: "14px 16px", color: "var(--muted)", fontSize: 12 }}>
                  Sin items detallados — se duplicará la descripción y el total.
                </td>
              </tr>
            )}
            {items.map((it, idx) => {
              const amount = typeof it.amount === "string" ? parseFloat(it.amount) : Number(it.amount);
              const qty = Number(it.quantity ?? 1);
              return (
                <tr key={`o-${idx}`}>
                  <td className="mono" style={{ paddingLeft: 16 }}>{idx + 1}</td>
                  <td>{it.description}</td>
                  <td className="mono" style={{ textAlign: "right" }}>
                    {qty} × {fmt.money(amount)}
                  </td>
                  <td
                    className="mono"
                    style={{ textAlign: "right", paddingRight: 16, fontWeight: 600 }}
                  >
                    {fmt.money(amount * qty)}
                  </td>
                </tr>
              );
            })}
            {extraItems.map((it, idx) => (
              <tr key={`x-${it.id}`} style={{ background: "var(--warn-soft)" }}>
                <td className="mono" style={{ paddingLeft: 16 }}>{originalCount + idx + 1}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        padding: "2px 6px",
                        border: "1px solid #e6c878",
                        borderRadius: 4,
                        color: "#8a6a1c",
                      }}
                    >
                      Nuevo
                    </span>
                    <span>{it.description}</span>
                  </div>
                </td>
                <td className="mono" style={{ textAlign: "right" }}>
                  {it.quantity} × {fmt.money(it.amount)}
                </td>
                <td
                  className="mono"
                  style={{ textAlign: "right", paddingRight: 16, fontWeight: 600 }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    {fmt.money(it.amount * it.quantity)}
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => onRemoveExtra(it.id)}
                      style={{ padding: "2px 8px", fontSize: 11 }}
                    >
                      Quitar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
  existing: ExtraItem[];
  onAdd: (item: ExtraItem) => void;
  onRemove: (id: number) => void;
  onClose: () => void;
}

function AddItemsModal({ existing, onAdd, onRemove, onClose }: AddItemsModalProps) {
  const [form, setForm] = useState<ItemFormState>(EMPTY_ITEM_FORM);
  const [formError, setFormError] = useState("");

  const submit = () => {
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
    setForm(EMPTY_ITEM_FORM);
  };

  const runningTotal = existing.reduce((s, it) => s + it.amount * it.quantity, 0);

  return (
    <ModalPortal>
      <div className="modal-bg" onClick={onClose} style={{ zIndex: 1000 }}>
        <div className="modal anim-in" onClick={(e) => e.stopPropagation()}>
          <div className="modal-pad">
            <div className="modal-head">
              <div>
                <h2 className="modal-title">Agregar items</h2>
                <div className="modal-sub">
                  Items adicionales que se agregarán a la cotización duplicada.
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
                Nuevo item
              </div>
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
                <button
                  type="button"
                  className="btn btn-accent item-add-btn"
                  onClick={submit}
                  style={{ height: 36 }}
                >
                  Agregar
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
              {existing.length === 0 ? (
                <div
                  style={{
                    padding: "18px 16px",
                    textAlign: "center",
                    color: "var(--muted)",
                    fontSize: 13,
                  }}
                >
                  No has agregado items adicionales.
                </div>
              ) : (
                <table className="ds-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 40, paddingLeft: 16 }}>#</th>
                      <th>Descripción</th>
                      <th style={{ width: 140, textAlign: "right" }}>Cant. × Monto</th>
                      <th style={{ width: 110, textAlign: "right" }}>Subtotal</th>
                      <th style={{ width: 90, paddingRight: 16 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {existing.map((it, idx) => (
                      <tr key={it.id}>
                        <td className="mono" style={{ paddingLeft: 16 }}>{idx + 1}</td>
                        <td>{it.description}</td>
                        <td className="mono" style={{ textAlign: "right" }}>
                          {it.quantity} × {fmt.money(it.amount)}
                        </td>
                        <td
                          className="mono"
                          style={{ textAlign: "right", fontWeight: 600 }}
                        >
                          {fmt.money(it.amount * it.quantity)}
                        </td>
                        <td style={{ textAlign: "right", paddingRight: 16 }}>
                          <button
                            type="button"
                            className="btn-ghost"
                            style={{ color: "var(--bad)", borderColor: "var(--bad-line)" }}
                            onClick={() => onRemove(it.id)}
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

            {existing.length > 0 && (
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
                  Subtotal items nuevos
                </div>
                <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>
                  {fmt.money(runningTotal)}
                </div>
              </div>
            )}
          </div>
          <div className="modal-foot">
            <button className="btn btn-blue" type="button" onClick={onClose}>
              Listo
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
