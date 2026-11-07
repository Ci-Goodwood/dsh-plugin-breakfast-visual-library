const test = require('node:test');
const assert = require('node:assert/strict');
const Atlas = require('../geo-atlas.js');

const polygon = (coordinates, properties = {}) => ({ type: 'Feature', properties, geometry: { type: 'Polygon', coordinates } });
const fc = features => ({ type: 'FeatureCollection', features });
function scene() {
  return {
    period: { id: 'test-1917', name: '标准年1917', year: 1917, features: [polygon([[[20, 35], [55, 35], [55, 65], [20, 65], [20, 35]]], { name: '示例政区' })] },
    region: { id: 'russia', name: '俄国区域', bounds: [15, 30, 195, 80] },
    geography: { land: fc([polygon([[[10, 20], [175, 20], [175, 85], [10, 85], [10, 20]]])]), lakes: fc([]), rivers: fc([{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[25, 40], [35, 50], [42, 60]] } }]) },
    cities: [{ id: 'petrograd', name: '彼得格勒', lon: 30.3158, lat: 59.9391, rank: 1, from: 1914, to: 1923 }, { id: 'future', name: '未来城市', lon: 35, lat: 55, from: 1950 }],
    routes: [
      { id: 'road', name: '道路示意', kind: 'road', from: 1900, to: 1920, points: [[30, 59], [40, 55], [50, 50]], source: 'test fixture' },
      { id: 'future-rail', name: '后建铁路', kind: 'rail', from: 1930, points: [[30, 59], [50, 50]], source: 'test fixture' },
      { id: 'expired-water', name: '已失效水路', kind: 'water', to: 1900, points: [[30, 59], [35, 50]], source: 'test fixture' },
    ],
    events: [{ id: 'event', title: '测试事件', lon: 30.3158, lat: 59.9391, date: '1917-11-07', icon: 'region:flag', start: .5, duration: 2 }],
  };
}
const styleKeys = ['globalAlpha', 'globalCompositeOperation', 'fillStyle', 'strokeStyle', 'lineWidth', 'lineJoin', 'lineCap', 'font', 'textAlign', 'textBaseline'];
class Context {
  constructor() { this.calls = []; this.stack = []; this.dash = [123]; Object.assign(this, { globalAlpha: .73, globalCompositeOperation: 'multiply', fillStyle: '#123456', strokeStyle: '#abcdef', lineWidth: 7, lineJoin: 'bevel', lineCap: 'square', font: '17px serif', textAlign: 'right', textBaseline: 'bottom' }); }
  state() { return Object.fromEntries([...styleKeys.map(k => [k, this[k]]), ['dash', this.dash.slice()]]); }
  save() { this.stack.push(this.state()); }
  restore() { const s = this.stack.pop(); this.dash = s.dash; delete s.dash; Object.assign(this, s); }
  setLineDash(d) { this.dash = d.slice(); this.calls.push(['dash', ...d]); }
  measureText(s) { return { width: [...s].length * 9 }; }
  beginPath() { this.calls.push(['beginPath']); }
  rect(...v) { this.calls.push(['rect', ...v]); }
  clip() { this.calls.push(['clip']); }
  moveTo(...v) { this.calls.push(['moveTo', ...v]); }
  lineTo(...v) { this.calls.push(['lineTo', ...v]); }
  closePath() { this.calls.push(['closePath']); }
  fill(rule) { this.calls.push(['fill', rule || '', this.fillStyle]); }
  stroke() { this.calls.push(['stroke', this.strokeStyle, this.lineWidth]); }
  fillRect(...v) { this.calls.push(['fillRect', ...v, this.fillStyle]); }
  arc(...v) { this.calls.push(['arc', ...v]); }
  fillText(...v) { this.calls.push(['fillText', ...v, this.fillStyle]); }
}
function overlaps(a, b) { return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y; }

test('regional projection preserves aspect and round-trips known places', () => {
  const p = Atlas.createProjection([70, 15, 140, 55], { x: 30, y: 20, width: 1100, height: 650 });
  for (const point of [[116.4074, 39.9042], [121.4737, 31.2304], [70, 15], [140, 55]]) {
    const actual = p.unproject(p.project(point));
    assert(Math.abs(actual[0] - point[0]) < 1e-9); assert(Math.abs(actual[1] - point[1]) < 1e-9);
  }
  assert.throws(() => Atlas.createProjection([140, 15, 70, 55], {}));
  assert.throws(() => Atlas.createProjection([0, -91, 20, 60], {}));
  assert.throws(() => Atlas.createProjection([0, 0, 20, 60], { width: 0 }));
  assert.throws(() => p.project([181, 0]));
  assert.throws(() => p.project([0, NaN]));
});

test('Russian date-line view maps negative far-east longitudes beside positive ones', () => {
  const p = Atlas.createProjection([20, 35, 195, 80], { x: 0, y: 0, width: 1200, height: 700 });
  const west = p.project([175, 60]), east = p.project([-175, 60]);
  assert(east[0] > west[0]); assert(east[0] - west[0] < 100);
  const actual = p.unproject(east); assert(Math.abs(actual[0] + 175) < 1e-9);
  const world = Atlas.createProjection([-180, -90, 180, 90], { width: 1000, height: 500 });
  assert(world.project([180, 0])[0] > world.project([-180, 0])[0]);
});

test('prepare is independent from input and rejects invalid years, geometry, intervals and routes', () => {
  const source = scene(), before = JSON.stringify(source), prepared = Atlas.prepare(source);
  assert.equal(JSON.stringify(source), before); assert.notEqual(source, prepared);
  source.cities[0].name = 'changed'; assert.equal(prepared.cities[0].name, '彼得格勒');
  for (const mutate of [
    s => { s.period.year = NaN; }, s => { s.cities[0].lon = Infinity; },
    s => { s.cities[0].lat = 91; }, s => { s.cities[0].from = 1924; },
    s => { s.routes[0].to = 1899; }, s => { s.routes[0].source = ''; },
    s => { s.routes[0].points = [[10, 10], [10, 10]]; }, s => { s.routes[0].kind = 'invented'; },
    s => { s.events[0].duration = 0; }, s => { s.events[0].start = -1; },
    s => { s.period.features[0].geometry.coordinates = [[[20, 40], [25, 45]]]; },
    s => { s.cities.push({ ...s.cities[0] }); },
  ]) { const s = scene(); mutate(s); assert.throws(() => Atlas.prepare(s)); }
});

test('history uses standard year even while animation time advances', () => {
  const prepared = Atlas.prepare(scene());
  for (const t of [0, .5, 2, 10, 2000]) {
    const result = Atlas.drawPrepared(new Context(), prepared, t);
    assert.equal(result.year, 1917); assert.deepEqual(result.routes, ['road']);
    assert.deepEqual(result.cities.map(c => c.id), ['petrograd']);
    assert.equal(result.events[0].visible, t >= .5);
  }
});

test('rendering clips full geographic paths instead of filtering away outside vertices', () => {
  const source = scene(); source.events = []; source.cities = []; source.routes = []; source.period.features = [];
  source.geography.land = fc([polygon([[[0, 10], [160, 10], [160, 85], [0, 85], [0, 10]], [[60, 45], [80, 45], [80, 55], [60, 55], [60, 45]]])]);
  source.region.bounds = [30, 35, 90, 65];
  const ctx = new Context(); Atlas.drawPrepared(ctx, Atlas.prepare(source), 1, { x: 12, y: 34, width: 600, height: 350 });
  assert.deepEqual(ctx.calls[1], ['rect', 12, 34, 600, 350]); assert.equal(ctx.calls[2][0], 'clip');
  assert(ctx.calls.some(c => c[0] === 'fill' && c[1] === 'evenodd'));
  assert(ctx.calls.some(c => ['moveTo', 'lineTo'].includes(c[0]) && (c[1] < 12 || c[1] > 612 || c[2] < 34 || c[2] > 384)), 'outside vertices must survive until Canvas clipping');
});

test('date-line polygons are unwrapped without artificial world-spanning segments', () => {
  const source = scene(); source.region.bounds = [150, 45, 200, 80]; source.period.features = []; source.events = []; source.cities = []; source.routes = [];
  source.geography.land = fc([polygon([[[170, 55], [-175, 55], [-175, 70], [170, 70], [170, 55]]])]); source.geography.rivers = fc([]);
  const ctx = new Context(); Atlas.drawPrepared(ctx, Atlas.prepare(source), 1, { width: 1000, height: 700 });
  const points = ctx.calls.filter(c => c[0] === 'moveTo' || c[0] === 'lineTo');
  assert(points.length >= 4); const X = points.map(c => c[1]);
  assert(Math.max(...X) - Math.min(...X) < 400);
});

test('caller drawing state is preserved and identical timestamps ignore intervening renders', () => {
  const prepared = Atlas.prepare(scene()), ctx = new Context(), before = ctx.state();
  Atlas.drawPrepared(ctx, prepared, 2, { width: 1100, height: 650, palette: 'night' });
  assert.deepEqual(ctx.state(), before); assert.equal(ctx.stack.length, 0);
  const expected = ctx.calls.slice(); ctx.calls = [];
  Atlas.drawPrepared(ctx, prepared, .1, { width: 1100, height: 650, palette: 'night' }); ctx.calls = [];
  Atlas.drawPrepared(ctx, prepared, 2, { width: 1100, height: 650, palette: 'night' });
  assert.deepEqual(ctx.calls, expected);
  assert.throws(() => Atlas.drawPrepared(ctx, prepared, NaN));
  assert.throws(() => Atlas.drawPrepared(ctx, scene(), 1));
  assert.throws(() => Atlas.drawPrepared(ctx, prepared, 1, { palette: 'missing' }));
  assert.throws(() => Atlas.drawPrepared(ctx, prepared, 1, { focus: { lon: 30, lat: 60, zoom: 7 } }));
});

test('labels have collision-free rectangles and screen anchors follow the returned projection', () => {
  const source = scene(); source.cities.push({ id: 'nearby', name: '相邻城市', lon: 30.4, lat: 60.1, rank: 2 });
  const prepared = Atlas.prepare(source), result = Atlas.drawPrepared(new Context(), prepared, 1, { width: 900, height: 600, focus: { lon: 32, lat: 60, zoom: 4 } });
  const rectangles = result.labels.filter(x => x.label).map(x => x.label);
  assert(rectangles.length >= 2);
  for (let i = 0; i < rectangles.length; i++) for (let j = i + 1; j < rectangles.length; j++) assert(!overlaps(rectangles[i], rectangles[j]));
  assert.deepEqual(result.events[0].screen, result.projection.project([source.events[0].lon, source.events[0].lat]));
  assert(result.events[0].label); assert(result.cities[0].label);
});

test('road, railway and water styles are distinct and visibility toggles retain historical filtering', () => {
  const source = scene(); source.period.year = 1950; source.routes[0].to = 2000; source.routes[2].to = 2000;
  const prepared = Atlas.prepare(source), ctx = new Context(), result = Atlas.drawPrepared(ctx, prepared, 1, { animate: false });
  assert.deepEqual(result.routes, ['road', 'future-rail', 'expired-water']);
  assert(ctx.calls.some(c => c[0] === 'dash' && c.slice(1).join(',') === '5,4'));
  assert(ctx.calls.some(c => c[0] === 'dash' && c.slice(1).join(',') === '9,3,2,3'));
  const off = Atlas.drawPrepared(new Context(), prepared, 1, { showRoutes: false, showCities: false, showPolities: false });
  assert.deepEqual(off.routes, []); assert(off.cities.every(c => !c.visible)); assert(!off.labels.some(l => l.kind === 'polity'));
  const labelOff = Atlas.drawPrepared(new Context(), prepared, 1, { showPolityLabels: false, theme: 'paper', animate: false });
  assert(!labelOff.labels.some(l => l.kind === 'polity')); assert(labelOff.events[0].visible);
});

test('unwrapped snapshot geometry and structured route sources remain usable', () => {
  const source = scene(); source.region.bounds = [150, 45, 200, 80]; source.cities = []; source.events = [];
  source.period.features = [polygon([[[170, 55], [190, 55], [190, 70], [170, 70], [170, 55]]], { Name: '俄罗斯远东', labelAt: [182, 62] })];
  source.routes[0].source = { title: '参考图版', pdfPage: 10, url: 'https://example.org/source' };
  const result = Atlas.drawPrepared(new Context(), Atlas.prepare(source), 1, { showCities: false, width: 1000, height: 700 });
  assert(result.labels.some(l => l.kind === 'polity' && l.text === '俄罗斯远东' && l.label));
});

test('small-polity labels appear only when their projected area warrants a label', () => {
  const source = scene(); source.events = []; source.cities = []; source.routes = [];
  source.period.features[0].properties.displayArea = 10;
  source.period.features[0].properties.labelAt = [37.5, 50];
  const prepared = Atlas.prepare(source), overviewCtx = new Context();
  const overview = Atlas.drawPrepared(overviewCtx, prepared, 1, { width: 1000, height: 700 });
  assert(!overview.labels.some(l => l.kind === 'polity'));
  assert(overviewCtx.calls.some(c => c[0] === 'fill' && c[1] === 'evenodd'), 'small-polity geometry remains visible');
  const focused = Atlas.drawPrepared(new Context(), prepared, 1, { width: 1000, height: 700, focus: { lon: 37.5, lat: 50, zoom: 6 } });
  assert(focused.labels.some(l => l.kind === 'polity' && l.label));
  assert.throws(() => Atlas.drawPrepared(new Context(), prepared, 1, { minPolityLabelArea: -1 }));
});

test('explicit polity palette indexes provide distinct reproducible colors with modulo wrapping', () => {
  const source = scene(); source.cities = []; source.routes = []; source.events = [];
  source.period.features = [0, 1, -1, 7].map((paletteIndex, i) => polygon([[[20 + i * 10, 40], [28 + i * 10, 40], [28 + i * 10, 60], [20 + i * 10, 60], [20 + i * 10, 40]]], { Name: '政区' + i, paletteIndex }));
  const ctx = new Context(); Atlas.drawPrepared(ctx, Atlas.prepare(source), 1, { showPolityLabels: false });
  const fills = ctx.calls.filter(c => c[0] === 'fill' && c[1] === 'evenodd').map(c => c[2]);
  assert.deepEqual(fills.slice(1), [Atlas.palettes.battle.polity[0], Atlas.palettes.battle.polity[1], Atlas.palettes.battle.polity[5], Atlas.palettes.battle.polity[1]]);
});

test('icon drawing is optional and missing icons fall back to geometry', () => {
  const prepared = Atlas.prepare(scene()); let drawn = 0;
  Atlas.drawPrepared(new Context(), prepared, 1, { icons: { draw(ctx, id, t, opts) { drawn++; assert.equal(id, 'region:flag'); assert.equal(opts.animate, false); assert.equal(opts.size, 40); } } });
  assert.equal(drawn, 1);
  assert.doesNotThrow(() => Atlas.drawPrepared(new Context(), prepared, 1, { icons: { draw() { throw new RangeError('missing icon'); } } }));
});

test('place resolver returns every ambiguous match without inventing coordinates', () => {
  const places = [{ id: 'a', name: '彼得格勒', lon: 30.3, lat: 59.9, aliases: ['Petrograd', { name: '圣彼得堡', from: 1703, to: 1914 }] }, { id: 'b', name: '新彼得格勒', lon: 40, lat: 60 }];
  assert.deepEqual(Atlas.resolvePlace('PETROGRAD', places), [places[0]]);
  assert.deepEqual(Atlas.resolvePlace('彼得格勒', places), places);
  assert.equal(Atlas.resolvePlace('不存在的城市', places).length, 0);
  assert.deepEqual(Atlas.resolvePlace('', places), []);
});

test('nearest period stays within region and explicitly reports date mismatch', () => {
  const periods = [{ id: 'eu1914', region: 'europe', year: 1914 }, { id: 'ru1905', region: 'russia', year: 1905 }, { id: 'ru1917', region: { id: 'russia' }, year: 1917 }, { id: 'bad', region: null, year: 1900 }];
  assert.equal(Atlas.nearestPeriod(1914, periods, 'russia').period.id, 'ru1917');
  assert.equal(Atlas.nearestPeriod(1914, periods, 'russia').yearDelta, 3);
  assert.equal(Atlas.nearestPeriod(1917, periods, 'russia').exact, true);
  assert.equal(Atlas.nearestPeriod(1917, periods, 'china'), null);
  assert.throws(() => Atlas.nearestPeriod(1917, periods));
  assert.throws(() => Atlas.nearestPeriod(NaN, periods, 'russia'));
});
