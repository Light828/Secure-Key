
CREATE TABLE public.enquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  service TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON public.enquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public select" ON public.enquiries
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public update" ON public.enquiries
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete" ON public.enquiries
  FOR DELETE TO anon, authenticated
  USING (true);
