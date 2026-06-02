import { Icons } from "@/shared/components/press/PressIcons";

export interface PagerProps {
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  canPrev: boolean;
  canNext: boolean;
  isFetching: boolean;
  onPrev: () => void;
  onNext: () => void;
}

function Range({ page, pageSize, total, isFetching }: Pick<PagerProps, "page" | "pageSize" | "total" | "isFetching">) {
  return (
    <div className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em" }}>
      {total > 0
        ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total}`
        : "0 de 0"}
      {isFetching && " · cargando…"}
    </div>
  );
}

function Controls({ page, totalPages, canPrev, canNext, onPrev, onNext }: PagerProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button className="btn-ghost" disabled={!canPrev} onClick={onPrev} style={{ opacity: canPrev ? 1 : 0.4 }}>
        <Icons.chevronLeft size={13} /> Anterior
      </button>
      <span className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em" }}>
        Página {page} de {totalPages}
      </span>
      <button className="btn-ghost" disabled={!canNext} onClick={onNext} style={{ opacity: canNext ? 1 : 0.4 }}>
        Siguiente <Icons.chevronRight size={13} />
      </button>
    </div>
  );
}

/** Pager used under the table view (bordered row inside the panel). */
export function PagerRow(props: PagerProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        borderTop: "1px solid var(--line)",
        gap: 12,
      }}
    >
      <Range {...props} />
      <Controls {...props} />
    </div>
  );
}

/** Pager used under the cards view. Hidden when there is a single page. */
export function Pager(props: PagerProps) {
  if (props.totalPages <= 1) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        gap: 12,
      }}
    >
      <Range {...props} />
      <Controls {...props} />
    </div>
  );
}
