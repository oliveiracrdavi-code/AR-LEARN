# Stack — AR LEARN

100% serverless, zero VPS, custo quase zero. Nenhuma peça abaixo deve ser
trocada por versão paga ou por conveniência sem aprovação explícita.

| Camada | Ferramenta | Observação |
|---|---|---|
| Front-end + hospedagem | Next.js (App Router) | Deploy na Cloudflare Pages |
| Banco / Auth / Storage | Supabase | Postgres + RLS ativo + Edge Functions |
| Ingestão de transcript | YouTube Data API v3 | OAuth do dono do canal; fallback Groq (Whisper) se não houver legenda |
| Geração do JSON do Learn | OpenRouter | Modelo barato |
| Mapa mental | Markmap + Kroki | Markmap interativo no site, Kroki gera a imagem para o PDF |
| PDF | Geração server-side | — |
| Vídeo | Remotion | Render só no GitHub Actions. Nunca AWS Lambda, nunca serviço pago. Licença Free (produto individual, declarado como `free-license` no render) |
| Voz | Cloudflare Workers AI (MeloTTS) | Voz única e fixa. Não é clonagem — sem Fish Audio, Chatterbox ou ElevenLabs. Trocado do Google Cloud TTS em 2026-07-04 (conta de faturamento com verificação de identidade travava o uso); suporte a pt-BR ainda não confirmado na prática, ver `docs/historico.md` |
| Pagamento | Mercado Pago (principal) / Asaas (alternativa documentada) | Pix como meio principal. Implementação só na Fase 4 |
| Repositório | `oliveiracrdavi-code/AR-LEARN` | Público, para minutos ilimitados no GitHub Actions |

## Regra de duração de vídeo
Mínimo de 7 minutos (420s) por videoaula, sempre (atualizado de 5 min —
ver `docs/historico.md`). Acima disso, duração proporcional ao conteúdo
real do Learn — sem teto fixo, sem cortar conteúdo para encurtar, sem
encher para esticar.

## Pipeline autônomo (visão geral — doc 3 vence sobre a seção equivalente do doc 1)
Novo vídeo no canal → checa `episodios_processados` (idempotência) → busca
legenda oficial (OAuth) ou transcreve via Groq → OpenRouter estrutura o JSON
do Learn → gera os 3 ativos obrigatórios (PDF, Mapa Mental, Videoaula) →
Learn nasce `rascunho` → `em_revisao` → `publicado` só após aprovação manual.
