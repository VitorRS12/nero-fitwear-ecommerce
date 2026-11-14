ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'in_mediation';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'charged_back';