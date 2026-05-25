import type { ReactNode } from "react";

interface BaseProps {
  children: ReactNode;
  className?: string;
}

interface TableRowProps extends BaseProps {
  onClick?: React.MouseEventHandler<HTMLTableRowElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLTableRowElement>;
  role?: string;
  tabIndex?: number;
}

interface TableCellProps extends BaseProps {
  isHeader?: boolean;
  colSpan?: number;
}

export function Table({ children, className }: BaseProps) {
  return <table className={`min-w-full ${className ?? ""}`}>{children}</table>;
}

export function TableHeader({ children, className }: BaseProps) {
  return <thead className={className}>{children}</thead>;
}

export function TableBody({ children, className }: BaseProps) {
  return <tbody className={className}>{children}</tbody>;
}

export function TableRow({ children, className, onClick, onKeyDown, role, tabIndex }: TableRowProps) {
  return (
    <tr className={className} onClick={onClick} onKeyDown={onKeyDown} role={role} tabIndex={tabIndex}>
      {children}
    </tr>
  );
}

export function TableCell({ children, isHeader = false, className, colSpan }: TableCellProps) {
  const Tag = isHeader ? "th" : "td";
  return (
    <Tag className={` ${className ?? ""}`} colSpan={colSpan}>
      {children}
    </Tag>
  );
}
