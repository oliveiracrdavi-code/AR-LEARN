"use client";

// Preview da vitrine com dados FICTÍCIOS de UI (não toca banco nenhum) —
// existe só pra screenshot/QA visual da arquitetura com N learns antes
// dos episódios 172+ chegarem. Nunca renderiza em produção (gate no
// server component pai).
import { HeroDestaque } from "@/componentes/vitrine/HeroDestaque";
import { VitrineRow } from "@/componentes/vitrine/VitrineRow";
import type { CardLearn } from "@/lib/vitrine/fileiras";

function c(p: Partial<CardLearn> & { slug: string; titulo: string }): CardLearn {
  return {
    id: p.slug,
    resumo: null,
    duracao_segundos: 420,
    publicado_at: new Date().toISOString(),
    comprado: false,
    novo: false,
    emAlta: false,
    progresso: null,
    ...p,
  };
}

const HERO = c({
  slug: "a-conta-que-ninguem-faz-ep-171",
  titulo: "A conta que ninguém faz antes de investir em imóvel",
  resumo:
    "Um guia prático com 3 dados-chave para calcular ROI real em imóveis: entrada, recorrência e custo por m².",
  duracao_segundos: 410,
  comprado: true,
  novo: true,
});

const FILEIRAS: { titulo: string; cards: CardLearn[] }[] = [
  {
    titulo: "Continue de onde parou",
    cards: [c({ slug: "a-conta-que-ninguem-faz-ep-171", titulo: "A conta que ninguém faz", comprado: true, progresso: 0.42 })],
  },
  {
    titulo: "Antes de comprar seu primeiro imóvel",
    cards: [
      c({ slug: "a-conta-que-ninguem-faz-ep-171", titulo: "A conta que ninguém faz", comprado: true, progresso: 0.42, novo: true }),
      c({ slug: "ex-entrada", titulo: "Quanto de entrada faz o negócio parar em pé" }),
      c({ slug: "ex-financiamento", titulo: "Financiamento: quando os juros trabalham por você", emAlta: true }),
      c({ slug: "ex-planta", titulo: "Comprar na planta sem cair em distrato" }),
      c({ slug: "ex-vistoria", titulo: "O checklist de vistoria que evita prejuízo" }),
      c({ slug: "ex-itbi", titulo: "ITBI, escritura e os custos que ninguém soma" }),
    ],
  },
  {
    titulo: "Como viver de aluguel",
    cards: [
      c({ slug: "ex-shortstay", titulo: "Short stay no interior: oportunidade ou armadilha", emAlta: true }),
      c({ slug: "ex-vacancia", titulo: "Vacância: o vilão silencioso da renda passiva" }),
      c({ slug: "ex-gestao", titulo: "Autogestão vs. administradora: a conta real" }),
      c({ slug: "ex-reajuste", titulo: "Reajuste de aluguel sem perder o inquilino" }),
    ],
  },
  {
    titulo: "Novos episódios",
    cards: [
      c({ slug: "a-conta-que-ninguem-faz-ep-171", titulo: "A conta que ninguém faz", comprado: true, novo: true, progresso: 0.42 }),
      c({ slug: "ex-shortstay", titulo: "Short stay no interior: oportunidade ou armadilha", novo: true }),
      c({ slug: "ex-entrada", titulo: "Quanto de entrada faz o negócio parar em pé" }),
    ],
  },
];

export function VitrinePreviewCliente() {
  return (
    <main style={{ minHeight: "100vh", padding: "32px 6vw 80px", background: "var(--black)" }}>
      <p className="kicker">Preview de desenvolvimento — dados fictícios de UI</p>
      <HeroDestaque card={HERO} />
      {FILEIRAS.map((f) => (
        <VitrineRow key={f.titulo} titulo={f.titulo} cards={f.cards} />
      ))}
    </main>
  );
}
