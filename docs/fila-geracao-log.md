# Fila de geração — throughput real e custo estimado do catálogo

Data: 2026-07-20. Correção do Davi aplicada: a fila nasce com **TODO o
catálogo + episódios novos automaticamente** — sem lotes manuais. O que
segue sequencial/limitado é só o PROCESSAMENTO (limite físico de
compute/API, não escolha de produto).

## Como funciona

1. **Enfileirar** (`npm run fila:enfileirar`): lista a uploads playlist
   inteira do canal (paginação completa) e insere TUDO em
   `episodios_processados` como `pendente`. Idempotente (unique de
   video_id ignora repetidos e preserva status de quem já anda) — pode
   rodar agendado; episódio novo entra sozinho na próxima execução.
2. **Processar** (`npm run fila:processar -- --lote 5`): pega os N mais
   recentes `pendente` e roda legenda → cérebro (OpenRouter) → cria o
   Learn com thumbnail real. Estado final respeita o **modo de
   publicação** do admin: `em_revisao` (manual, padrão) ou `publicado`
   (automático). Marca `gerando_ativos` — o workflow de render (Actions)
   assume daí (vídeo Remotion + TTS + Ebook + mapa) e fecha com
   `learn:subir-ativos` → `concluido`.
3. Episódio sem legenda utilizável vai pra `erro` com o motivo no
   `erro_log` (fallback Groq exige áudio-fonte manual — limitação já
   documentada da Fase 1) e a fila segue.

Tudo visível na "Fila de conteúdo" do admin, estágio por estágio.

## Throughput REAL observado (números medidos, não chute)

| Etapa | Medição | Fonte |
|---|---|---|
| Estruturação (cérebro) | **40–60 s/episódio** (inclui retentativas de piso/JSON) | runs verdes do workflow teste-cerebro em 2026-07-18 (timestamps dos logs: 3 gerações completas medidas) |
| Ebook (HTML→PDF) + mapa | segundos por episódio | gerações da Fase 2 |
| TTS (Edge) | ~1–2 min por 7 min de fala | testes da Fase 2 no CI |
| **Render do vídeo (gargalo)** | estimado **35–70 min/episódio** (12.300 frames a 3–6 fps em runner padrão do Actions) | taxa observada nos renders headless da Fase 2; o número exato do master não foi cronometrado — medir no 1º run real e atualizar aqui |

**Capacidade sustentada**: estruturação ~60–90 eps/hora (sequencial);
gargalo é o render ≈ 1 ep/runner-hora. O repo é PÚBLICO → GitHub
Actions com runners padrão é **grátis e permite até 20 jobs
concorrentes**: com matriz de 5 renders paralelos, ~5 eps/hora.

**Catálogo completo (estimativa p/ 150–300 episódios)**:
- 150 eps ≈ 30 h de render com 5 paralelos (~1,5 dia corrido)
- 300 eps ≈ 60 h (~2,5–3 dias corridos)
- Estruturação inteira: 2–5 h no total (dá pra rodar numa madrugada)

## Custo estimado (para acompanhamento)

| Item | Por episódio | Catálogo 150 | Catálogo 300 |
|---|---|---|---|
| OpenRouter estruturação (gemini-2.5-flash: US$0,30/M entrada, US$2,50/M saída; ~16k in + ~12k out c/ retentativas) | **~US$ 0,03–0,06** | US$ 5–9 | US$ 9–18 |
| TTS (Edge) | R$ 0 | R$ 0 | R$ 0 |
| Render/compute (Actions, repo público) | R$ 0 | R$ 0 | R$ 0 |
| Storage Supabase (~30 MB vídeo 720p + PDF/mapa por ep) | — | ~5 GB | ~10 GB (conferir teto do plano; Free = 1 GB → **Pro necessário pro catálogo completo**) |

Ou seja: o custo em dinheiro do catálogo inteiro é **da ordem de
US$ 10–20 de OpenRouter** + o plano do Supabase pelo Storage; o custo
real é TEMPO de render. Atualizo os números com o throughput medido do
primeiro lote real (a chave do YouTube destrava isso).

## O que falta pra ligar (nenhum código)

`YOUTUBE_API_KEY` no ambiente → `npm run fila:enfileirar` → workflow de
processamento em loop. Storage: conferir plano (acima).
