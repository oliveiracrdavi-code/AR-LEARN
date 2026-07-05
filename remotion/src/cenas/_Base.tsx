import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR_FUNDO, COR_DESTAQUE, COR_DESTAQUE_FRACO, COR_TEXTO } from "../cores";
import { TextoCinetico } from "../animacao/TextoCinetico";
import { GradeDePontos, Sparkles, CantosDecorativos } from "../animacao/decor";

// Props comuns a toda cena temática: o texto narrado (vira legenda
// cinética embaixo) e a duração total da cena em frames (para as animações
// internas se cronometrarem em relação ao tamanho da cena).
export type PropsCena = {
  texto: string;
  duracaoFrames: number;
};

// Fundo padrão de cena com PROFUNDIDADE 3D REAL (camadas em Z diferentes) +
// câmera "viva" (rotação lenta de poucos graus) + camadas decorativas em
// movimento contínuo. Estrutura de profundidade (seção 3 das diretrizes):
//   - FAR   (translateZ -220): grade de pontos em parallax lento
//   - MID   (translateZ  -90): halo + linhas de apoio + sparkles
//   - NEAR  (translateZ   0 ): o conteúdo da cena (ilustração principal)
//   - FRONT (fixo na tela)   : moldura de cantos + legenda (sempre legível)
// Minimalismo: cada camada é discreta; a hierarquia (principal grande e
// central, apoio pequeno e distante) mantém a tela limpa mesmo com mais
// elementos.
export const FundoCena: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const driftA = Math.sin(frame / 90) * 40;
  const driftB = Math.cos(frame / 70) * 30;
  const brilho = interpolate(Math.sin(frame / 60), [-1, 1], [0.18, 0.4]);

  // Câmera viva: rotação CIRCULAR (X e Y na mesma frequência, defasados
  // 90°) — velocidade angular constante, nunca "estaciona" num extremo
  // (seno sozinho zera a velocidade nos picos e causa quedas de
  // movimento). Poucos graus, lento.
  const angCam = frame / 110;
  const camRotY = Math.sin(angCam) * 1.7;
  const camRotX = Math.cos(angCam) * 1.1;

  return (
    <AbsoluteFill style={{ backgroundColor: COR_FUNDO, overflow: "hidden" }}>
      <AbsoluteFill style={{ perspective: 1600 }}>
        <AbsoluteFill
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${camRotX}deg) rotateY(${camRotY}deg)`,
          }}
        >
          {/* FAR — grade de pontos em parallax */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: "translateZ(-220px) scale(1.16)",
            }}
          >
            <GradeDePontos />
          </div>

          {/* MID — halo difuso + linhas de apoio em parallax (scroll lento
              e CONTÍNUO, a velocidade constante) + sparkles. As linhas
              cheias de largura dão movimento visível confiável sem poluir:
              finas e discretas, só deslizando devagar. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: "translateZ(-90px) scale(1.06)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -300 + driftB,
                right: -200 + driftA,
                width: 900,
                height: 900,
                borderRadius: "50%",
                background: `radial-gradient(circle, rgba(223,160,44,${brilho * 0.25}) 0%, rgba(0,8,20,0) 70%)`,
              }}
            />
            {[0, 1, 2].map((i) => {
              // 3 linhas horizontais deslizando devagar para baixo,
              // enroladas (wrap) — velocidade constante, nunca param.
              const passo = 1200 / 3;
              const y = ((frame * 0.75 + i * passo) % 1200) - 60;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: y,
                    height: 1.5,
                    background: COR_DESTAQUE_FRACO,
                    opacity: 0.9,
                  }}
                />
              );
            })}
            <Sparkles />
          </div>

          {/* NEAR — conteúdo da cena */}
          <AbsoluteFill style={{ transform: "translateZ(0px)" }}>{children}</AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* FRONT — moldura de cantos, fixa na tela (não gira com a câmera) */}
      <CantosDecorativos />
    </AbsoluteFill>
  );
};

// Termo-chave curto (2-4 palavras) reforçando o conceito da cena, com
// tipografia cinética, no topo — dá densidade e âncora semântica sem
// competir com o elemento central nem com a legenda de baixo.
export const TermoChave: React.FC<{ texto: string; delay?: number }> = ({
  texto,
  delay = 4,
}) => {
  const frame = useCurrentFrame();
  const op = 0.55 + (Math.sin(frame / 45) * 0.5 + 0.5) * 0.35;
  return (
    <div
      style={{
        position: "absolute",
        top: 96,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: op,
        }}
      >
        <div style={{ width: 40, height: 1.5, background: COR_DESTAQUE }} />
        <TextoCinetico
          texto={texto.toUpperCase()}
          fontSize={22}
          delay={delay}
          stagger={1.2}
          align="center"
          cor={COR_DESTAQUE}
          peso={700}
          style={{ letterSpacing: 4 }}
        />
        <div style={{ width: 40, height: 1.5, background: COR_DESTAQUE }} />
      </div>
    </div>
  );
};

// Legenda cinética fixa na faixa inferior de toda cena. Usa TextoCinetico
// para o texto narrado "chegar" palavra a palavra (nunca tudo no frame 0).
export const Legenda: React.FC<{ texto: string; delay?: number }> = ({
  texto,
  delay = 6,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 70,
        padding: "0 120px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          borderLeft: `4px solid ${COR_DESTAQUE}`,
          paddingLeft: 28,
        }}
      >
        <TextoCinetico
          texto={texto}
          fontSize={30}
          delay={delay}
          stagger={1.5}
          align="left"
        />
      </div>
    </div>
  );
};

// Área central onde cada cena desenha sua ilustração (acima da legenda).
// Tem um "idle motion" contínuo sutil (flutuação vertical + micro-pulso de
// escala) para o elemento principal nunca ficar 100% estático depois de
// entrar — sem tirar o foco dele.
export const PalcoCentral: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  // Deriva CIRCULAR do elemento principal (velocidade constante, nunca
  // para) — mantém movimento visível contínuo em qualquer cena, sem
  // depender da animação interna dela. Amplitude pequena: sutil, mas o
  // elemento é grande, então muitos pixels mudam a cada frame.
  const ang = frame / 25;
  const flutX = Math.cos(ang) * 26;
  const flutY = Math.sin(ang) * 30;
  const pulso = 1 + Math.sin(frame / 40) * 0.026;
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 260,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translate(${flutX}px, ${flutY}px) scale(${pulso})`,
      }}
    >
      {children}
    </div>
  );
};

// Marca d'água tipográfica de fundo desabilitada por padrão — mantida a
// exportação de COR_TEXTO usada por cenas.
export { COR_TEXTO };
