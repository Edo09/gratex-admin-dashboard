import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Icons } from "@/shared/components/press/PressIcons";
import { ModalPortal } from "@/shared/components/press/ModalPortal";
import { extractErrorMessage } from "@/shared/api/errors";
import { fmt } from "@/shared/utils/press-fmt";
import { formatDisplayDate, getTodayDate } from "@/shared/utils/format";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useClientesQuery } from "@/features/clientes/hooks/useClientesQuery";
import {
  getClientDisplayName,
  getClientPhone,
  type Cliente,
} from "@/features/clientes/types";
import { useFacturasStatsQuery } from "../hooks/useFacturasQuery";
import { fetchCotizacionById, useCotizacionesQuery } from "@/features/cotizaciones/hooks/useCotizacionesQuery";
import type { Cotizacion } from "@/features/cotizaciones/types";
import type {
  TipoEcf,
  TipoPago,
  IndicadorFacturacion,
  IndicadorBienServicio,
  CodigoModificacion,
} from "../constants";
import {
  ECF_TYPES,
  TIPO_PAGO_LABELS,
  INDICADOR_FACTURACION_LABELS,
  BIEN_SERVICIO_LABELS,
  CODIGO_MODIFICACION_LABELS,
  ecfRequiresComprador,
  ecfRequiresCliente,
  ecfRequiresReferencia,
  ecfRequiresRetencion,
  ecfRequiresTotales,
  ecfRequiresTipoIngresos,
  ecfAllowedIndicadores,
  ecfForcedBienServicio,
} from "../constants";
import type {
  ItemDraft,
  Comprador,
  InformacionReferencia,
  CreateFacturaPayload,
  FacturaItemPayload,
} from "../types";
import { toEcfDate, calculateItbisBreakdown, buildTotales } from "../utils";
import { useCreateFactura } from "../hooks/useCreateFactura";
import { useFacturaPdf } from "../hooks/useFacturaPdf";
import { EcfTypeSelector } from "./EcfTypeSelector";

interface CreateFacturaModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (message: string) => void;
}

type Flow = "client" | "cotizacion" | null;
type Step = "flow" | "ecf-type" | "form";

interface ItemFormState {
  nombre_item: string;
  precio_unitario: string;
  cantidad: string;
  indicador_facturacion: IndicadorFacturacion;
  indicador_bien_servicio: IndicadorBienServicio;
}

const EMPTY_ITEM_FORM: ItemFormState = {
  nombre_item: "",
  precio_unitario: "",
  cantidad: "1",
  indicador_facturacion: 1,
  indicador_bien_servicio: 2,
};

export function CreateFacturaModal({ open, onClose, onCreated }: CreateFacturaModalProps) {
  const { user } = useAuth();
  const createMutation = useCreateFactura();
  const { data: stats } = useFacturasStatsQuery();
  const computeNextEncf = useCallback(
    (tipo: TipoEcf): string => {
      const code = `E${tipo}`;
      const seq = stats?.secuencias?.find((s) => s.type === code);
      if (!seq) return "";
      const next = seq.secuencia_actual + 1;
      return `${seq.type}${String(next).padStart(10, "0")}`;
    },
    [stats],
  );
  const { openSavedPdf, previewDraft } = useFacturaPdf();

  const [step, setStep] = useState<Step>("flow");
  const [flow, setFlow] = useState<Flow>(null);
  const [tipoEcf, setTipoEcf] = useState<TipoEcf>("31");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [date, setDate] = useState<string>(getTodayDate());
  const [tipoPago, setTipoPago] = useState<TipoPago>(1);
  const [ncf, setNcf] = useState<string>("");
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [itemForm, setItemForm] = useState<ItemFormState>(EMPTY_ITEM_FORM);
  const [comprador, setComprador] = useState<Comprador>({ rnc: "", razon_social: "" });
  const [referencia, setReferencia] = useState<InformacionReferencia>({
    ncf_modificado: "",
    rnc_otro_contribuyente: null,
    fecha_ncf_modificado: getTodayDate(),
    codigo_modificacion: "3",
    razon_modificacion: "",
  });
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState<null | "preview" | "save">(null);
  const [payloadPreview, setPayloadPreview] = useState<string | null>(null);
  const showDebugPayload = import.meta.env.VITE_SHOW_DEBUG_PAYLOAD === "true";

  const handleShowPayload = () => {
    try {
      const payload = buildPayload();
      setPayloadPreview(JSON.stringify(payload, null, 2));
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "No se pudo construir el payload.");
    }
  };

  const handleCopyPayload = async () => {
    if (!payloadPreview) return;
    try {
      await navigator.clipboard.writeText(payloadPreview);
    } catch {
      /* ignore clipboard failures */
    }
  };
  const [errorFlash, setErrorFlash] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const showError = useCallback((msg: string) => {
    setApiError(msg);
    setErrorFlash(true);
    setTimeout(() => setErrorFlash(false), 600);
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 30);
  }, []);

  const breakdown = useMemo(() => calculateItbisBreakdown(items), [items]);
  const needsComprador = ecfRequiresComprador(tipoEcf);
  const requiresCliente = ecfRequiresCliente(tipoEcf);
  const needsReferencia = ecfRequiresReferencia(tipoEcf);
  const needsRetencion = ecfRequiresRetencion(tipoEcf);
  const allowedIndicadores = ecfAllowedIndicadores(tipoEcf);
  const forcedBienServicio = ecfForcedBienServicio(tipoEcf);

  // Recompute next e-NCF whenever tipo changes (or stats first load).
  useEffect(() => {
    const next = computeNextEncf(tipoEcf);
    if (next) setNcf(next);
  }, [tipoEcf, computeNextEncf]);

  const reset = () => {
    setStep("flow");
    setFlow(null);
    setTipoEcf("31");
    setSelectedCliente(null);
    setSelectedCotizacion(null);
    setDate(getTodayDate());
    setTipoPago(1);
    setNcf("");
    setItems([]);
    setItemForm(EMPTY_ITEM_FORM);
    setComprador({ rnc: "", razon_social: "" });
    setReferencia({
      ncf_modificado: "",
      rnc_otro_contribuyente: null,
      fecha_ncf_modificado: getTodayDate(),
      codigo_modificacion: "3",
      razon_modificacion: "",
    });
    setApiError("");
    setPayloadPreview(null);
  };

  if (!open) return null;

  const close = () => {
    if (createMutation.isPending || busy) return;
    reset();
    onClose();
  };

  const resetFlowData = () => {
    setSelectedCliente(null);
    setSelectedCotizacion(null);
    setItems([]);
    setItemForm(EMPTY_ITEM_FORM);
    setComprador({ rnc: "", razon_social: "" });
    setDate(getTodayDate());
    setTipoPago(1);
    setReferencia({
      ncf_modificado: "",
      rnc_otro_contribuyente: null,
      fecha_ncf_modificado: getTodayDate(),
      codigo_modificacion: "3",
      razon_modificacion: "",
    });
    setApiError("");
  };

  const handleFlowPick = (f: Flow) => {
    resetFlowData();
    setFlow(f);
    setStep("ecf-type");
  };

  const handleEcfTypeConfirm = () => {
    if (allowedIndicadores.length === 1) {
      setItemForm((prev) => ({ ...prev, indicador_facturacion: allowedIndicadores[0] }));
    }
    if (forcedBienServicio) {
      setItemForm((prev) => ({ ...prev, indicador_bien_servicio: forcedBienServicio }));
    }
    setStep("form");
  };

  const handleBack = () => {
    if (step === "form") {
      setStep("ecf-type");
    } else if (step === "ecf-type") {
      setStep("flow");
      setFlow(null);
      resetFlowData();
    }
  };

  const addItem = () => {
    const nombre = itemForm.nombre_item.trim();
    const precio = parseFloat(itemForm.precio_unitario);
    const cantidad = parseFloat(itemForm.cantidad);
    if (!nombre || isNaN(precio) || isNaN(cantidad) || precio <= 0 || cantidad <= 0) return;
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        nombre_item: nombre,
        precio_unitario: precio,
        cantidad,
        indicador_facturacion: itemForm.indicador_facturacion,
        indicador_bien_servicio: forcedBienServicio ?? itemForm.indicador_bien_servicio,
        unidad_medida: "43",
      },
    ]);
    setItemForm({
      ...EMPTY_ITEM_FORM,
      indicador_facturacion: allowedIndicadores.length === 1 ? allowedIndicadores[0] : itemForm.indicador_facturacion,
      indicador_bien_servicio: forcedBienServicio ?? EMPTY_ITEM_FORM.indicador_bien_servicio,
    });
  };

  const removeItem = (id: number) => setItems((prev) => prev.filter((it) => it.id !== id));

  const handleClientSelect = async (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setApiError("");
    if (needsComprador && cliente.rnc) {
      setComprador({ rnc: cliente.rnc, razon_social: getClientDisplayName(cliente) });
    }
    if (!ncf) {
      const next = computeNextEncf(tipoEcf);
      if (next) setNcf(next);
    }
  };

  const handleCotizacionSelect = async (cot: Cotizacion) => {
    setApiError("");
    let full: Cotizacion | null = cot;
    try {
      const fetched = await fetchCotizacionById(cot.id);
      if (fetched) full = fetched;
    } catch { /* best-effort */ }
    setSelectedCotizacion(full);
    // Factura siempre se emite con la fecha actual, no la de la cotización.
    setDate(getTodayDate());

    const cotItems = Array.isArray(full?.items) ? full.items : [];
    if (cotItems.length > 0) {
      setItems(
        cotItems.map((it, idx) => ({
          id: Date.now() + idx,
          nombre_item: it.description,
          precio_unitario: typeof it.amount === "string" ? parseFloat(it.amount) : Number(it.amount),
          cantidad: Number(it.quantity ?? 1),
          indicador_facturacion: allowedIndicadores[0] ?? 1,
          indicador_bien_servicio: forcedBienServicio ?? (2 as IndicadorBienServicio),
          unidad_medida: "43",
        })),
      );
    } else if (full?.description) {
      const t = typeof full.total === "string" ? parseFloat(full.total) : Number(full.total ?? 0);
      setItems([{
        id: Date.now(),
        nombre_item: full.description,
        precio_unitario: isNaN(t) ? 0 : t,
        cantidad: 1,
        indicador_facturacion: allowedIndicadores[0] ?? 1,
        indicador_bien_servicio: forcedBienServicio ?? (2 as IndicadorBienServicio),
        unidad_medida: "43",
      }]);
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

    if (needsComprador && full?.rnc) {
      setComprador({ rnc: full.rnc, razon_social: full.client_name ?? "" });
    }

    if (!ncf) {
      const next = computeNextEncf(tipoEcf);
      if (next) setNcf(next);
    }
  };

  const buildPayload = (): CreateFacturaPayload => {
    const payload: CreateFacturaPayload = {
      user_id: user?.id,
      tipo_ecf: tipoEcf,
      fecha_emision: toEcfDate(date),
      tipo_pago: tipoPago,
      indicador_monto_gravado: "0",
      items: items.map((it, idx): FacturaItemPayload => {
        const item: FacturaItemPayload = {
          numero_linea: idx + 1,
          indicador_facturacion: it.indicador_facturacion,
          nombre_item: it.nombre_item,
          indicador_bien_servicio: it.indicador_bien_servicio,
          cantidad: it.cantidad,
          unidad_medida: it.unidad_medida,
          precio_unitario: it.precio_unitario,
        };
        if (needsRetencion) {
          item.indicador_agente_retencion_percepcion = "1";
          if (it.monto_itbis_retenido != null) item.monto_itbis_retenido = it.monto_itbis_retenido;
          if (it.monto_isr_retenido != null) item.monto_isr_retenido = it.monto_isr_retenido;
        }
        return item;
      }),
    };

    // Client is optional for E32/E43, required for the rest — but always send
    // it when one is selected.
    if (selectedCliente?.id) {
      payload.client_id = selectedCliente.id;
    }

    if (ecfRequiresTipoIngresos(tipoEcf)) {
      payload.tipo_ingresos = "01";
    }

    if (needsComprador) {
      payload.comprador = comprador;
    }

    if (needsReferencia) {
      payload.informacion_referencia = {
        ...referencia,
        fecha_ncf_modificado: toEcfDate(referencia.fecha_ncf_modificado),
      };
      if (tipoEcf === "34") {
        payload.indicador_nota_credito = "0";
      }
    }

    if (ecfRequiresTotales(tipoEcf)) {
      payload.totales = buildTotales(items);
    }

    return payload;
  };

  const requireValid = (): string | null => {
    if (requiresCliente && !selectedCliente?.id) return "Selecciona un cliente";
    if (items.length === 0) return "Agrega al menos un item";
    if (needsComprador && !comprador.rnc?.trim()) return "RNC del comprador es requerido para E31";
    if (needsComprador && !comprador.razon_social.trim()) return "Nombre del comprador es requerido para E31";
    if (needsReferencia && !referencia.ncf_modificado.trim()) return "NCF modificado es requerido";
    if (needsReferencia && !referencia.razon_modificacion.trim()) return "Razón de modificación es requerida";
    return null;
  };

  const handlePreview = async () => {
    const invalid = requireValid();
    if (invalid) { showError(invalid); return; }
    setApiError("");
    setBusy("preview");
    try {
      await previewDraft({
        client_id: selectedCliente?.id,
        items: items.map((it, idx) => ({
          numero_linea: idx + 1,
          indicador_facturacion: it.indicador_facturacion,
          nombre_item: it.nombre_item,
          indicador_bien_servicio: it.indicador_bien_servicio,
          cantidad: it.cantidad,
          unidad_medida: it.unidad_medida,
          precio_unitario: it.precio_unitario,
        })),
        ncf,
        date,
        tipo_ecf: tipoEcf,
      });
    } catch (err) {
      showError(extractErrorMessage(err) ?? "No se pudo generar el preview.");
    } finally {
      setBusy(null);
    }
  };

  const handleSave = async () => {
    const invalid = requireValid();
    if (invalid) { showError(invalid); return; }
    setApiError("");
    setBusy("save");
    try {
      const response = await createMutation.mutateAsync(buildPayload());
      onCreated?.("Factura emitida");
      const id = response?.id;
      reset();
      onClose();
      if (id) await openSavedPdf(id);
    } catch (err) {
      showError(extractErrorMessage(err) ?? "No se pudo guardar la factura.");
    } finally {
      setBusy(null);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleSave();
  };

  const anyBusy = busy != null || createMutation.isPending;
  const wide = step === "form" || step === "ecf-type";

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
                  {step === "flow" && "Elige cómo crear la factura."}
                  {step === "ecf-type" && "Selecciona el tipo de comprobante electrónico."}
                  {step === "form" && (
                    <>
                      <span
                        className="mono"
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: "var(--c-accent, #3b82f6)",
                          color: "#fff",
                          padding: "2px 6px",
                          borderRadius: 4,
                          marginRight: 6,
                        }}
                      >
                        E{tipoEcf}
                      </span>
                      {ECF_TYPES[tipoEcf].short}
                      {" · "}
                      {flow === "client" ? "desde cliente" : "desde cotización"}
                    </>
                  )}
                </div>
              </div>
              <button className="close-x" onClick={close} aria-label="Cerrar">
                <Icons.close size={18} />
              </button>
            </div>

            {apiError && (
              <div
                ref={errorRef}
                className="field-error"
                style={{
                  background: "var(--bad-soft)",
                  border: "1px solid var(--bad-line)",
                  padding: "8px 10px",
                  borderRadius: 6,
                  marginBottom: 14,
                  animation: errorFlash ? "error-shake 0.4s ease" : undefined,
                }}
              >
                {apiError}
              </div>
            )}

            {step === "flow" && <FlowChooser onPick={handleFlowPick} />}
            {step === "ecf-type" && (
              <EcfTypeSelector value={tipoEcf} onChange={setTipoEcf} />
            )}

            {step === "form" && flow === "client" && (
              <form onSubmit={onSubmit}>
                <ClientePicker
                  selected={selectedCliente}
                  onSelect={handleClientSelect}
                  onClear={() => { setSelectedCliente(null); setComprador({ rnc: "", razon_social: "" }); }}
                />
                {!requiresCliente && !selectedCliente && (
                  <div
                    className="mono"
                    style={{ fontSize: 11, color: "var(--muted)", marginTop: -8, marginBottom: 14 }}
                  >
                    Cliente opcional para {ECF_TYPES[tipoEcf].short} (E{tipoEcf}).
                  </div>
                )}
                {needsComprador && (
                  <CompradorFields comprador={comprador} onChange={setComprador} />
                )}
                <FormFields
                  ncf={ncf} onNcfChange={setNcf}
                  tipoPago={tipoPago} onTipoPagoChange={setTipoPago}
                  breakdown={breakdown}
                />
                {needsReferencia && (
                  <ReferenciaFields referencia={referencia} onChange={setReferencia} />
                )}
                <ItemsSection
                  itemForm={itemForm}
                  onItemFormChange={setItemForm}
                  onAddItem={addItem}
                  items={items}
                  onRemoveItem={removeItem}
                  allowedIndicadores={allowedIndicadores}
                  forcedBienServicio={forcedBienServicio}
                />
              </form>
            )}

            {step === "form" && flow === "cotizacion" && (
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
                        setComprador({ rnc: "", razon_social: "" });
                      }}
                    />
                    {needsComprador && (
                      <CompradorFields comprador={comprador} onChange={setComprador} />
                    )}
                    <FormFields
                      ncf={ncf} onNcfChange={setNcf}
                      tipoPago={tipoPago} onTipoPagoChange={setTipoPago}
                      breakdown={breakdown}
                    />
                    {needsReferencia && (
                      <ReferenciaFields referencia={referencia} onChange={setReferencia} />
                    )}
                    <ItemsSection
                      itemForm={itemForm}
                      onItemFormChange={setItemForm}
                      onAddItem={addItem}
                      items={items}
                      onRemoveItem={removeItem}
                      allowedIndicadores={allowedIndicadores}
                      forcedBienServicio={forcedBienServicio}
                    />
                  </form>
                )}
              </>
            )}

            {step === "form" && payloadPreview && (
              <div
                style={{
                  marginTop: 16,
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  background: "#0b1020",
                  color: "#d8e1ff",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "8px 12px",
                    background: "#161b30",
                    borderBottom: "1px solid #232943",
                  }}
                >
                  <div
                    className="mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "#8fa1d6",
                    }}
                  >
                    Payload (debug) — POST /api/facturas
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={handleCopyPayload}
                      style={{
                        color: "#d8e1ff",
                        borderColor: "#232943",
                        background: "transparent",
                      }}
                    >
                      Copiar
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setPayloadPreview(null)}
                      style={{
                        color: "#d8e1ff",
                        borderColor: "#232943",
                        background: "transparent",
                      }}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
                <pre
                  className="mono"
                  style={{
                    margin: 0,
                    padding: "12px 14px",
                    fontSize: 11,
                    lineHeight: 1.5,
                    maxHeight: 360,
                    overflow: "auto",
                    whiteSpace: "pre",
                  }}
                >
                  {payloadPreview}
                </pre>
              </div>
            )}
          </div>

          {step === "ecf-type" && (
            <div className="modal-foot">
              <button type="button" className="btn-ghost" onClick={handleBack}>
                ← Volver
              </button>
              <div className="modal-foot-spacer" />
              <button type="button" className="btn-ghost" onClick={close}>
                Cancelar
              </button>
              <button type="button" className="btn btn-accent" onClick={handleEcfTypeConfirm}>
                Continuar →
              </button>
            </div>
          )}

          {step === "form" && (
            <div className="modal-foot">
              <button type="button" className="btn-ghost" onClick={handleBack} disabled={anyBusy}>
                ← Volver
              </button>
              <div className="modal-foot-spacer" />
              <button type="button" className="btn-ghost" onClick={close} disabled={anyBusy}>
                Cancelar
              </button>
              {showDebugPayload && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={handleShowPayload}
                  disabled={anyBusy}
                  title="Mostrar el JSON que se enviará al API sin emitir"
                >
                  Ver payload
                </button>
              )}
              <button
                type="button"
                className="btn btn-gray"
                onClick={handlePreview}
                disabled={anyBusy}
                style={errorFlash ? { borderColor: "var(--bad, #ef4444)", boxShadow: "0 0 0 2px rgba(239,68,68,0.25)" } : undefined}
              >
                {busy === "preview" ? "Generando…" : "Ver Preview"}
              </button>
              <button
                type="button"
                className="btn btn-green"
                onClick={handleSave}
                disabled={anyBusy}
                style={errorFlash ? { borderColor: "var(--bad, #ef4444)", boxShadow: "0 0 0 2px rgba(239,68,68,0.25)" } : undefined}
              >
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
    <div className="flow-grid">
      <button
        type="button"
        onClick={() => onPick("client")}
        style={{
          textAlign: "left",
          background: "var(--surface)",
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
          background: "var(--surface)",
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
            {selected.rnc && (
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                RNC: {selected.rnc}
              </div>
            )}
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
                  {c.company_name ?? ""} {c.email ? `· ${c.email}` : ""} {c.rnc ? `· RNC ${c.rnc}` : ""}
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Comprador fields (E31)                                              */
/* ------------------------------------------------------------------ */

function CompradorFields({
  comprador,
  onChange,
}: {
  comprador: Comprador;
  onChange: (c: Comprador) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
      <div className="field" style={{ margin: 0 }}>
        <label>RNC Comprador *</label>
        <input
          value={comprador.rnc ?? ""}
          onChange={(e) => onChange({ ...comprador, rnc: e.target.value })}
          placeholder="131880681"
        />
      </div>
      <div className="field" style={{ margin: 0 }}>
        <label>Nombre Comprador *</label>
        <input
          value={comprador.razon_social}
          onChange={(e) => onChange({ ...comprador, razon_social: e.target.value })}
          placeholder="EMPRESA SRL"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Referencia fields (E33, E34)                                        */
/* ------------------------------------------------------------------ */

function ReferenciaFields({
  referencia,
  onChange,
}: {
  referencia: InformacionReferencia;
  onChange: (r: InformacionReferencia) => void;
}) {
  return (
    <div
      style={{
        marginTop: 14,
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
        Información de referencia
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field" style={{ margin: 0 }}>
          <label>NCF modificado *</label>
          <input
            value={referencia.ncf_modificado}
            onChange={(e) => onChange({ ...referencia, ncf_modificado: e.target.value })}
            placeholder="E310000000321"
          />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Fecha NCF modificado</label>
          <input
            type="date"
            value={referencia.fecha_ncf_modificado}
            onChange={(e) => onChange({ ...referencia, fecha_ncf_modificado: e.target.value })}
          />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Código modificación</label>
          <select
            value={referencia.codigo_modificacion}
            onChange={(e) => onChange({ ...referencia, codigo_modificacion: e.target.value as CodigoModificacion })}
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid var(--line)",
              borderRadius: 6,
              font: "inherit",
              fontSize: 13,
              background: "var(--surface)",
            }}
          >
            {(Object.entries(CODIGO_MODIFICACION_LABELS) as [CodigoModificacion, string][]).map(([code, label]) => (
              <option key={code} value={code}>{code} — {label}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Razón modificación *</label>
          <input
            value={referencia.razon_modificacion}
            onChange={(e) => onChange({ ...referencia, razon_modificacion: e.target.value })}
            placeholder="Nota de crédito por ajuste"
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form fields: date, NCF, tipo pago, totals                          */
/* ------------------------------------------------------------------ */

interface ItbisBreakdown {
  subtotal: number;
  itbis18: number;
  itbis16: number;
  totalItbis: number;
  total: number;
}

function FormFields({
  ncf,
  onNcfChange,
  tipoPago,
  onTipoPagoChange,
  breakdown,
}: {
  ncf: string;
  onNcfChange: (v: string) => void;
  tipoPago: TipoPago;
  onTipoPagoChange: (v: TipoPago) => void;
  breakdown: ItbisBreakdown;
}) {
  return (
    <>
      <div className="date-ncf-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="field" style={{ margin: 0 }}>
          <label>NCF</label>
          <input value={ncf} onChange={(e) => onNcfChange(e.target.value)} placeholder="E31…" />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Tipo de pago</label>
          <select
            value={tipoPago}
            onChange={(e) => onTipoPagoChange(Number(e.target.value) as TipoPago)}
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid var(--line)",
              borderRadius: 6,
              font: "inherit",
              fontSize: 13,
              background: "var(--surface)",
            }}
          >
            {(Object.entries(TIPO_PAGO_LABELS) as [string, string][]).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          padding: "10px 14px",
          border: "1px solid var(--line)",
          borderRadius: 8,
          background: "var(--bg)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
        }}
      >
        <div>
          <div className="mono" style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em" }}>
            SUBTOTAL
          </div>
          <div className="mono" style={{ fontSize: 14, fontWeight: 500 }}>
            {fmt.money(breakdown.subtotal)}
          </div>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em" }}>
            ITBIS
          </div>
          <div className="mono" style={{ fontSize: 14, fontWeight: 500 }}>
            {fmt.money(breakdown.totalItbis)}
          </div>
          {breakdown.itbis18 > 0 && breakdown.itbis16 > 0 && (
            <div className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
              18%: {fmt.money(breakdown.itbis18)} · 16%: {fmt.money(breakdown.itbis16)}
            </div>
          )}
        </div>
        <div>
          <div className="mono" style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em" }}>
            TOTAL
          </div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>
            {fmt.money(breakdown.total)}
          </div>
        </div>
      </div>
    </>
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
  allowedIndicadores: IndicadorFacturacion[];
  forcedBienServicio: IndicadorBienServicio | null;
}

function ItemsSection({
  itemForm,
  onItemFormChange,
  onAddItem,
  items,
  onRemoveItem,
  allowedIndicadores,
  forcedBienServicio,
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

        <div className="item-add-form">
          <div className="field item-desc" style={{ margin: 0 }}>
            <label>Descripción</label>
            <textarea
              rows={2}
              value={itemForm.nombre_item}
              onChange={(e) => onItemFormChange({ ...itemForm, nombre_item: e.target.value })}
              placeholder="Descripción del item…"
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Precio ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={itemForm.precio_unitario}
              onChange={(e) => onItemFormChange({ ...itemForm, precio_unitario: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Cantidad</label>
            <input
              type="number"
              step="1"
              min="1"
              value={itemForm.cantidad}
              onChange={(e) => onItemFormChange({ ...itemForm, cantidad: e.target.value })}
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>ITBIS</label>
            <select
              value={itemForm.indicador_facturacion}
              onChange={(e) => onItemFormChange({ ...itemForm, indicador_facturacion: Number(e.target.value) as IndicadorFacturacion })}
              disabled={allowedIndicadores.length === 1}
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid var(--line)",
                borderRadius: 6,
                font: "inherit",
                fontSize: 12,
                background: "var(--surface)",
              }}
            >
              {allowedIndicadores.map((ind) => (
                <option key={ind} value={ind}>{INDICADOR_FACTURACION_LABELS[ind]}</option>
              ))}
            </select>
          </div>
          {!forcedBienServicio && (
            <div className="field" style={{ margin: 0 }}>
              <label>Tipo</label>
              <div
                className="seg"
                role="tablist"
                style={{ height: 36, display: "inline-flex" }}
              >
                {([1, 2] as IndicadorBienServicio[]).map((ind) => {
                  const active = itemForm.indicador_bien_servicio === ind;
                  // Bien = green, Servicio = blue
                  const activeBg = ind === 1 ? "#16a34a" : "#2563eb";
                  return (
                    <button
                      key={ind}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={active ? "active" : ""}
                      onClick={() =>
                        onItemFormChange({ ...itemForm, indicador_bien_servicio: ind })
                      }
                      style={
                        active
                          ? { flex: 1, background: activeBg, color: "#fff" }
                          : { flex: 1 }
                      }
                    >
                      {BIEN_SERVICIO_LABELS[ind]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <button
            type="button"
            className="btn btn-accent item-add-btn"
            onClick={onAddItem}
            style={{
              height: 36,
              minWidth: 120,
              alignSelf: "end",
              justifyContent: "center",
            }}
          >
            <Icons.plus size={13} sw={2} /> Agregar
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12, border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
        {items.length === 0 ? (
          <div style={{ padding: "18px 16px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            No hay items agregados
          </div>
        ) : (
          <div className="items-table-wrap">
            <table className="ds-table" style={{ margin: 0, minWidth: 580 }}>
              <thead>
                <tr>
                  <th style={{ width: 36, paddingLeft: 16 }}>#</th>
                  <th>Descripción</th>
                  <th style={{ width: 90 }}>ITBIS</th>
                  <th style={{ width: 70 }}>Tipo</th>
                  <th style={{ width: 130, textAlign: "right" }}>Cant × Precio</th>
                  <th style={{ width: 100, textAlign: "right" }}>Subtotal</th>
                  <th style={{ width: 80, textAlign: "right", paddingRight: 16 }} />
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={it.id} style={{ cursor: "default" }}>
                    <td className="mono" style={{ paddingLeft: 16 }}>{idx + 1}</td>
                    <td>
                      <div style={{ whiteSpace: "pre-line", maxWidth: 280 }}>{it.nombre_item}</div>
                    </td>
                    <td className="mono" style={{ fontSize: 10 }}>
                      {INDICADOR_FACTURACION_LABELS[it.indicador_facturacion]}
                    </td>
                    <td className="mono" style={{ fontSize: 10 }}>
                      {BIEN_SERVICIO_LABELS[it.indicador_bien_servicio]}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {it.cantidad} × {fmt.money(it.precio_unitario)}
                    </td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>
                      {fmt.money(it.precio_unitario * it.cantidad)}
                    </td>
                    <td style={{ textAlign: "right", paddingRight: 16 }}>
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ color: "var(--bad)", borderColor: "var(--bad-line)" }}
                        onClick={() => onRemoveItem(it.id)}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
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
      <div className="search" style={{ maxWidth: "none" }}>
        <span className="search-icon">
          <Icons.search size={14} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Código, cliente o descripción…"
        />
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
