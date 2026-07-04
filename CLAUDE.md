# AR LEARN — Regras Inegociáveis

## Stack (não trocar sem aprovação do usuário)
1. Front-end/hospedagem: Next.js App Router → Cloudflare Pages
2. Banco/Auth/Storage: Supabase (Postgres + RLS ativo + Edge Functions)
3. Ingestão: YouTube Data API v3 (OAuth do dono do canal) + fallback Groq Whisper
4. Geração de conteúdo: OpenRouter (modelo barato) → JSON estruturado do Learn
5. Vídeo: Remotion, render só no GitHub Actions (nunca Lambda, nunca serviço pago) — licença Free, produto individual
6. Voz: Edge TTS (msedge-tts), voz oficial e fixa `pt-BR-AntonioNeural` — não é clonagem (sem Fish Audio/Chatterbox/ElevenLabs). Não é API oficial da Microsoft (sem SLA); Plano C documentado = Google Cloud TTS (ver docs/regras.md)
7. Mapa mental: Markmap (interativo) + Kroki (imagem no PDF)

## Regra de Ouro
Desviou do plano dos manuais? Pare, diagnostique, conserte para voltar ao plano, registre o ocorrido, só então continue. Segredos nunca no código — só em env vars do provedor.

## Duração de vídeo
Mínimo 7 minutos (420s), sem teto, proporcional ao conteúdo real — nunca cortar nem encher.

## Fontes de verdade
8 PDFs fornecidos pelo usuário via chat (não versionados neste repo). Resumo destilado em `docs/stack.md` e `docs/regras.md`. Decisões e histórico de sessões antigas em `docs/historico.md` (abrir só quando pedido). Progresso e variáveis de ambiente em `SETUP.md`.
