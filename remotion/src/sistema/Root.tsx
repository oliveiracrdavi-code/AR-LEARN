import React from "react";
import { Composition } from "remotion";
import { CenaHeroiManchete } from "./CenaHeroiManchete";

// Root isolado do Motion System V2 (cena de teste) — não mexe no Root
// principal ainda; serve para validar a direção antes de portar tudo.
export const SistemaRoot: React.FC = () => (
  <Composition
    id="CenaHeroiManchete"
    component={CenaHeroiManchete}
    durationInFrames={180}
    fps={30}
    width={1920}
    height={1080}
  />
);
