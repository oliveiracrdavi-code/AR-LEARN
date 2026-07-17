import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { AMARELO, BRANCO, CARD_BG, CARD_BORDA, CINZA_TEXTO, FONTE, LARANJA } from "../tokens";
import { usePoppins } from "../fontes";
import { FundoFinance } from "../FundoFinance";
import { BarraProgresso } from "../BarraProgresso";
import { LogoAR } from "../LogoAR";
import { Kicker, Manchete, Subtitulo, Kinetico, BotaoCTA, Chip } from "../ui";
import { TimelineJornada, CardCitacao, ToastErro } from "../banco/componentes";
import { DonutOuro, FormulaCard, BadgeContexto, IconeAnimado, LegendaSincronizada } from "./componentesLongo";
import { EPISODIO, SECOES, TOTAL_FRAMES, Secao } from "./dados";

// VÍDEO LONGO 16:9 (ep. 171) — EXTENSÃO EXATA do clipe de 30s aprovado:
// mesma paleta/tokens, mesmo fundo (grid+glow), mesma manchete à esquerda
// + visual à direita, mesma barra de progresso global (frame/total, nunca
// reseta). O que muda é a DENSIDADE: mais componentes do banco, cada um
// com animação própria e contextual.

const Bloco: React.FC<{ dur: number; fadeOut?: boolean; children: React.ReactNode }> = ({ dur, fadeOut = true, children }) => {
  const frame = useCurrentFrame();
  const fin = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const fout = fadeOut ? interpolate(frame, [dur - 14, dur], [1, 0], { extrapolateLeft: "clamp" }) : 1;
  return <AbsoluteFill style={{ opacity: Math.min(fin, fout) }}>{children}</AbsoluteFill>;
};

const LogoTopo: React.FC = () => (
  <div style={{ position: "absolute", top: 70, right: 96 }}>
    <LogoAR largura={128} />
  </div>
);

// Card de dado do vídeo longo: mesmo "vidro escuro + borda fina + dado
// gigante goldenrod + bar chart" do clipe, mas exibindo faixas/moeda
// literais (35-40%, R$ 45.000) com wipe de revelação + barras em spring.
const CardDadoLongo: React.FC<{ label: string; valorTexto: string; contexto: string; atraso?: number }> = ({
  label,
  valorTexto,
  contexto,
  atraso = 0,
}) => {
  const frame = useCurrentFrame();
  const ent = interpolate(frame, [atraso, atraso + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const wipe = interpolate(frame, [atraso + 10, atraso + 34], [100, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const barras = [0.42, 0.52, 0.46, 0.62, 0.7, 1];
  return (
    <div
      style={{
        width: 620,
        background: CARD_BG,
        border: `2px solid ${CARD_BORDA}`,
        borderRadius: 26,
        padding: "38px 44px",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        opacity: ent,
        transform: `translateY(${(1 - ent) * 40}px)`,
        fontFamily: FONTE,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 26, letterSpacing: 3, color: CINZA_TEXTO, textTransform: "uppercase" }}>{label}</div>
      <div
        style={{
          fontWeight: 800,
          fontSize: valorTexto.length >= 9 ? 84 : valorTexto.length >= 7 ? 96 : 118,
          whiteSpace: "nowrap",
          color: AMARELO,
          lineHeight: 1.05,
          marginTop: 10,
          clipPath: `inset(0 ${wipe}% 0 0)`,
        }}
      >
        {valorTexto}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 120, marginTop: 24 }}>
        {barras.map((h, i) => {
          const cresce = interpolate(frame, [atraso + 12 + i * 4, atraso + 32 + i * 4], [0, h], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return <div key={i} style={{ flex: 1, height: `${cresce * 100}%`, background: i === barras.length - 1 ? AMARELO : "#2C3033", borderRadius: 10 }} />;
        })}
      </div>
      <div style={{ marginTop: 22, fontWeight: 600, fontSize: 24, color: LARANJA, letterSpacing: 1 }}>{contexto}</div>
    </div>
  );
};

// BOTÃO CTA do encerramento v2: pill goldenrod (amarelo do clipe) com
// texto em black, entrada fade + scale SUTIL, permanece até o fim.
const BotaoVerEpisodio: React.FC<{ atraso?: number }> = ({ atraso = 0 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [atraso, atraso + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        marginTop: 40,
        display: "inline-flex",
        alignItems: "center",
        gap: 16,
        background: AMARELO,
        color: "#020202",
        fontFamily: FONTE,
        fontWeight: 700,
        fontSize: 34,
        letterSpacing: 1,
        padding: "26px 64px",
        borderRadius: 999,
        boxShadow: "0 18px 60px rgba(248,200,72,0.45)",
        opacity: p,
        transform: `scale(${0.92 + 0.08 * p})`,
      }}
    >
      Ver Episódio Completo <span style={{ fontSize: 34 }}>&rarr;</span>
    </div>
  );
};

const linhasManchete = (s: Secao) =>
  (s.linhas ?? []).map((l) => ({ texto: l.texto, cor: l.cor === "amarelo" ? AMARELO : BRANCO, peso: l.peso, tamanho: l.tamanho }));

// ---- Layouts por tipo de seção ----
const CorpoSecao: React.FC<{ s: Secao; indice: number }> = ({ s, indice }) => {
  switch (s.tipo) {
    case "intro":
      return (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <Kinetico atraso={6} dy={34}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <LogoAR largura={420} />
              <div style={{ fontFamily: FONTE, fontWeight: 700, fontSize: 44, letterSpacing: 8, color: BRANCO, marginTop: 42 }}>ALTAMENTE RENTÁVEL</div>
              <div style={{ fontFamily: FONTE, fontWeight: 600, fontSize: 27, letterSpacing: 5, color: AMARELO, marginTop: 16, textTransform: "uppercase" }}>{EPISODIO.kicker}</div>
              <div style={{ fontFamily: FONTE, fontWeight: 500, fontSize: 34, color: CINZA_TEXTO, marginTop: 30, maxWidth: 900, textAlign: "center" }}>{EPISODIO.titulo}</div>
            </div>
          </Kinetico>
        </AbsoluteFill>
      );
    case "headline":
      return (
        <>
          <LogoTopo />
          <div style={{ position: "absolute", left: 110, top: 230 }}>
            <div style={{ marginBottom: 40 }}><Kicker texto={EPISODIO.kicker} atraso={4} /></div>
            <Manchete atrasoBase={10} linhas={linhasManchete(s)} />
          </div>
          <div style={{ position: "absolute", right: 170, top: 300, display: "flex", flexDirection: "column", gap: 46, alignItems: "center" }}>
            <IconeAnimado nome="nota" variante="desenhar" atraso={20} tamanho={170} />
            <IconeAnimado nome="calendario" variante="subir" atraso={38} tamanho={150} />
            <IconeAnimado nome="localizacao" variante="pulsar" atraso={56} tamanho={150} cor={LARANJA} />
          </div>
        </>
      );
    case "dado": {
      const d = s.dado!;
      return (
        <>
          <LogoTopo />
          <div style={{ position: "absolute", left: 110, top: 240 }}>
            <div style={{ marginBottom: 36 }}><Kicker texto={EPISODIO.kicker} atraso={2} /></div>
            <Manchete atrasoBase={6} linhas={linhasManchete(s)} />
            <div style={{ marginTop: 44 }}>
              <BadgeContexto icone={d.icone} texto={d.contexto} atraso={40} />
            </div>
          </div>
          <div style={{ position: "absolute", right: 130, top: d.donut ? 200 : 280, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
            <CardDadoLongo label={d.label} valorTexto={d.faixaTexto ?? String(d.valor)} contexto={d.contexto} atraso={18} />
            {d.donut ? <DonutOuro pct={d.donut.pct} rotulo={d.donut.rotulo} atraso={46} tamanho={190} /> : null}
          </div>
        </>
      );
    }
    case "erros":
      return (
        <>
          <LogoTopo />
          <div style={{ position: "absolute", left: 110, top: 260 }}>
            <div style={{ marginBottom: 36 }}><Kicker texto={EPISODIO.kicker} atraso={2} cor={LARANJA} /></div>
            <Manchete atrasoBase={6} linhas={linhasManchete(s)} sublinhado={LARANJA} />
          </div>
          <div style={{ position: "absolute", right: 120, top: 300, display: "flex", flexDirection: "column", gap: 30, alignItems: "flex-end" }}>
            <ToastErro texto="Comprar sem analisar a vacância" atraso={20} />
            <ToastErro texto="Ignorar o custo de manutenção" atraso={40} />
            <ToastErro texto="Esquecer o prazo de revenda" atraso={60} />
          </div>
        </>
      );
    case "transicao":
      return (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 44 }}>
            <Kicker texto="A PERGUNTA CERTA" atraso={2} />
            <Kinetico atraso={8}>
              <div style={{ fontFamily: FONTE, fontWeight: 700, fontSize: 74, color: BRANCO, textAlign: "center", maxWidth: 1200 }}>
                Onde <span style={{ color: AMARELO }}>você</span> está na jornada?
              </div>
            </Kinetico>
            <div style={{ display: "flex", gap: 90, marginTop: 16 }}>
              <IconeAnimado nome={s.icones![0]} variante="desenhar" atraso={16} tamanho={110} />
              <IconeAnimado nome={s.icones![1]} variante="pulsar" atraso={26} tamanho={110} />
              <IconeAnimado nome={s.icones![2]} variante="subir" atraso={36} tamanho={110} cor={LARANJA} />
            </div>
          </div>
        </AbsoluteFill>
      );
    case "deep_dive":
      return (
        <>
          <LogoTopo />
          <div style={{ position: "absolute", left: 110, top: 130 }}>
            <Kicker texto="JORNADA DO INVESTIDOR" atraso={2} />
          </div>
          <div style={{ position: "absolute", left: 110, top: 250 }}>
            <TimelineJornada
              ativa={2}
              largura={1500}
              corDestaque={AMARELO}
              corTexto={BRANCO}
              atraso={10}
              etapas={[
                { icone: "bandeira", titulo: "Começo", descricao: "Organize as finanças e crie a reserva.", chip: "0–12 MESES" },
                { icone: "moedas", titulo: "Consolidação", descricao: "Invista com consistência e diversifique.", chip: "1–3 ANOS" },
                { icone: "grafico_linha", titulo: "Crescimento", descricao: "Os investimentos trabalham por você.", chip: "3–10 ANOS" },
                { icone: "casa", titulo: "Independência", descricao: "A renda passiva cobre seus custos.", chip: "10–20 ANOS" },
                { icone: "diamante", titulo: "Liberdade", descricao: "Tempo e escolhas para viver como quiser.", chip: "20+ ANOS" },
              ]}
            />
          </div>
          <div style={{ position: "absolute", left: 110, bottom: 200 }}>
            <FormulaCard atraso={150} largura={760} />
          </div>
          <div style={{ position: "absolute", right: 140, bottom: 230 }}>
            <BadgeContexto icone="chave" texto="A bússola de toda etapa" atraso={175} cor={AMARELO} />
          </div>
        </>
      );
    case "recap":
      return (
        <>
          <LogoTopo />
          <div style={{ position: "absolute", left: 110, top: 220 }}>
            <div style={{ marginBottom: 34 }}><Kicker texto="RECAPITULANDO" atraso={2} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
              {[
                { t: "Entrada 35-40%", c: "Crítica", i: "cofre" },
                { t: "Recorrência +20-25%", c: "Determinante", i: "calendario" },
                { t: "Custo m² R$ 45.000", c: "Referência", i: "concluido" },
              ].map((x, i) => (
                <Kinetico key={i} atraso={14 + i * 10}>
                  <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <IconeAnimado nome={x.i} variante="desenhar" atraso={16 + i * 10} tamanho={64} />
                    <div style={{ fontFamily: FONTE }}>
                      <div style={{ fontWeight: 700, fontSize: 46, color: BRANCO }}>{x.t}</div>
                      <div style={{ fontWeight: 600, fontSize: 24, color: LARANJA, letterSpacing: 1 }}>{x.c}</div>
                    </div>
                  </div>
                </Kinetico>
              ))}
            </div>
          </div>
          <div style={{ position: "absolute", right: 120, top: 300 }}>
            <CardCitacao
              corDestaque={AMARELO}
              largura={560}
              atraso={40}
              texto="Essa é a conta que separa o investidor do apostador."
              autor="A.R. · Episódio 171"
            />
          </div>
        </>
      );
    case "cta":
      // v2 (15s exatos): CTA goldenrod prioritário (entra em ~1s, visível
      // ~14s), recap compacto dos 3 dados em chips, logo. Fade+scale sutil
      // no botão (mesma linguagem 2D determinística).
      return (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <Kinetico atraso={4}>
              <div style={{ fontFamily: FONTE, fontWeight: 700, fontSize: 70, color: BRANCO, maxWidth: 1300 }}>
                Faça a conta <span style={{ color: AMARELO }}>antes</span> do mercado.
              </div>
            </Kinetico>
            <div style={{ marginTop: 30, display: "flex", gap: 22 }}>
              {["Entrada 35-40%", "Recorrência +20-25%", "m² R$ 45.000"].map((t, i) => (
                <Kinetico key={i} atraso={12 + i * 4}>
                  <div style={{ fontFamily: FONTE, fontWeight: 600, fontSize: 24, color: BRANCO, border: "2px solid rgba(255,255,255,0.22)", borderRadius: 999, padding: "10px 26px" }}>
                    {t}
                  </div>
                </Kinetico>
              ))}
            </div>
            <div style={{ marginTop: 36 }}><Kinetico atraso={18}><LogoAR largura={130} /></Kinetico></div>
            <BotaoVerEpisodio atraso={26} />
          </div>
        </AbsoluteFill>
      );
  }
};

export const VideoLongo: React.FC = () => {
  usePoppins();
  const frame = useCurrentFrame();
  // Glow do fundo deriva lentamente ao longo do vídeo inteiro.
  const glowX = interpolate(Math.sin(frame / 900), [-1, 1], [0.32, 0.7]);
  const glowY = interpolate(Math.cos(frame / 1100), [-1, 1], [0.24, 0.45]);

  let inicio = 0;
  const seqs = SECOES.map((s, i) => {
    const from = inicio;
    inicio += s.frames;
    return { s, from, i };
  });

  return (
    <AbsoluteFill>
      <FundoFinance glowX={glowX} glowY={glowY} />
      {seqs.map(({ s, from, i }) => (
        <Sequence key={i} from={from} durationInFrames={s.frames}>
          <Bloco dur={s.frames} fadeOut={i < SECOES.length - 1}>
            <CorpoSecao s={s} indice={i} />
            <LegendaSincronizada narracao={s.narracao} duracaoFrames={s.frames} />
          </Bloco>
        </Sequence>
      ))}
      <BarraProgresso />
    </AbsoluteFill>
  );
};

export { TOTAL_FRAMES };
