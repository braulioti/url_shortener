import { pool } from "../db/pool.js";
import type {
  ParsedShortLinkListQuery,
  ShortLinkSortField,
} from "./list-query.js";

export type ShortLinkRecord = {
  id: number;
  short_code: string;
  original_url: string;
  description: string | null;
  owner_id: number | null;
  created_at: Date;
  updated_at: Date;
};

export type PaginatedShortLinks = {
  items: ShortLinkRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const columns = `id, short_code, original_url, description, owner_id, created_at, updated_at`;

const SORT_COLUMN: Record<ShortLinkSortField, string> = {
  created_at: "created_at",
  updated_at: "updated_at",
  short_code: "short_code",
  description: "description",
};

export async function shortCodeExists(shortCode: string): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM short_links WHERE short_code = $1
     ) AS exists`,
    [shortCode],
  );

  return result.rows[0]?.exists ?? false;
}

export async function shortCodeExistsForOtherLink(
  shortCode: string,
  excludeLinkId: number,
): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM short_links
       WHERE short_code = $1 AND id <> $2
     ) AS exists`,
    [shortCode, excludeLinkId],
  );

  return result.rows[0]?.exists ?? false;
}

export async function findShortLinkByIdForOwner(
  linkId: number,
  ownerId: number,
): Promise<ShortLinkRecord | null> {
  const result = await pool.query<ShortLinkRecord>(
    `SELECT ${columns}
     FROM short_links
     WHERE id = $1 AND owner_id = $2`,
    [linkId, ownerId],
  );

  return result.rows[0] ?? null;
}

export async function updateShortLinkForOwner(input: {
  linkId: number;
  ownerId: number;
  shortCode: string;
  originalUrl: string;
  description: string | null;
}): Promise<ShortLinkRecord | null> {
  const result = await pool.query<ShortLinkRecord>(
    `UPDATE short_links
     SET short_code = $1,
         original_url = $2,
         description = $3,
         updated_at = now()
     WHERE id = $4 AND owner_id = $5
     RETURNING ${columns}`,
    [
      input.shortCode,
      input.originalUrl,
      input.description,
      input.linkId,
      input.ownerId,
    ],
  );

  return result.rows[0] ?? null;
}

export async function deleteShortLinkForOwner(
  linkId: number,
  ownerId: number,
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM short_links
     WHERE id = $1 AND owner_id = $2`,
    [linkId, ownerId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function insertShortLink(input: {
  shortCode: string;
  originalUrl: string;
  ownerId: number | null;
  description?: string | null;
}): Promise<ShortLinkRecord> {
  const result = await pool.query<ShortLinkRecord>(
    `INSERT INTO short_links (short_code, original_url, description, owner_id)
     VALUES ($1, $2, $3, $4)
     RETURNING ${columns}`,
    [input.shortCode, input.originalUrl, input.description ?? null, input.ownerId],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to insert short link");
  }

  return row;
}

export async function findShortLinkByCode(
  shortCode: string,
): Promise<ShortLinkRecord | null> {
  const result = await pool.query<ShortLinkRecord>(
    `SELECT ${columns} FROM short_links WHERE short_code = $1`,
    [shortCode],
  );

  return result.rows[0] ?? null;
}

export async function listShortLinksByOwner(
  ownerId: number,
  query: ParsedShortLinkListQuery,
): Promise<PaginatedShortLinks> {
  const offset = (query.page - 1) * query.pageSize;
  const sortColumn = SORT_COLUMN[query.sortBy];
  const sortDirection = query.sortOrder === "asc" ? "ASC" : "DESC";

  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total
     FROM short_links
     WHERE owner_id = $1`,
    [ownerId],
  );

  const total = Number.parseInt(countResult.rows[0]?.total ?? "0", 10);
  const totalPages = total === 0 ? 0 : Math.ceil(total / query.pageSize);

  const listResult = await pool.query<ShortLinkRecord>(
    `SELECT ${columns}
     FROM short_links
     WHERE owner_id = $1
     ORDER BY ${sortColumn} ${sortDirection}, id DESC
     LIMIT $2 OFFSET $3`,
    [ownerId, query.pageSize, offset],
  );

  return {
    items: listResult.rows,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages,
  };
}
