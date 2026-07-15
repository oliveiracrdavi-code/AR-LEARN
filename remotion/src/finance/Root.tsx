import React from "react";
import { Composition } from "remotion";
import { ClipeFinance } from "./ClipeFinance";
import { VitrineBanco, VitrineJornada } from "./banco/Vitrine";

export const FinanceRoot: React.FC = () => (
  <>
    <Composition id="ClipeFinance" component={ClipeFinance} durationInFrames={900} fps={30} width={1920} height={1080} />
    {/* Vitrines internas do banco visual (auditoria, não vão pro produto) */}
    <Composition id="VitrineBanco" component={VitrineBanco} durationInFrames={90} fps={30} width={1920} height={1080} />
    <Composition id="VitrineJornada" component={VitrineJornada} durationInFrames={90} fps={30} width={1920} height={1080} />
  </>
);
