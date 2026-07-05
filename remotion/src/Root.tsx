import { Composition } from "remotion";
import {
  LearnVideo,
  learnVideoDefaultProps,
  learnVideoPropsSchema,
  DURACAO_INTRO_SEG,
  type LearnVideoProps,
} from "./LearnVideo";

const FPS = 30;
const LARGURA = 1920;
const ALTURA = 1080;

// Soma de frames por cena arredondados por cena (não a soma de segundos
// depois arredondada) — casa exatamente com o total da TransitionSeries
// em LearnVideo, onde cada cena usa Math.round(duracao_seg*fps) e o
// padding das transições se cancela. Evita cortar/sobrar 1 frame no fim.
function duracaoTotalEmFrames(props: LearnVideoProps): number {
  const introFrames = Math.round(DURACAO_INTRO_SEG * FPS);
  const framesCenas = props.cenas.reduce(
    (soma, cena) => soma + Math.round(cena.duracao_seg * FPS),
    0
  );
  return introFrames + framesCenas;
}

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="LearnVideo"
      component={LearnVideo}
      schema={learnVideoPropsSchema}
      fps={FPS}
      width={LARGURA}
      height={ALTURA}
      durationInFrames={duracaoTotalEmFrames(learnVideoDefaultProps)}
      defaultProps={learnVideoDefaultProps}
      calculateMetadata={async ({ props }: { props: LearnVideoProps }) => ({
        durationInFrames: duracaoTotalEmFrames(props),
      })}
    />
  );
};
