import { pool } from "../db/pool.js";

export type ShortLinkRecord = {
  id: number;
  short_code: string;
  original_url: string;
  owner_id: number | null;
  created_at: Date;
  updated_at: Date;
};

const columns = `id, short_code, original_url, owner_id, created_at, updated_at`;

export async function shortCodeExists(shortCode: string): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM short_links WHERE short_code = $1
     ) AS exists`,
    [shortCode],
  );

  return result.rows[0]?.exists ?? false;
}

export async function insertShortLink(input: {
  shortCode: string;
  originalUrl: string;
  ownerId: number | null;
}): Promise<ShortLinkRecord> {
  const result = await pool.query<ShortLinkRecord>(
    `INSERT INTO short_links (short_code, original_url, owner_id)
     VALUES ($1, $2, $3)
     RETURNING ${columns}`,
    [input.shortCode, input.originalUrl, input.ownerId],
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
