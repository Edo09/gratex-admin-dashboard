export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success?: boolean;
  status?: boolean;
  data?: T;
  pagination?: Pagination;
  message?: string;
  error?: string;
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export interface ListResult<T> {
  items: T[];
  pagination?: Pagination;
}

export interface PageQuery {
  query?: string;
  page?: number;
  pageSize?: number;
}
