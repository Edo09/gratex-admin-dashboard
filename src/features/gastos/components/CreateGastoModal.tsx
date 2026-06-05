import { useEffect, useState, type CSSProperties } from "react";
import { Icons } from "@/shared/components/press/PressIcons";
import { ModalPortal } from "@/shared/components/press/ModalPortal";
import { fmt } from "@/shared/utils/press-fmt";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useClientesQuery } from "@/features/clientes/hooks/useClientesQuery";
import { getClientDisplayName, type Cliente } from "@/features/clientes/types";
import { useCreateGasto } from "../hooks/useCreateGasto";
import {
  CATEGORIA_LABELS,
  CATEGORIA_TIPOS,
  TIPO_GASTO_LABELS,
  isTipoRecibido,
} from "../constants";
import type { CreateGastoPayload, GastoCategoria, TipoGasto } from "../types";

interface CreateGastoModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (message: string) => void;
}

interface ItemRow {
  id: number;
  description: string;
  quantity: number;
  amount: number;
  /** ITBIS rate (0 = exento, 0.16, 0.18). */
  rate: number;
}

const ITBIS_RATES: { label: string; value: number }[] = [
  { label: "Exento", value: 0 },
  { label: "16%", value: 0.16 },
  { label: "18%", value: 0.18 },
];

const todayISO = () => new Date().toISOString().slice(0, 10);
const round2 = (n: number) => Math.round(n * 100) / 100;
const lineItbis = (it: ItemRow) => round2(it.amount * it.quantity * it.rate);

export function CreateGastoModal({ open, onClose, onCreated }: CreateGastoModalProps) {
  const createGasto = useCreateGasto();

  const [categoria, setCategoria] = useState<GastoCategoria | null>(null);
  const [tipo, setTipo] = useState<TipoGasto>("E43");
  const [rncProveedor, setRncProveedor] = useState("");
  const [nombreProveedor, setNombreProveedor] = useState("");
  const [ncf, setNcf] = useState("");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [apiError, setApiError] = useState("");

  // Add-item form
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState("1");
  const [amount, setAmount] = useState("");

  const defaultRate = categoria === "facturas_proveedores" ? 0.18 : 0;
  const [rate, setRate] = useState(defaultRate);

  const resetItemForm = () => {
    setDesc("");
    setQty("1");
    setAmount("");
    setRate(defaultRate);
  };

  useEffect(() => {
    if (!open) return;
    setCategoria(null);
    setTipo("E43");
    setRncProveedor("");
    setNombreProveedor("");
    setNcf("");
    setItems([]);
    setApiError("");
    setDesc("");
    setQty("1");
    setAmount("");
    setRate(0);
  }, [open]);

  if (!open) return null;

  const subtotal = items.reduce((s, it) => s + it.amount * it.quantity, 0);
  const totalItbis = items.reduce((s, it) => s + lineItbis(it), 0);
  const total = subtotal + totalItbis;
  const recibido = isTipoRecibido(tipo);
  const proveedorRequerido = categoria === "facturas_proveedores";

  const pickCategoria = (cat: GastoCategoria) => {
    setCategoria(cat);
    setTipo(CATEGORIA_TIPOS[cat][0]);
    const r = cat === "facturas_proveedores" ? 0.18 : 0;
    setRate(r);
    setItems([]);
    setNcf("");
    setApiError("");
  };

  const backToCategoria = () => {
    setCategoria(null);
    setItems([]);
    setApiError("");
  };

  const selectProveedor = (c: Cliente) => {
    setRncProveedor(c.rnc ?? "");
    setNombreProveedor(getClientDisplayName(c));
  };

  const addItem = () => {
    const a = parseFloat(amount);
    const q = parseFloat(qty);
    if (!desc.trim() || isNaN(a) || a <= 0) return;
    const quantity = isNaN(q) || q <= 0 ? 1 : q;
    setItems((prev) => [...prev, { id: Date.now(), description: desc.trim(), quantity, amount: a, rate }]);
    resetItemForm();
  };

  const removeItem = (id: number) => setItems((prev) => prev.filter((it) => it.id !== id));

  const validate = (): string | null => {
    if (!categoria) return "Selecciona una categoría.";
    if (proveedorRequerido && !nombreProveedor.trim()) return "Ingresa el nombre del proveedor.";
    if (recibido && !ncf.trim()) return "Ingresa el NCF que entregó el proveedor.";
    if (items.length === 0) return "Agrega al menos un concepto.";
    return null;
  };

  const buildPayload = (): CreateGastoPayload => ({
    categoria: categoria as GastoCategoria,
    tipo_gasto: tipo,
    rnc_proveedor: rncProveedor.trim() || undefined,
    nombre_proveedor: nombreProveedor.trim(),
    ncf: recibido ? ncf.trim() : undefined,
    fecha: todayISO(),
    items: items.map((it) => ({
      description: it.description,
      quantity: it.quantity,
      amount: it.amount,
      itbis_amount: lineItbis(it) || undefined,
    })),
  });

  const submit = async () => {
    const invalid = validate();
    if (invalid) {
      setApiError(invalid);
      return;
    }
    setApiError("");
    try {
      const created = await createGasto.mutateAsync(buildPayload());
      onCreated(created?.aviso ? created.aviso : "Gasto registrado");
      onClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "No se pudo guardar el gasto.");
    }
  };

  return (
    <ModalPortal>
      <div className="modal-bg" onClick={() => !createGasto.isPending && onClose()}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-pad">
            <div className="modal-head">
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                {categoria && (
                  <button className="close-x" onClick={backToCategoria} aria-label="Volver" style={{ marginTop: 2 }}>
                    <Icons.chevronLeft size={18} />
                  </button>
                )}
                <div>
                  <h2 className="modal-title">Nuevo gasto</h2>
                  <div className="modal-sub">
                    {categoria ? CATEGORIA_LABELS[categoria] : "Selecciona el tipo de gasto"}
                  </div>
                </div>
              </div>
              <button className="close-x" onClick={onClose} aria-label="Cerrar">
                <Icons.close size={18} />
              </button>
            </div>

            {categoria === null ? (
              <CategoriaChooser onPick={pickCategoria} />
            ) : (
              <>
                <div className="field">
                  <label>Tipo de comprobante</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoGasto)}
                    style={selectStyle}
                  >
                    {CATEGORIA_TIPOS[categoria].map((t) => (
                      <option key={t} value={t}>
                        {t} · {TIPO_GASTO_LABELS[t].name} ({TIPO_GASTO_LABELS[t].ncfDgii})
                      </option>
                    ))}
                  </select>
                </div>

                <ProveedorPicker onSelect={selectProveedor} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 8 }}>
                  <div className="field">
                    <label>RNC / Cédula{proveedorRequerido ? "" : " (opcional)"}</label>
                    <input value={rncProveedor} onChange={(e) => setRncProveedor(e.target.value)} placeholder="131880681" />
                  </div>
                  <div className="field">
                    <label>Nombre del proveedor{proveedorRequerido ? "" : " (opcional)"}</label>
                    <input
                      value={nombreProveedor}
                      onChange={(e) => setNombreProveedor(e.target.value)}
                      placeholder="Suplidora XYZ SRL"
                    />
                  </div>
                </div>

                {recibido && (
                  <div className="field">
                    <label>NCF del proveedor</label>
                    <input value={ncf} onChange={(e) => setNcf(e.target.value)} placeholder="E310000000123" />
                  </div>
                )}

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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8 }}>
                      <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Cant." inputMode="decimal" />
                      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Precio" inputMode="decimal" />
                      <select value={rate} onChange={(e) => setRate(Number(e.target.value))} style={selectStyle}>
                        {ITBIS_RATES.map((r) => (
                          <option key={r.value} value={r.value}>
                            ITBIS {r.label}
                          </option>
                        ))}
                      </select>
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
                            {lineItbis(it) > 0 && ` · ITBIS ${fmt.money(lineItbis(it))}`}
                          </div>
                        </div>
                        <div className="mono" style={{ fontWeight: 600, fontSize: 13 }}>
                          {fmt.money(it.amount * it.quantity + lineItbis(it))}
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

          {categoria !== null && (
            <div className="modal-foot">
              <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
                Total: {fmt.money(total)}
              </div>
              <div className="modal-foot-spacer" />
              <button className="btn-ghost" onClick={onClose} disabled={createGasto.isPending}>
                Cancelar
              </button>
              <button className="btn btn-accent" onClick={submit} disabled={createGasto.isPending}>
                {createGasto.isPending ? "Guardando…" : "Crear gasto"}
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}

const selectStyle: CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid var(--line)",
  borderRadius: 6,
  background: "var(--surface)",
  color: "var(--ink)",
  font: "inherit",
  fontSize: 13,
  cursor: "pointer",
};

/* ------------------------------------------------------------------ */
/* Categoría chooser                                                   */
/* ------------------------------------------------------------------ */

function CategoriaChooser({ onPick }: { onPick: (cat: GastoCategoria) => void }) {
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
      <button type="button" onClick={() => onPick("gastos_menores")} style={cardStyle}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>Gastos Menores</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
          Pagos del personal (E43) — auto-emisión, sin NCF
        </div>
      </button>
      <button type="button" onClick={() => onPick("facturas_proveedores")} style={cardStyle}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>Facturas de Proveedores</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
          Compras (E41/E47) o recibidos (E31/B01/E33/E34)
        </div>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Proveedor picker — busca clientes y autollena RNC + nombre          */
/* ------------------------------------------------------------------ */

function ProveedorPicker({ onSelect }: { onSelect: (c: Cliente) => void }) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 350);
  const { data, isLoading } = useClientesQuery({
    query: debounced,
    enabled: debounced.trim().length > 0,
  });
  const matches = data?.items ?? [];

  return (
    <div className="field" style={{ position: "relative" }}>
      <label>Buscar proveedor registrado (opcional)</label>
      <input
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre, empresa o RNC…"
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
                  {c.company_name ?? ""} {c.rnc ? `· RNC ${c.rnc}` : ""}
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
