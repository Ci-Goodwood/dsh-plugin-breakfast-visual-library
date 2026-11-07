import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Matches the provider contract shipped by DSH 0.2.1-rc.2 (skill-badge).
// The package uses only Node built-ins; the active profile supplies ctx.skills.
const providerName = 'breakfast-visual-library';
const skillURL = new URL('./skills/breakfast-visual-library/SKILL.md', import.meta.url);
const resourceBase = Object.freeze({
  kind: 'directory',
  path: fileURLToPath(new URL('./skills/breakfast-visual-library/', import.meta.url)),
});
const invocation = Object.freeze({ modelInvocable: true, userInvocable: true });
const candidate = Object.freeze({
  name: 'breakfast-visual-library',
  description: '制作网页、代码动画、视频图层、信息图、图文或商品展示时，检索与复用早餐视觉组件；提供文字与加载动画、图片转场、目标标记、资源和地区图标、引文排版、照片取色、相邻区域配色、地图路径及风格提示词，并可打开完整可交互展览。',
  invocation,
  provider: providerName,
  source: 'bundled',
  resourceBase,
  path: fileURLToPath(skillURL),
  rank: 600,
  locator: skillURL,
});

const provider = Object.freeze({
  name: providerName,
  list: async () => [candidate],
  async get() {
    return {
      name: candidate.name,
      description: candidate.description,
      invocation,
      provider: providerName,
      source: candidate.source,
      resourceBase,
      path: candidate.path,
      content: await readFile(skillURL, 'utf8'),
    };
  },
});

export const name = 'skill-breakfast-visual-library';
export const inject = ['skills'];
export function apply(ctx) {
  ctx.skills.registerProvider(() => provider);
}
