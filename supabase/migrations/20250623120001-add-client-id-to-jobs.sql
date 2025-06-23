
-- Add client_id column to jobs table
ALTER TABLE public.jobs ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_jobs_client_id ON public.jobs(client_id);

-- Update existing jobs to link with clients based on client name (best effort)
UPDATE public.jobs 
SET client_id = (
    SELECT c.id 
    FROM public.clients c 
    WHERE c.name = jobs.client 
    AND c.user_id = jobs.userId
    LIMIT 1
);
