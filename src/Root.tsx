import { Composition } from 'remotion';
import { Promo, DURATION } from './Promo';
import { Intro, INTRO_DURATION } from './Intro';
import { Final } from './Final';
import { FINAL_DURATION } from './finalScenes';

export const Root: React.FC = () => (
  <>
    <Composition id="Intro" component={Intro} durationInFrames={INTRO_DURATION} fps={30} width={1920} height={1080} />
    <Composition id="Final" component={Final} durationInFrames={FINAL_DURATION} fps={30} width={1920} height={1080} />
    <Composition id="Promo" component={Promo} durationInFrames={DURATION} fps={30} width={1920} height={1080} />
  </>
);
