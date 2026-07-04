import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { z } from "zod";

const cenaVideoSchema = z.object({
  texto_narrado: z.string(),
  duracao_seg: z.number(),
  visual: z.string(),
});

// Schema explícito (em vez de só uma interface) pra a Composition do
// Remotion conseguir inferir o tipo das props corretamente.
export const learnVideoPropsSchema = z.object({
  titulo: z.string(),
  trilha: z.string(),
  modulo: z.string(),
  cenas: z.array(cenaVideoSchema),
  // Nome do arquivo de áudio da narração já sintetizada (Edge TTS, voz
  // oficial pt-BR-AntonioNeural), dentro da pasta public/ — resolvido
  // com staticFile() dentro do componente (não no script que prepara
  // as props: staticFile() só calcula o prefixo certo quando chamado
  // em contexto de navegador, que é onde o Remotion de fato renderiza;
  // chamado num script Node puro, cai num fallback sem prefixo que não
  // bate com onde o bundler realmente copia a pasta public/). Também
  // aceita uma URL http(s) direta. Sem isso, o vídeo renderiza mudo —
  // nunca com uma voz substituta.
  audioSrc: z.string().optional(),
});

export type CenaVideo = z.infer<typeof cenaVideoSchema>;
export type LearnVideoProps = z.infer<typeof learnVideoPropsSchema>;

export const DURACAO_INTRO_SEG = 5;

export const learnVideoDefaultProps: LearnVideoProps = {
  titulo: "Título de exemplo",
  trilha: "Trilha de exemplo",
  modulo: "Módulo de exemplo",
  cenas: [
    { texto_narrado: "Texto de exemplo.", duracao_seg: 420, visual: "Tela de exemplo." },
  ],
};

// Estilo provisório, só funcional — paleta final (Ouro & Concreto) e
// polimento de animação ficam para o prompt de design separado.
function TituloCard({
  titulo,
  trilha,
  modulo,
}: {
  titulo: string;
  trilha: string;
  modulo: string;
}) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0d0d0d",
        color: "#D4AF37",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        fontFamily: "Arial, Helvetica, sans-serif",
        textAlign: "center",
        padding: "0 80px",
      }}
    >
      <div style={{ fontSize: 22, opacity: 0.8, marginBottom: 16 }}>
        {trilha} / {modulo}
      </div>
      <div style={{ fontSize: 52, fontWeight: 700 }}>{titulo}</div>
    </AbsoluteFill>
  );
}

function CenaView({ cena }: { cena: CenaVideo }) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#111111",
        color: "#f5f5f5",
        justifyContent: "flex-end",
        padding: 60,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ fontSize: 20, opacity: 0.6, marginBottom: 16 }}>{cena.visual}</div>
      <div style={{ fontSize: 34, lineHeight: 1.4 }}>{cena.texto_narrado}</div>
    </AbsoluteFill>
  );
}

export function LearnVideo({ titulo, trilha, modulo, cenas, audioSrc }: LearnVideoProps) {
  const { fps } = useVideoConfig();
  const frameInicioCenas = Math.round(DURACAO_INTRO_SEG * fps);
  let frameAtual = frameInicioCenas;

  const audioResolvido = audioSrc
    ? audioSrc.startsWith("http://") || audioSrc.startsWith("https://")
      ? audioSrc
      : staticFile(audioSrc)
    : undefined;

  return (
    <AbsoluteFill>
      {audioResolvido ? (
        // A narração começa junto da primeira cena, não do card de
        // título (que não tem texto narrado) — sem isso, áudio e vídeo
        // saem 5s fora de sincronia.
        <Sequence from={frameInicioCenas}>
          <Audio src={audioResolvido} />
        </Sequence>
      ) : null}

      <Sequence durationInFrames={Math.round(DURACAO_INTRO_SEG * fps)}>
        <TituloCard titulo={titulo} trilha={trilha} modulo={modulo} />
      </Sequence>

      {cenas.map((cena, indice) => {
        const duracaoFrames = Math.round(cena.duracao_seg * fps);
        const from = frameAtual;
        frameAtual += duracaoFrames;
        return (
          <Sequence key={indice} from={from} durationInFrames={duracaoFrames}>
            <CenaView cena={cena} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
