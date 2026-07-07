import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { FONTE, AMARELO, LARANJA, BRANCO } from "./tokens";
import { usePoppins } from "./fontes";
import { FundoFinance } from "./FundoFinance";
import { BarraProgresso } from "./BarraProgresso";
import { LogoAR } from "./LogoAR";
import { Kicker, Manchete, Subtitulo, Chip, CardDado, IconePercent, IconeGrade, BotaoCTA, Kinetico } from "./ui";

// CLIPE DE TESTE 30s — Motion System V3 Premium Finance (2D puro).
// Fundo + barra de progresso são CONTÍNUOS; os 5 blocos fazem crossfade.
const KICKER = "MERCADO IMOBILIÁRIO · EPISÓDIO 132";

// Envelope de crossfade: fade-in nos primeiros 14f, fade-out nos últimos
// 14f (exceto no último bloco). Fundo contínuo aparece atrás.
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

export const ClipeFinance: React.FC = () => {
  usePoppins();
  const frame = useCurrentFrame();

  // Glow do fundo acompanha o foco de cada bloco.
  const glowX = interpolate(frame, [0, 90, 270, 540, 720, 900], [0.5, 0.72, 0.72, 0.4, 0.5, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glowY = interpolate(frame, [0, 90, 540, 720, 900], [0.42, 0.28, 0.28, 0.42, 0.42], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <FundoFinance glowX={glowX} glowY={glowY} />

      {/* B1 — ABERTURA 0-3s */}
      <Sequence from={0} durationInFrames={104}>
        <Bloco dur={104}>
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
            <Kinetico atraso={4} dy={34}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <LogoAR largura={420} />
                <div style={{ fontFamily: FONTE, fontWeight: 700, fontSize: 40, letterSpacing: 8, color: BRANCO, marginTop: 40 }}>
                  ALTAMENTE RENTÁVEL
                </div>
                <div style={{ fontFamily: FONTE, fontWeight: 600, fontSize: 26, letterSpacing: 5, color: AMARELO, marginTop: 14, textTransform: "uppercase" }}>
                  {KICKER}
                </div>
              </div>
            </Kinetico>
          </AbsoluteFill>
        </Bloco>
      </Sequence>

      {/* B2 — GANCHO 3-9s */}
      <Sequence from={90} durationInFrames={194}>
        <Bloco dur={194}>
          <LogoTopo />
          <div style={{ position: "absolute", left: 110, top: 250 }}>
            <div style={{ marginBottom: 40 }}><Kicker texto={KICKER} atraso={4} /></div>
            <Manchete
              atrasoBase={10}
              linhas={[
                { texto: "Bairros que vão", peso: 400, tamanho: 96 },
                { texto: "valorizar", cor: AMARELO, peso: 800, tamanho: 150 },
                { texto: "antes de 2027", peso: 400, tamanho: 96 },
              ]}
            />
          </div>
        </Bloco>
      </Sequence>

      {/* B3 — CARD DE DADO 9-18s */}
      <Sequence from={270} durationInFrames={284}>
        <Bloco dur={284}>
          <LogoTopo />
          <div style={{ position: "absolute", left: 110, top: 210 }}>
            <div style={{ marginBottom: 34 }}><Kicker texto={KICKER} atraso={2} /></div>
            <Manchete
              atrasoBase={6}
              linhas={[
                { texto: "Bairros que vão", peso: 400, tamanho: 96 },
                { texto: "valorizar", cor: AMARELO, peso: 800, tamanho: 150 },
                { texto: "antes de 2027", peso: 400, tamanho: 96 },
              ]}
            />
            <div style={{ marginTop: 30 }}>
              <Subtitulo texto="Localização + demanda reprimida = a equação que ninguém está olhando direito" atraso={30} largura={640} />
            </div>
          </div>
          <div style={{ position: "absolute", right: 150, top: 300 }}>
            <div style={{ marginBottom: 20, marginLeft: 20 }}><IconeGrade atraso={26} /></div>
            <CardDado titulo="Valorização 3 anos" valorAlvo={27} prefixo="+" sufixo="%" atraso={34} />
            <div style={{ marginTop: 30, marginLeft: 6 }}>
              <Chip linhas={["3 bairros", "com demanda represada"]} atraso={64} cor={LARANJA} />
            </div>
          </div>
        </Bloco>
      </Sequence>

      {/* B4 — SEGUNDO DADO 18-24s */}
      <Sequence from={540} durationInFrames={194}>
        <Bloco dur={194}>
          <LogoTopo />
          <div style={{ position: "absolute", left: 110, top: 250 }}>
            <div style={{ marginBottom: 34 }}><Kicker texto={KICKER} atraso={2} cor={LARANJA} /></div>
            <Manchete
              atrasoBase={6}
              sublinhado={LARANJA}
              larguraSublinhado={520}
              linhas={[
                { texto: "Cap rate médio", peso: 400, tamanho: 96 },
                { texto: "6,8% ao ano", cor: LARANJA, peso: 800, tamanho: 150 },
              ]}
            />
            <div style={{ marginTop: 30 }}>
              <Subtitulo texto="Acima da média histórica da região nos últimos 5 anos" atraso={26} largura={560} />
            </div>
          </div>
          <div style={{ position: "absolute", right: 300, top: 400 }}>
            <IconePercent tamanho={360} cor={AMARELO} atraso={22} />
          </div>
          <div style={{ position: "absolute", right: 210, bottom: 210 }}>
            <Chip linhas={["janela de entrada", "de 18 meses"]} atraso={40} cor={LARANJA} />
          </div>
        </Bloco>
      </Sequence>

      {/* B5 — ENCERRAMENTO 24-30s */}
      <Sequence from={720} durationInFrames={180}>
        <Bloco dur={180} fadeOut={false}>
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ marginBottom: 26 }}><Kicker texto="RECAPITULANDO" atraso={4} /></div>
              <Kinetico atraso={10}>
                <div style={{ fontFamily: FONTE, fontWeight: 700, fontSize: 92, color: BRANCO, letterSpacing: -1 }}>
                  3 bairros · cap rate 6,8%
                </div>
              </Kinetico>
              <Kinetico atraso={16}>
                <div style={{ fontFamily: FONTE, fontWeight: 400, fontSize: 34, color: "#9A968C", marginTop: 12 }}>
                  janela de 18 meses para entrar
                </div>
              </Kinetico>
              <div style={{ marginTop: 46 }}><Kinetico atraso={24}><LogoAR largura={150} /></Kinetico></div>
              <div style={{ marginTop: 44 }}><BotaoCTA texto="PRÓXIMO LEARN" atraso={34} /></div>
            </div>
          </AbsoluteFill>
        </Bloco>
      </Sequence>

      <BarraProgresso />
    </AbsoluteFill>
  );
};
