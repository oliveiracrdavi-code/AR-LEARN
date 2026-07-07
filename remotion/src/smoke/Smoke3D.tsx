import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";

const Caixa: React.FC = () => {
  const frame = useCurrentFrame();
  const r = frame * 0.05;
  return (
    <mesh rotation={[r, r * 1.3, 0]}>
      <boxGeometry args={[2.2, 2.2, 2.2]} />
      <meshStandardMaterial color="#F8C848" metalness={0.35} roughness={0.35} />
    </mesh>
  );
};

export const Smoke3D: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#020202" }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[5, 6, 5]} intensity={1.3} />
        <pointLight position={[-6, -3, 4]} intensity={0.9} color="#F2921E" />
        <Caixa />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
