"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSessao } from "@/lib/supabase/useSessao";
import { montarRelacionados, type CardLearn } from "@/lib/vitrine/fileiras";
import { VitrineRow } from "@/componentes/vitrine/VitrineRow";

type Learn = {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  duracao_segundos: number | null;
};

type Ativos = {
  video: string | null;
  ebook: string | null;
  mapa: string | null;
};

// LEARN — conteúdo comprado. Dupla proteção: (1) a consulta do learn usa
// a sessão do usuário e o RLS só devolve o que ele comprou; (2) os
// arquivos ficam em bucket PRIVADO e as URLs assinadas saem de
// /api/learns/[slug]/ativos, que revalida a compra com o mesmo token.
// O player grava progresso (progresso_learns, RLS own-only) — é o que
// alimenta "Continue de onde parou" e a barra nos cards da vitrine.
export default function LearnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { sessao, carregando } = useSessao();
  const [learn, setLearn] = useState<Learn | null | "sem_acesso">(null);
  const [ativos, setAtivos] = useState<Ativos | null>(null);
  const [relacionados, setRelacionados] = useState<CardLearn[] | null>(null);
  const ultimoSalvo = useRef(0);

  useEffect(() => {
    if (!sessao) return;
    const supabase = createBrowserSupabaseClient();
    supabase
      .from("learns")
      .select("id, slug, titulo, resumo, duracao_segundos")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => setLearn(data ?? "sem_acesso"));

    fetch(`/api/learns/${slug}/ativos`, {
      headers: { Authorization: `Bearer ${sessao.access_token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setAtivos(json))
      .catch(() => setAtivos(null));

    montarRelacionados(slug).then(setRelacionados).catch(() => setRelacionados([]));
  }, [sessao, slug]);

  async function salvarProgresso(video: HTMLVideoElement, forcar = false) {
    if (!sessao || !learn || learn === "sem_acesso") return;
    const agora = Date.now();
    if (!forcar && agora - ultimoSalvo.current < 10_000) return; // throttle 10s
    ultimoSalvo.current = agora;
    const duracao = Math.round(video.duration || learn.duracao_segundos || 0);
    await createBrowserSupabaseClient()
      .from("progresso_learns")
      .upsert(
        {
          usuario_id: sessao.user.id,
          learn_id: learn.id,
          segundos_assistidos: Math.round(video.currentTime),
          duracao_segundos: duracao || null,
          concluido: duracao > 0 && video.currentTime / duracao > 0.97,
          atualizado_at: new Date().toISOString(),
        },
        { onConflict: "usuario_id,learn_id" }
      );
  }

  if (carregando || (sessao && learn === null)) {
    return (
      <main className="fundo-grid" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--dusty-grey)" }}>Carregando...</p>
      </main>
    );
  }

  if (!sessao || learn === "sem_acesso") {
    return (
      <main className="fundo-grid" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 6vw" }}>
        <div className="cartao" style={{ maxWidth: 480, textAlign: "center" }}>
          <h1 style={{ fontWeight: 800, fontSize: 24 }}>
            Conteúdo <span style={{ color: "var(--goldenrod)" }}>exclusivo</span>
          </h1>
          <p style={{ color: "var(--dusty-grey)", marginTop: 10, fontSize: 15 }}>
            {sessao
              ? "Este Learn não está liberado para o seu e-mail."
              : "Entre com o e-mail da sua compra para acessar."}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
            {sessao ? (
              <Link href="/comprar" className="botao-goldenrod">Comprar acesso →</Link>
            ) : (
              <Link href="/entrar" className="botao-goldenrod">Entrar na Academy →</Link>
            )}
            <Link href="/dashboard" className="chip">Meus Learns</Link>
          </div>
        </div>
      </main>
    );
  }

  const l = learn as Learn;
  return (
    <main style={{ minHeight: "100vh", padding: "32px 6vw 80px", background: "var(--black)" }}>
      <Link href="/dashboard" style={{ color: "var(--dusty-grey)", fontSize: 14 }}>
        ← Meus Learns
      </Link>
      <p className="kicker" style={{ marginTop: 28 }}>Learn</p>
      <h1 style={{ fontWeight: 800, fontSize: "clamp(26px, 4vw, 40px)", marginTop: 8, maxWidth: 900 }}>
        {l.titulo}
      </h1>
      {l.resumo ? (
        <p style={{ color: "var(--dusty-grey)", fontSize: 16, marginTop: 12, maxWidth: 760 }}>{l.resumo}</p>
      ) : null}

      {/* Vídeo: streaming apenas, sem link de download (decisão de
          produto consciente, não pendência) — mesmo padrão de
          plataformas de curso/streaming (Netflix, a própria referência
          da vitrine): reduz pirataria fácil de "salvar e repassar" sem
          atrapalhar quem está só assistindo. Ebook e mapa mental, que
          são material de apoio pra guardar/imprimir, têm download real
          (Content-Disposition: attachment na signed URL). */}
      <div className="cartao" style={{ marginTop: 28, padding: 0, overflow: "hidden", maxWidth: 1080 }}>
        {ativos?.video ? (
          <video
            controls
            style={{ width: "100%", display: "block" }}
            src={ativos.video}
            poster="/logo-ar-amarelo.jpg"
            onTimeUpdate={(e) => salvarProgresso(e.currentTarget)}
            onPause={(e) => salvarProgresso(e.currentTarget, true)}
            onEnded={(e) => salvarProgresso(e.currentTarget, true)}
          />
        ) : (
          <div style={{ padding: 40, textAlign: "center" }}>
            <p style={{ color: "var(--dusty-grey)", fontSize: 15 }}>
              O vídeo deste Learn está sendo preparado — volte em instantes.
            </p>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap" }}>
        {ativos?.ebook ? (
          <a href={ativos.ebook} download rel="noreferrer" className="botao-goldenrod">
            Baixar o Ebook →
          </a>
        ) : (
          <span className="chip">Ebook em preparação</span>
        )}
        {ativos?.mapa ? (
          <a href={ativos.mapa} download rel="noreferrer" className="chip">
            Baixar mapa mental
          </a>
        ) : null}
      </div>

      {/* Nunca beco sem saída: sempre há um próximo passo de consumo. */}
      {relacionados && relacionados.length > 0 ? (
        <VitrineRow titulo="Continue explorando" cards={relacionados} />
      ) : null}
    </main>
  );
}
