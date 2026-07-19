"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSessao } from "@/lib/supabase/useSessao";

type LearnResumo = {
  slug: string;
  titulo: string;
  resumo: string | null;
  duracao_segundos: number | null;
  publicado_at: string | null;
};

// DASHBOARD — área do comprador. A consulta usa a anon key com a sessão
// do usuário: o RLS (learns_select_comprador) devolve SÓ os Learns
// publicados que ele comprou. Zero filtro no client — a policy é o gate.
export default function DashboardPage() {
  const { sessao, carregando } = useSessao();
  const [learns, setLearns] = useState<LearnResumo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!sessao) return;
    const supabase = createBrowserSupabaseClient();
    supabase
      .from("learns")
      .select("slug, titulo, resumo, duracao_segundos, publicado_at")
      .order("ordem", { ascending: true })
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        else setLearns(data ?? []);
      });
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
    <main className="fundo-grid" style={{ minHeight: "100vh", padding: "32px 6vw 64px" }}>
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

      <p className="kicker" style={{ marginTop: 40 }}>Seus Learns</p>
      <h1 style={{ fontWeight: 800, fontSize: "clamp(26px, 4vw, 38px)", marginTop: 8 }}>
        Bem-vindo de volta<span style={{ color: "var(--goldenrod)" }}>.</span>
      </h1>

      {erro ? (
        <div className="cartao" style={{ marginTop: 24, borderColor: "rgba(255,203,0,0.5)" }}>
          <p style={{ fontSize: 15 }}>Não foi possível carregar seus Learns agora ({erro}).</p>
        </div>
      ) : null}

      {learns && learns.length === 0 ? (
        <div className="cartao" style={{ marginTop: 24, maxWidth: 640 }}>
          <p style={{ fontSize: 15 }}>
            Nenhum Learn liberado neste e-mail ainda. Se você acabou de pagar
            via Pix, a liberação leva alguns instantes após a confirmação.
          </p>
          <Link href="/comprar" className="botao-goldenrod" style={{ marginTop: 16 }}>
            Garantir meu acesso →
          </Link>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, marginTop: 24 }}>
        {(learns ?? []).map((l) => (
          <Link key={l.slug} href={`/learns/${l.slug}`} className="cartao" style={{ display: "block" }}>
            <p className="kicker" style={{ fontSize: 11 }}>Learn</p>
            <h2 style={{ fontWeight: 700, fontSize: 20, marginTop: 8 }}>{l.titulo}</h2>
            {l.resumo ? (
              <p style={{ color: "var(--dusty-grey)", fontSize: 14, marginTop: 8 }}>{l.resumo}</p>
            ) : null}
            <p style={{ color: "var(--goldenrod)", fontSize: 13, fontWeight: 600, marginTop: 14 }}>
              Assistir agora →
              {l.duracao_segundos
                ? `  ·  ${Math.round(l.duracao_segundos / 60)} min`
                : ""}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
