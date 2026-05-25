import { useRef, useState, type FormEvent } from "react";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { PageMarks } from "@/shared/components/press/PageMarks";
import { Pill } from "@/shared/components/press/Pill";
import { Icons } from "@/shared/components/press/PressIcons";
import { API_BASE_URL } from "@/shared/api/client";
import {
  useCarouselItemsQuery,
  useCreateCarouselItem,
  useCreateServiceItem,
  useDeleteLandingItem,
  useServiceItemsQuery,
} from "../hooks/useLandingItems";
import type { LandingTab } from "../types";

const CMYK = ["var(--c-cyan)", "var(--c-magenta)", "var(--c-yellow)", "var(--c-key)"];

export default function Configuracion() {
  const [tab, setTab] = useState<LandingTab>("carousel");

  return (
    <div className="content">
      <PageMeta title="Configuración landing · Gratex" description="Carrusel y servicios" />
      <PageMarks label="CONFIG / 06" />
      <div className="page-head">
        <div>
          <h1 className="page-title">Configuración landing</h1>
          <div className="page-sub">Carrusel y servicios del sitio público</div>
        </div>
        <div className="seg">
          <button className={tab === "carousel" ? "active" : ""} onClick={() => setTab("carousel")}>
            Carrusel
          </button>
          <button className={tab === "services" ? "active" : ""} onClick={() => setTab("services")}>
            Servicios
          </button>
        </div>
      </div>

      {tab === "carousel" ? <CarouselTab /> : <ServicesTab />}
    </div>
  );
}

interface CarouselForm {
  title: string;
  subtitle: string;
  image: File | null;
}

const EMPTY_CAROUSEL: CarouselForm = { title: "", subtitle: "", image: null };

function CarouselTab() {
  const { data: slides = [], isLoading } = useCarouselItemsQuery();
  const createMutation = useCreateCarouselItem();
  const deleteMutation = useDeleteLandingItem("carousel");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CarouselForm>(EMPTY_CAROUSEL);
  const [errors, setErrors] = useState<{ title?: string; subtitle?: string; image?: string }>({});
  const [toast, setToast] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!form.title.trim()) next.title = "Título obligatorio";
    if (!form.subtitle.trim()) next.subtitle = "Subtítulo obligatorio";
    if (!form.image) next.image = "Imagen obligatoria";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const result = await createMutation.mutateAsync({
      title: form.title,
      subtitle: form.subtitle,
      image: form.image!,
    });
    if (result.success) {
      setForm(EMPTY_CAROUSEL);
      setToast("Slide agregado a la cola");
      window.setTimeout(() => setToast(""), 2200);
    } else {
      setToast(`Error: ${result.error ?? "no se pudo agregar"}`);
      window.setTimeout(() => setToast(""), 2800);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("¿Eliminar este slide?")) return;
    await deleteMutation.mutateAsync(id);
  };

  return (
    <>
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Nuevo slide</h2>
            <div className="panel-sub">1366 × 600 px · PNG · JPG · WebP</div>
          </div>
        </div>
        <form onSubmit={submit}>
          <div className="field-row">
            <div className={"field" + (errors.title ? " error" : "")}>
              <label>Título</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Bienvenidos a Gratex"
              />
              {errors.title && <div className="field-error">{errors.title}</div>}
            </div>
            <div className={"field" + (errors.subtitle ? " error" : "")}>
              <label>Subtítulo</label>
              <input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Soluciones industriales"
              />
              {errors.subtitle && <div className="field-error">{errors.subtitle}</div>}
            </div>
          </div>
          <div className={"field" + (errors.image ? " error" : "")}>
            <label>Imagen</label>
            <div
              className="upload"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) setForm((p) => ({ ...p, image: file }));
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setForm((p) => ({ ...p, image: file }));
                }}
              />
              <Icons.upload size={20} style={{ color: "var(--muted)" }} />
              <div style={{ fontSize: 13, marginTop: 8 }}>
                {form.image ? (
                  <span>{form.image.name}</span>
                ) : (
                  <>
                    Arrastra una imagen o{" "}
                    <span style={{ color: "var(--accent)", textDecoration: "underline" }}>haz clic aquí</span>
                  </>
                )}
              </div>
              <div
                className="mono"
                style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, letterSpacing: "0.12em" }}
              >
                PNG · JPG · WEBP · 1366×600
              </div>
            </div>
            {errors.image && <div className="field-error">{errors.image}</div>}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setForm(EMPTY_CAROUSEL);
                setErrors({});
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-accent" disabled={createMutation.isPending}>
              <Icons.plus size={13} /> {createMutation.isPending ? "Agregando…" : "Agregar slide"}
            </button>
          </div>
        </form>
      </div>

      <div className="nav-h" style={{ padding: "0 0 8px" }}>
        Slides publicados · {slides.length}
      </div>

      {isLoading && (
        <div className="page-sub" style={{ padding: "12px 0" }}>
          Cargando…
        </div>
      )}

      {slides.map((s) => (
        <div key={s.id} className="slide-row">
          <div className="slide-thumb">
            {s.image_path ? <img src={`${API_BASE_URL}/${s.image_path}`} alt={s.title} /> : "1366 × 600"}
          </div>
          <div>
            <div className="slide-title">{s.title}</div>
            <div className="slide-sub">{s.subtitle}</div>
            <div style={{ marginTop: 6 }}>
              {/* MOCK: backend has no `published` flag — assume all live. */}
              <Pill status="Aprobada" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="icon-btn" aria-label="Editar">
              <Icons.edit size={13} />
            </button>
            <button className="icon-btn" aria-label="Eliminar" onClick={() => onDelete(s.id)}>
              <Icons.trash size={13} />
            </button>
          </div>
        </div>
      ))}

      {toast && (
        <div className="toast">
          <span className="swatch" style={{ background: "var(--c-yellow)" }} />
          {toast}
        </div>
      )}
    </>
  );
}

interface ServiceForm {
  title: string;
  description: string;
  image: File | null;
}

const EMPTY_SERVICE: ServiceForm = { title: "", description: "", image: null };

function ServicesTab() {
  const { data: services = [], isLoading } = useServiceItemsQuery();
  const createMutation = useCreateServiceItem();
  const deleteMutation = useDeleteLandingItem("services");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ServiceForm>(EMPTY_SERVICE);
  const [toast, setToast] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.image) return;
    const result = await createMutation.mutateAsync({
      title: form.title,
      description: form.description,
      image: form.image,
    });
    if (result.success) {
      setForm(EMPTY_SERVICE);
      setShowForm(false);
      setToast("Servicio agregado");
      window.setTimeout(() => setToast(""), 2200);
    } else {
      setToast(`Error: ${result.error ?? "no se pudo agregar"}`);
      window.setTimeout(() => setToast(""), 2800);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("¿Eliminar este servicio?")) return;
    await deleteMutation.mutateAsync(id);
  };

  return (
    <>
      {isLoading && <div className="page-sub">Cargando…</div>}

      <div className="card-grid">
        {services.map((s, i) => (
          <div key={s.id} className="quote-card" style={{ cursor: "default" }}>
            <div className="quote-card-top">
              <div>
                <div className="quote-client">{s.title}</div>
                <div
                  className="quote-company"
                  style={{ marginTop: 6, color: "var(--ink-2)", fontFamily: "Geist" }}
                >
                  {s.description}
                </div>
              </div>
              <span
                className="swatch"
                style={{
                  background: CMYK[i % CMYK.length],
                  width: 14,
                  height: 14,
                }}
              />
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 6 }}>
              <button className="btn-ghost" style={{ fontSize: 11 }}>
                Editar
              </button>
              <button className="icon-btn" aria-label="Eliminar" onClick={() => onDelete(s.id)}>
                <Icons.trash size={13} />
              </button>
            </div>
          </div>
        ))}
        <div
          className="quote-card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderStyle: "dashed",
            cursor: "pointer",
          }}
          onClick={() => setShowForm((v) => !v)}
        >
          <div style={{ textAlign: "center", color: "var(--muted)" }}>
            <Icons.plus size={18} />
            <div
              className="mono"
              style={{
                marginTop: 4,
                fontSize: 11,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              {showForm ? "Cerrar" : "Agregar"}
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="panel" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Nuevo servicio</h2>
              <div className="panel-sub">400 × 400 px recomendado</div>
            </div>
          </div>
          <form onSubmit={submit}>
            <div className="field-row">
              <div className="field">
                <label>Título</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Descripción</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label>Imagen</label>
              <div className="upload" onClick={() => fileInputRef.current?.click()}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setForm((p) => ({ ...p, image: file }));
                  }}
                />
                <Icons.upload size={20} style={{ color: "var(--muted)" }} />
                <div style={{ fontSize: 13, marginTop: 8 }}>
                  {form.image ? form.image.name : "Haz clic para seleccionar"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-accent" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Agregando…" : "Agregar servicio"}
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div className="toast">
          <span className="swatch" style={{ background: "var(--c-yellow)" }} />
          {toast}
        </div>
      )}
    </>
  );
}
