import React from "react";
import { AbsoluteFill } from "remotion";
import { FONTE, IVORY, OURO } from "../tokens";
import { usePoppins } from "../fontes";
import { FundoImagem } from "./FundoImagem";
import { ICONES_FINANCE } from "./iconesFinance";
import { BarrasOuro, CardCarbon, MiniTabela, SeloPercentual, ToastErro } from "./componentes";

// VITRINE DO BANCO VISUAL — composição interna de conferência (não vai
// para o produto): mostra todos os ícones do banco + os componentes glass
// sobre a camada de fundo 70%, para auditar padrão (stroke 2.2, ouro,
// glassmorphism) num still só.
export const VitrineBanco: React.FC = () => {
  usePoppins();
  const icones = Object.entries(ICONES_FINANCE);
  return (
    <AbsoluteFill>
      <FundoImagem />
      <div style={{ position: "absolute", left: 80, top: 60, fontFamily: FONTE, fontWeight: 700, fontSize: 34, color: OURO, letterSpacing: 4 }}>
        BANCO VISUAL — PREMIUM FINANCE LINE
      </div>

      {/* Grade de ícones (15%) */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 140,
          width: 760,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 26,
        }}
      >
        {icones.map(([nome, Ic]) => (
          <div
            key={nome}
            style={{
              background: "rgba(14,17,19,0.55)",
              backdropFilter: "blur(10px)",
              border: "1.5px solid rgba(212,175,55,0.3)",
              borderRadius: 18,
              padding: "22px 10px 14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Ic tamanho={64} />
            <span style={{ fontFamily: FONTE, fontWeight: 500, fontSize: 17, color: IVORY, opacity: 0.8 }}>{nome}</span>
          </div>
        ))}
      </div>

      {/* Componentes (15%) */}
      <div style={{ position: "absolute", right: 90, top: 140, display: "flex", flexDirection: "column", gap: 30, alignItems: "flex-end" }}>
        <div style={{ display: "flex", gap: 30, alignItems: "flex-start" }}>
          <SeloPercentual valorAlvo={27} rotulo="valorização 3 anos" atraso={0} tamanho={210} />
          <CardCarbon largura={430} atraso={4}>
            <div style={{ fontFamily: FONTE, fontWeight: 600, fontSize: 22, letterSpacing: 3, color: IVORY, opacity: 0.65, textTransform: "uppercase", marginBottom: 16 }}>
              Preço médio do m²
            </div>
            <BarrasOuro valores={[0.42, 0.52, 0.48, 0.66, 0.78, 1]} atraso={8} altura={130} />
          </CardCarbon>
        </div>
        <MiniTabela
          titulo="Comparativo de bairros"
          atraso={10}
          linhas={[
            { rotulo: "Bairro A", valor: "+12%" },
            { rotulo: "Bairro B", valor: "+27%", destaque: true },
            { rotulo: "Bairro C", valor: "+8%" },
          ]}
        />
        <ToastErro texto="Erro comum: comprar sem analisar a vacância" atraso={16} />
      </div>
    </AbsoluteFill>
  );
};
