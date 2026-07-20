-- AR LEARN — vídeo migra pro Cloudflare R2 (10GB free + egress zero);
-- Ebook/mapa mental continuam no Supabase Storage (pequenos, não
-- estouram o limite). `video_storage` diz onde resolver a signed URL:
-- 'r2' (novo padrão) ou 'supabase' (registros antigos, se algum dia
-- existir). learns.video_url passa a guardar a KEY do objeto no R2
-- (não mais o path no bucket Supabase) quando video_storage = 'r2'.
alter table public.learns
  add column video_storage text not null default 'r2'
    check (video_storage in ('r2', 'supabase'));
