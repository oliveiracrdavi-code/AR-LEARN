import React from "react";
import { Composition } from "remotion";
import { ClipeFinance } from "./ClipeFinance";

export const FinanceRoot: React.FC = () => (
  <Composition id="ClipeFinance" component={ClipeFinance} durationInFrames={900} fps={30} width={1920} height={1080} />
);
