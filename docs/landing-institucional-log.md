# Landing institucional — antes/depois, copy e decisões

Data: 2026-07-19. Base: "CORREÇÃO CRÍTICA: a landing NÃO é sobre o
episódio #171" do prompt de finalização.

## Antes → Depois

| | ANTES | DEPOIS |
|---|---|---|
| Hero | Manchete do ep. 171 ("A conta que ninguém faz...") | Vende a PLATAFORMA: "Aprenda a investir em imóveis com aulas objetivas, feitas de dados reais" |
| Sub | Descrição do ep. 171 (3 dados-chave) | O que é a Academy: podcast → Learn (vídeo curto + Ebook + mapa) |
| Player | Vídeo do ep. 171 no meio da landing | REMOVIDO da landing — o vídeo vive em /learns/[slug] (pós-compra) |
| CTA | "Ver Episódio Completo" | "Começar agora →" (/comprar) + "Já sou aluno" (/entrar) |
| Seções | Material da aula (do 171) | Benefícios · "O que está incluso" em BENTO GRID · Prova social · Preview real da vitrine · CTA final |

**Nada foi descartado, só movido** (regra do prompt): manchete + resumo
do 171 são o hero da vitrine pós-login (dados reais do banco) e a página
/learns/[slug]; o player mora na página do Learn; os 3 dados-chave do
171 estão no Ebook/resumo do próprio Learn — a landing pública não
"spoila" mais um produto específico.

## Copy nova (racional)

- **H1**: "Aprenda a investir em imóveis com aulas objetivas, feitas de
  dados reais" — promessa da plataforma, ecoa os dois diferenciais
  (objetividade + dados) sem citar episódio.
- **O que é**: "A Academy transforma cada episódio do podcast Altamente
  Rentável em um Learn: vídeo-aula curta e prática, Ebook premium e mapa
  mental interativo."
- **Benefícios (4)**: "7 minutos, não 2 horas" / "Dados reais, não
  teoria" / "Ebook + mapa mental" / "Sem enrolação".
- **Prova social**: "Nascida do podcast Altamente Rentável" — autoridade
  pela FONTE, sem inventar número de alunos/ouvintes (regra do prompt:
  ajustar claim ao dado real disponível; hoje não há métrica auditada).
- **CTA**: "Começar agora →" leva ao /comprar (hoje o produto vendável é
  o acesso ao Learn por R$ 127,48 — pagamento único já decidido; quando
  houver múltiplos Learns/planos, o /comprar evolui, não a landing).

## Decisões bento/glassmorphism (da pesquisa Awwwards/FWA)

- **Bento grid** em "O que está incluso": vídeo-aula = tile 2×2 (o
  carro-chefe, hierarquia comunicada por tamanho), Ebook e mapa = tiles
  1×, preço/CTA = tile largo full-width. Colapsa pra coluna única <860px.
- **Glassmorphism 2.0 com moderação**: só no header fixo (sticky +
  backdrop-blur 14px + borda goldenrod 14%) e nas caixas de destaque do
  hero/prova social. O resto segue dark sólido — "não a página inteira".
- **Motion com propósito + performance como feature**: a entrada
  acima-da-dobra virou **CSS puro** (o LCP pinta no primeiro frame; a
  versão via Motion/JS segurava o H1 invisível até a hidratação).
  Motion continua nos reveals abaixo da dobra e micro-interações.

## Lighthouse mobile (emulação, throttling padrão)

| Métrica | Com entrada via JS | Depois (CSS acima da dobra) |
|---|---|---|
| Performance | 0,72 | **0,96** |
| FCP | 2,2 s | **0,8 s** |
| LCP | 4,3 s | **2,7 s** |
| TBT | 350 ms | **50 ms** |
| CLS | 0 | 0 |

(Rodado local em produção-mode; revalidar no domínio público após o
deploy — rede real muda os números absolutos, não a estrutura.)

## Thumbnails reais do YouTube (também desta rodada)

- Coluna `learns.thumbnail_url` (migration `20260719110000`, aplicada no
  projeto) + exposta no teaser `learns_publico`.
- Ingestão captura `snippet.thumbnails` com cascata maxres → standard →
  high → medium → default (`melhorThumbnail` em lib/youtube/canal.ts) —
  pronto pra esteira de segunda.
- Backfill do ep. 171: URL determinística do CDN
  (`i.ytimg.com/vi/WyktmQKpL94/maxresdefault.jpg`); o card faz cascata
  client-side no onError (maxres → hqdefault → fallback visual da marca:
  grid + monograma goldenrod). Nunca imagem quebrada.
- Card aplica overlay gradiente escuro na base (legibilidade), padrão do
  design system.

## Limitações de captura (sandbox, não do produto)

Nos screenshots: o preview "Já disponível na Academy" aparece como
skeleton e as capas como fallback da marca porque o sandbox bloqueia
supabase.co / i.ytimg.com. Em produção carregam os cards e thumbnails
reais. O fullPage converte o header sticky em static só na captura
(artefato de screenshot); o arquivo `*_hero.png` mostra o header glass
na posição real.
