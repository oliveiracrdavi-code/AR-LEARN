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

function duracaoTotalEmFrames(props: LearnVideoProps): number {
  const duracaoCenasSeg = props.cenas.reduce((soma, cena) => soma + cena.duracao_seg, 0);
  return Math.round((DURACAO_INTRO_SEG + duracaoCenasSeg) * FPS);
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
