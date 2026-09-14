-- Additive schema step for Products.ogImage. Run once before the administrative
-- import or deployment; safe to rerun. Names match Payload's Postgres adapter.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS og_image_id integer;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_og_image_id_media_id_fk'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_og_image_id_media_id_fk
      FOREIGN KEY (og_image_id) REFERENCES public.media(id)
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS products_og_image_idx
  ON public.products USING btree (og_image_id);
COMMIT;
