"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSessao } from "@/lib/supabase/useSessao";
import { montarVitrine, type Vitrine } from "@/lib/vitrine/fileiras";
import { HeroDestaque, HeroSkeleton } from "@/componentes/vitrine/HeroDestaque";
import { VitrineRow } from "@/componentes/vitrine/VitrineRow";

// DASHBOARD — vitrine estilo Netflix: hero em destaque + fileiras
// horizontais nomeadas por RESULTADO. A segurança continua a mesma da
// versão anterior: tudo que é conteúdo comprado vem da tabela `learns`
// sob RLS; o catálogo bloqueado vem do teaser público (colunas leves).
// Preparado pra N Learns — com 1 publicado hoje, hero + fileiras já
// funcionam e o catálogo preenche sozinho quando os eps 172+ chegarem.
export default function DashboardPage() {
  const { sessao, carregando } = useSessao();
  const [vitrine, setVitrine] = useState<Vitrine | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!sessao) return;
    montarVitrine()
      .then(setVitrine)
      .catch((e) => setErro(e instanceof Error ? e.message : "erro inesperado"));
  }, [sessao]);

  async function sair() {
    await createBrowserSupabaseClient().auth.signOut();
    window.location.href = "/";
  }

  if (carregando) {
    return (
      <main className="fundo-grid" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--dusty-grey)" }}>Carregando...</p>
      </main>
    );
  }

  if (!sessao) {
    return (
      <main className="fundo-grid" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 6vw" }}>
        <div className="cartao" style={{ maxWidth: 460, textAlign: "center" }}>
          <h1 style={{ fontWeight: 800, fontSize: 24 }}>
            Área do <span style={{ color: "var(--goldenrod)" }}>aluno</span>
          </h1>
          <p style={{ color: "var(--dusty-grey)", marginTop: 10, fontSize: 15 }}>
            Você precisa entrar para acessar seus Learns.
          </p>
          <Link href="/entrar" className="botao-goldenrod" style={{ marginTop: 18 }}>
            Entrar na Academy →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", padding: "32px 6vw 80px", background: "var(--black)" }}>
      <header className="cabecalho-site" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/logo-ar.jpg" alt="Altamente Rentável Academy" width={44} height={44} style={{ borderRadius: 10 }} />
          <strong style={{ fontSize: 15 }}>Altamente Rentável Academy</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ color: "var(--dusty-grey)", fontSize: 13 }}>{sessao.user.email}</span>
          <button onClick={sair} className="chip" style={{ cursor: "pointer", background: "transparent" }}>
            Sair
          </button>
        </div>
      </header>

      {erro ? (
        <div className="cartao" style={{ marginTop: 28, borderColor: "rgba(255,203,0,0.5)" }}>
          <p style={{ fontSize: 15 }}>Não foi possível carregar a vitrine agora ({erro}).</p>
        </div>
      ) : null}

      {!vitrine && !erro ? (
        <>
          <HeroSkeleton />
          <VitrineRow titulo="Seus Learns" carregando />
        </>
      ) : null}

      {vitrine?.hero ? <HeroDestaque card={vitrine.hero} /> : null}

      {vitrine && !vitrine.hero ? (
        <div className="cartao" style={{ marginTop: 28, maxWidth: 640 }}>
          <p style={{ fontSize: 15 }}>
            O catálogo está sendo preparado — os primeiros Learns aparecem
            aqui em breve.
          </p>
          <Link href="/comprar" className="botao-goldenrod" style={{ marginTop: 16 }}>
            Garantir meu acesso →
          </Link>
        </div>
      ) : null}

      {(vitrine?.fileiras ?? []).map((f) => (
        <VitrineRow key={f.chave} titulo={f.titulo} cards={f.cards} />
      ))}
    </main>
  );
}
