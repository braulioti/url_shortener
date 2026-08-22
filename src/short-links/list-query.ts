const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

const SORT_FIELDS = ["created_at", "updated_at", "short_code", "description"] as const;
const SORT_ORDERS = ["asc", "desc"] as const;

export type ShortLinkSortField = (typeof SORT_FIELDS)[number];
export type ShortLinkSortOrder = (typeof SORT_ORDERS)[number];

export type ParsedShortLinkListQuery = {
  page: number;
  pageSize: number;
  sortBy: ShortLinkSortField;
  sortOrder: ShortLinkSortOrder;
};

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

export function parseShortLinkListQuery(
  searchParams: URLSearchParams,
): ParsedShortLinkListQuery {
  const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE);
  const requestedPageSize = parsePositiveInt(
    searchParams.get("limit") ?? searchParams.get("pageSize"),
    DEFAULT_PAGE_SIZE,
  );
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);

  const sortByParam = searchParams.get("sort") ?? searchParams.get("sortBy");
  const sortBy = SORT_FIELDS.includes(sortByParam as ShortLinkSortField)
    ? (sortByParam as ShortLinkSortField)
    : "created_at";

  const sortOrderParam = searchParams.get("order") ?? searchParams.get("sortOrder");
  const sortOrder = SORT_ORDERS.includes(sortOrderParam as ShortLinkSortOrder)
    ? (sortOrderParam as ShortLinkSortOrder)
    : "desc";

  return { page, pageSize, sortBy, sortOrder };
}

export function buildShortLinkListQueryString(
  query: ParsedShortLinkListQuery,
): string {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.pageSize),
    sort: query.sortBy,
    order: query.sortOrder,
  });
  return params.toString();
}
