
-- Create clients table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid,
  name character varying NOT NULL,
  phone character varying,
  email character varying,
  address text,
  cnpj character varying,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT clients_pkey PRIMARY KEY (id),
  CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT clients_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.agencies(id)
);

-- Enable RLS on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policy for clients
CREATE POLICY "Users can view their own clients" ON public.clients
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own clients" ON public.clients
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own clients" ON public.clients
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own clients" ON public.clients
    FOR DELETE USING (user_id = auth.uid());
