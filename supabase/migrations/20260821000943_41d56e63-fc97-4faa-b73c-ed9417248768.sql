CREATE POLICY "Imagens produtos leitura publica" ON storage.objects FOR SELECT USING (bucket_id = 'produtos');
CREATE POLICY "Imagens produtos upload admin" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'produtos');
CREATE POLICY "Imagens produtos update admin" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'produtos');
CREATE POLICY "Imagens produtos delete admin" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'produtos');