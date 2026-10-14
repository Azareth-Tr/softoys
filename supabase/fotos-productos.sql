-- Fotos publicas y subidas provisionales sin sesion.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('fotos-productos', 'fotos-productos', true, 5242880,
 ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
 public = EXCLUDED.public,
 file_size_limit = EXCLUDED.file_size_limit,
 allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "fotos_productos_subida_provisional" ON storage.objects;
CREATE POLICY "fotos_productos_subida_provisional"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'fotos-productos');
