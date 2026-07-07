import React from "react";
import { Composition } from "remotion";
import { Smoke3D } from "./Smoke3D";

export const SmokeRoot: React.FC = () => (
  <Composition id="Smoke3D" component={Smoke3D} durationInFrames={60} fps={30} width={1280} height={720} />
);
