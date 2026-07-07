import React from "react";
import { Img, staticFile } from "remotion";

// Logo REAL (public/logo-ar.jpg — badge preto no amarelo). Nunca um
// monograma genérico. Cantos arredondados como no preview.
export const LogoAR: React.FC<{ largura: number; style?: React.CSSProperties }> = ({ largura, style }) => (
  <Img
    src={staticFile("logo-ar.jpg")}
    style={{
      width: largura,
      height: "auto",
      borderRadius: largura * 0.1,
      boxShadow: "0 18px 60px rgba(248,200,72,0.25)",
      display: "block",
      ...style,
    }}
  />
);
