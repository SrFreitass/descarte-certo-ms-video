import { Config } from '@remotion/cli/config';
import fs from 'fs';

// Navegador usado para renderizar. Por padrão o Remotion baixa o dele; nesta máquina de desenvolvimento
// (Arch Linux) o Chrome do Remotion dá segfault, então usamos o Brave. Em outra máquina:
//   - deixe sem nada (o Remotion baixa o Chrome sozinho), ou
//   - REMOTION_BROWSER=/caminho/do/chrome npm run ...
const browser = process.env.REMOTION_BROWSER ?? (fs.existsSync('/usr/sbin/brave') ? '/usr/sbin/brave' : undefined);
if (browser) Config.setBrowserExecutable(browser);
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
