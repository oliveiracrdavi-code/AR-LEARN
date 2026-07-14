import React from "react";
import { Composition } from "remotion";
import { ClipeFinance } from "./ClipeFinance";
import { VitrineBanco } from "./banco/Vitrine";

export const FinanceRoot: React.FC = () => (
  <>
    <Composition id="ClipeFinance" component={ClipeFinance} durationInFrames={900} fps={30} width={1920} height={1080} />
    {/* Vitrine interna do banco visual (auditoria, não vai pro produto) */}
    <Composition id="VitrineBanco" component={VitrineBanco} durationInFrames={90} fps={30} width={1920} height={1080} />
  </>
);
