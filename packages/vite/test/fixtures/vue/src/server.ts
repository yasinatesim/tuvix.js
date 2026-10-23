import { renderToString } from 'vue/server-renderer';
import { createIsland } from './island';

export { getAssets, renderAssetTags } from 'virtual:tuvix/assets';

export function renderIsland(): Promise<string> {
  return renderToString(createIsland());
}
