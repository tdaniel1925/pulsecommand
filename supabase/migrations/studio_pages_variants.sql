-- Per-block visual variants, e.g. {"hero": "centered"}. Null/absent = each block
-- uses its default variant. Stored as JSON object of blockType -> variantId.
alter table public.studio_pages add column if not exists variants jsonb;
