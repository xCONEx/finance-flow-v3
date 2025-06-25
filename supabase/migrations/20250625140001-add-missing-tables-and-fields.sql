
-- Add missing fields to agencies table
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS cnpj character varying;

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

-- Create contracts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NOT NULL,
  title character varying NOT NULL,
  description text,
  value numeric(10,2),
  start_date date,
  end_date date,
  status character varying NOT NULL DEFAULT 'ativo',
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT contracts_pkey PRIMARY KEY (id),
  CONSTRAINT contracts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT contracts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);

-- Enable RLS on new tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table
CREATE POLICY "Users can view their own clients" ON public.clients
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own clients" ON public.clients
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own clients" ON public.clients
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own clients" ON public.clients
    FOR DELETE USING (user_id = auth.uid());

-- Create policies for contracts table
CREATE POLICY "Users can view their own contracts" ON public.contracts
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own contracts" ON public.contracts
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own contracts" ON public.contracts
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own contracts" ON public.contracts
    FOR DELETE USING (user_id = auth.uid());
