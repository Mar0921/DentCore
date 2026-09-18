-- Enable RLS on encuesta tables
ALTER TABLE public.encuestas_pos_adaptacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buzon_quejas ENABLE ROW LEVEL SECURITY;

-- Policies for anon (public/guest without login)
CREATE POLICY "Allow anon insert encuestas_pos_adaptacion" ON public.encuestas_pos_adaptacion FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon select encuestas_pos_adaptacion" ON public.encuestas_pos_adaptacion FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert buzon_quejas" ON public.buzon_quejas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon select buzon_quejas" ON public.buzon_quejas FOR SELECT TO anon USING (true);

-- Policies for authenticated users (if guests log in)
CREATE POLICY "Allow authenticated insert encuestas_pos_adaptacion" ON public.encuestas_pos_adaptacion FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated select encuestas_pos_adaptacion" ON public.encuestas_pos_adaptacion FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert buzon_quejas" ON public.buzon_quejas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated select buzon_quejas" ON public.buzon_quejas FOR SELECT TO authenticated USING (true);
