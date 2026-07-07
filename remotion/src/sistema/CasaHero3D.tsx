import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { AMARELO_NUM, LARANJA_NUM, ONYX_NUM } from "./paleta";

// CASA-HERÓI 3D REAL (Three.js/WebGL, não CSS). Casa monocromática amarela
// (cor da marca) — as FACES se diferenciam pela LUZ (telhado, parede frontal
// e lateral pegam intensidades diferentes), então lê como casa sem precisar
// de várias cores. Porta e janelas em onyx recortam a fachada. Ilustra
// LITERALMENTE "comprar imóvel". Entra girando/subindo e ASSENTA; depois um
// respiro mínimo mantém a cena viva (linguagem premium do Vídeo 1).
const GrupoCasa: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ent = spring({ frame, fps, durationInFrames: 26, config: { damping: 200 } });
  const escala = interpolate(ent, [0, 1], [0.45, 0.92]);
  const subida = interpolate(ent, [0, 1], [-2.2, 0]);
  const giroEntrada = interpolate(ent, [0, 1], [-0.8, 0]);

  const bob = Math.sin(frame / 36) * 0.05;
  const sway = Math.sin(frame / 54) * 0.04;

  const parede = { color: AMARELO_NUM, metalness: 0.25, roughness: 0.5 } as const;
  const telhado = { color: AMARELO_NUM, metalness: 0.45, roughness: 0.28 } as const;
  const recorte = { color: ONYX_NUM, metalness: 0.1, roughness: 0.8 } as const;

  return (
    <group position={[0.2, subida + bob, 0]} rotation={[0.08, giroEntrada + 0.35 + sway, 0]} scale={escala}>
      {/* Paredes */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.2, 1.7, 2.2]} />
        <meshStandardMaterial {...parede} />
      </mesh>
      {/* Telhado: pirâmide de 4 águas (cone 4 seg), girada 45° */}
      <mesh position={[0, 1.32, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.78, 1.0, 4]} />
        <meshStandardMaterial {...telhado} />
      </mesh>
      {/* Porta (onyx), na fachada frontal */}
      <mesh position={[0, -0.32, 1.11]}>
        <boxGeometry args={[0.56, 1.02, 0.06]} />
        <meshStandardMaterial {...recorte} />
      </mesh>
      {/* Duas janelas (onyx) ladeando a porta */}
      <mesh position={[-0.66, 0.28, 1.11]}>
        <boxGeometry args={[0.42, 0.42, 0.06]} />
        <meshStandardMaterial {...recorte} />
      </mesh>
      <mesh position={[0.66, 0.28, 1.11]}>
        <boxGeometry args={[0.42, 0.42, 0.06]} />
        <meshStandardMaterial {...recorte} />
      </mesh>
      {/* Fino friso laranja marcando a base da parede (assinatura de cor) */}
      <mesh position={[0, -0.87, 0]}>
        <boxGeometry args={[2.26, 0.12, 2.26]} />
        <meshStandardMaterial color={LARANJA_NUM} metalness={0.4} roughness={0.35} />
      </mesh>
    </group>
  );
};

export const CasaHero3D: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [2.4, 1.35, 7.4], fov: 38 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 8, 5]} intensity={1.6} color={0xffffff} />
      <pointLight position={[-7, -1, 4]} intensity={1.0} color={LARANJA_NUM} />
      <pointLight position={[5, 3, 6]} intensity={0.6} color={AMARELO_NUM} />
      <GrupoCasa />
    </ThreeCanvas>
  );
};
