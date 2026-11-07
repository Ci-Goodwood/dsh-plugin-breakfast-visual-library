/* Offline geographic atlas. Coordinates are [longitude, latitude] in degrees.
   Historical eligibility uses period.year; playback time never changes history. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GeoAtlas = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function (root) {
  'use strict';

  const TAU = Math.PI * 2;
  const PALETTES = Object.freeze({
    battle: Object.freeze({ ocean: '#aebfba', land: '#ddd0b3', coast: '#777465', river: '#557986', ink: '#28271e', muted: '#655f50', accent: '#a13f34', labelBg: '#292b27', labelText: '#fff8e9', polity: ['#b49058', '#718f7a', '#a56555', '#6f8996', '#a4986b', '#92829d'] }),
    paper: Object.freeze({ ocean: '#d7e1dc', land: '#eee4cf', coast: '#9c9787', river: '#7598a3', ink: '#302f27', muted: '#777263', accent: '#9b3b31', labelBg: '#30332e', labelText: '#fffaf0', polity: ['#c5aa78', '#98b39c', '#c58f7d', '#98b2be', '#b5ad83', '#b0a0bc'] }),
    night: Object.freeze({ ocean: '#142b34', land: '#344c4e', coast: '#8ca19a', river: '#739eaa', ink: '#f4ead6', muted: '#aab7ae', accent: '#ed7956', labelBg: '#10242c', labelText: '#f4ead6', polity: ['#a98852', '#527961', '#9d665b', '#5d7d91', '#8f8a61', '#7f7094'] }),
  });
  const preparedSet = new WeakSet();
  const caches = new WeakMap();
  const finite = n => typeof n === 'number' && Number.isFinite(n);
  const validColor = s => typeof s === 'string' && /^#[0-9a-f]{6}$/i.test(s);
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const canonical = lon => ((lon + 180) % 360 + 360) % 360 - 180;
  const unwrap = (lon, center) => lon + 360 * Math.round((center - lon) / 360);
  function coordinate(p, label, allowUnwrapped) {
    const limit = allowUnwrapped ? 540 : 180;
    if (!Array.isArray(p) || p.length < 2 || !finite(p[0]) || !finite(p[1]) || p[0] < -limit || p[0] > limit || p[1] < -90 || p[1] > 90) throw new RangeError((label || 'coordinate') + ' must contain finite geographic longitude and latitude -90..90');
    return p;
  }
  function boundsValue(bounds) {
    if (!Array.isArray(bounds) || bounds.length !== 4 || !bounds.every(finite)) throw new TypeError('bounds must be [west,south,east,north]');
    const [west, south, east, north] = bounds;
    if (east <= west || east - west > 360 || south < -90 || north > 90 || north <= south) throw new RangeError('Invalid geographic bounds; use east > 180 for a date-line crossing viewport');
    return bounds.slice();
  }
  function createProjection(bounds, viewport) {
    const b = boundsValue(bounds), v = { x: 0, y: 0, width: 1280, height: 720, ...viewport };
    if (![v.x, v.y, v.width, v.height].every(finite) || v.width <= 0 || v.height <= 0) throw new RangeError('Invalid viewport');
    const center = (b[0] + b[2]) / 2, cosine = Math.max(.05, Math.cos((b[1] + b[3]) / 2 * Math.PI / 180));
    const scale = Math.min(v.width / ((b[2] - b[0]) * cosine), v.height / (b[3] - b[1]));
    const left = v.x + (v.width - (b[2] - b[0]) * cosine * scale) / 2;
    const top = v.y + (v.height - (b[3] - b[1]) * scale) / 2;
    const projectUnwrapped = p => [left + (p[0] - b[0]) * cosine * scale, top + (b[3] - p[1]) * scale];
    return Object.freeze({
      bounds: Object.freeze(b), viewport: Object.freeze(v), scale, cosine, center,
      project(p) {
        coordinate(p);
        // Preserve both sides of a full-world viewport instead of wrapping +180 to -180.
        const lon = p[0] >= b[0] && p[0] <= b[2] ? p[0] : unwrap(p[0], center);
        return projectUnwrapped([lon, p[1]]);
      },
      unproject(p) {
        if (!Array.isArray(p) || p.length < 2 || !finite(p[0]) || !finite(p[1])) throw new TypeError('Finite screen point required');
        return [canonical(b[0] + (p[0] - left) / (cosine * scale)), b[3] - (p[1] - top) / scale];
      },
      // The renderer has already unwrapped continuous paths before calling this.
      projectUnwrapped,
    });
  }
  function finiteNumbers(value, active, depth) {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError('Scene contains a non-finite number');
    if (!value || typeof value !== 'object') return;
    if (depth > 40 || active.has(value)) throw new TypeError('Scene must be acyclic JSON data');
    active.add(value);
    for (const child of Object.values(value)) finiteNumbers(child, active, depth + 1);
    active.delete(value);
  }
  function interval(record, label) {
    for (const key of ['from', 'to']) if (record[key] != null && (!finite(record[key]) || !Number.isInteger(record[key]))) throw new TypeError(label + '.' + key + ' must be an integer year');
    if (record.from != null && record.to != null && record.from > record.to) throw new RangeError(label + ' has a reversed historical interval');
  }
  function eligible(record, year) { return (record.from == null || record.from <= year) && (record.to == null || year <= record.to); }
  function namedRecords(records, label, limit) {
    if (!Array.isArray(records) || records.length > limit) throw new RangeError(label + ' must be an array of at most ' + limit + ' records');
    const ids = new Set();
    for (const record of records) {
      if (!record || typeof record !== 'object' || typeof record.id !== 'string' || !record.id.trim() || ids.has(record.id)) throw new TypeError(label + ' needs unique nonempty IDs');
      ids.add(record.id);
    }
  }
  function lineValue(line, label, ring, allowUnwrapped) {
    if (!Array.isArray(line) || line.length < (ring ? 3 : 2) || line.length > 200000) throw new RangeError(label + ' has too few/many coordinates');
    line.forEach(p => coordinate(p, label, allowUnwrapped));
  }
  function geometryParts(geometry, label) {
    if (!geometry || typeof geometry !== 'object') throw new TypeError(label + ' needs geometry');
    const c = geometry.coordinates, out = [];
    if (geometry.type === 'Polygon') {
      if (!Array.isArray(c) || !c.length) throw new TypeError(label + ' needs polygon rings');
      c.forEach(r => lineValue(r, label, true, true)); out.push({ kind: 'polygon', rings: c });
    } else if (geometry.type === 'MultiPolygon') {
      if (!Array.isArray(c)) throw new TypeError(label + ' needs polygons');
      c.forEach(p => { if (!Array.isArray(p) || !p.length) throw new TypeError(label + ' needs polygon rings'); p.forEach(r => lineValue(r, label, true, true)); out.push({ kind: 'polygon', rings: p }); });
    } else if (geometry.type === 'LineString') { lineValue(c, label, false, true); out.push({ kind: 'line', points: c });
    } else if (geometry.type === 'MultiLineString') {
      if (!Array.isArray(c)) throw new TypeError(label + ' needs line strings');
      c.forEach(l => { lineValue(l, label, false, true); out.push({ kind: 'line', points: l }); });
    } else if (geometry.type === 'GeometryCollection') {
      if (!Array.isArray(geometry.geometries)) throw new TypeError(label + ' needs geometries');
      geometry.geometries.forEach(g => out.push(...geometryParts(g, label)));
    } else throw new TypeError('Unsupported geographic geometry: ' + geometry.type);
    return out;
  }
  function featuresValue(features, label) {
    if (!Array.isArray(features) || features.length > 20000) throw new RangeError(label + ' must be a feature array');
    return features.map((feature, index) => {
      if (!feature || feature.type !== 'Feature') throw new TypeError(label + ' needs GeoJSON Features');
      const properties = feature.properties || {};
      if (typeof properties !== 'object' || Array.isArray(properties)) throw new TypeError(label + ' properties must be an object');
      return { id: feature.id == null ? String(index) : String(feature.id), properties, parts: geometryParts(feature.geometry, label + '[' + index + ']') };
    });
  }
  function prepare(input) {
    if (!input || typeof input !== 'object') throw new TypeError('Scene is required');
    finiteNumbers(input, new Set(), 0);
    const scene = JSON.parse(JSON.stringify(input));
    if (!scene.period || typeof scene.period.id !== 'string' || typeof scene.period.name !== 'string' || !finite(scene.period.year) || !Number.isInteger(scene.period.year)) throw new TypeError('period needs id, name and integer standard year');
    if (!scene.region || typeof scene.region.id !== 'string' || typeof scene.region.name !== 'string') throw new TypeError('region needs id and name');
    scene.region.bounds = boundsValue(scene.region.bounds);
    scene.period.features = scene.period.features || [];
    scene.geography = scene.geography || {};
    const geometry = { polities: featuresValue(scene.period.features, 'period.features') };
    for (const key of ['land', 'lakes', 'rivers']) {
      const fc = scene.geography[key] || { type: 'FeatureCollection', features: [] };
      if (fc.type !== 'FeatureCollection') throw new TypeError('geography.' + key + ' must be a FeatureCollection');
      geometry[key] = featuresValue(fc.features, 'geography.' + key);
    }
    scene.cities = scene.cities || []; scene.routes = scene.routes || []; scene.events = scene.events || [];
    namedRecords(scene.cities, 'cities', 5000); namedRecords(scene.routes, 'routes', 2000); namedRecords(scene.events, 'events', 1000);
    for (const city of scene.cities) {
      if (typeof city.name !== 'string' || !city.name.trim() || [...city.name].length > 100) throw new TypeError('City needs a name');
      coordinate([city.lon, city.lat], 'City'); interval(city, 'City');
      if (city.rank != null && (!finite(city.rank) || city.rank < 0)) throw new RangeError('City rank must be nonnegative');
    }
    for (const route of scene.routes) {
      if (typeof route.name !== 'string' || !['road', 'rail', 'water'].includes(route.kind)) throw new TypeError('Route needs name and road/rail/water kind');
      const source = route.source;
      if (!(typeof source === 'string' && source.trim()) && !(source && typeof source === 'object' && !Array.isArray(source) && (typeof source.title === 'string' && source.title.trim() || typeof source.url === 'string' && source.url.trim()))) throw new TypeError('Route source text or title/url metadata is required');
      interval(route, 'Route'); lineValue(route.points, 'Route', false);
      if (route.points.every(p => p[0] === route.points[0][0] && p[1] === route.points[0][1])) throw new RangeError('Route must have nonzero length');
      if (route.start != null && (!finite(route.start) || route.start < 0)) throw new RangeError('Route animation start must be nonnegative');
      if (route.duration != null && (!finite(route.duration) || route.duration <= 0)) throw new RangeError('Route animation duration must be positive');
    }
    for (const event of scene.events) {
      if (typeof event.title !== 'string' || !event.title.trim() || [...event.title].length > 300) throw new TypeError('Event needs a title');
      coordinate([event.lon, event.lat], 'Event');
      if (event.date != null && typeof event.date !== 'string') throw new TypeError('Event date must be text');
      if (event.icon != null && typeof event.icon !== 'string') throw new TypeError('Event icon must be text');
      if (event.start != null && (!finite(event.start) || event.start < 0)) throw new RangeError('Event start must be nonnegative');
      if (event.duration != null && (!finite(event.duration) || event.duration <= 0)) throw new RangeError('Event duration must be positive');
    }
    preparedSet.add(scene); caches.set(scene, { geometry, views: new Map() });
    return scene;
  }
  function unwrappedLine(points, center) {
    let previous = unwrap(points[0][0], center);
    return points.map((p, i) => { const lon = i ? unwrap(p[0], previous) : previous; previous = lon; return [lon, p[1]]; });
  }
  function projectPart(part, projection) {
    const lines = part.kind === 'polygon' ? part.rings : [part.points];
    const outer = unwrappedLine(lines[0], projection.center);
    const reference = outer.reduce((sum, p) => sum + p[0], 0) / outer.length;
    const unwrapped = [outer, ...lines.slice(1).map(r => unwrappedLine(r, reference))];
    const longitudeRange = unwrapped.reduce((range, ring) => ring.reduce((r, p) => [Math.min(r[0], p[0]), Math.max(r[1], p[0])], range), [Infinity, -Infinity]);
    const minLon = longitudeRange[0], maxLon = longitudeRange[1];
    const first = Math.ceil((projection.bounds[0] - maxLon) / 360), last = Math.floor((projection.bounds[2] - minLon) / 360), results = [];
    for (let shift = first; shift <= last; shift++) {
      const paths = unwrapped.map(r => r.map(p => projection.projectUnwrapped([p[0] + shift * 360, p[1]])));
      const verticalRange = paths.reduce((range, ring) => ring.reduce((r, p) => [Math.min(r[0], p[1]), Math.max(r[1], p[1])], range), [Infinity, -Infinity]);
      const minY = verticalRange[0], maxY = verticalRange[1];
      if (maxY < projection.viewport.y || minY > projection.viewport.y + projection.viewport.height) continue;
      results.push({ kind: part.kind, paths });
    }
    return results;
  }
  function projectedFeature(feature, projection) { return { ...feature, shapes: feature.parts.flatMap(p => projectPart(p, projection)) }; }
  function focusedBounds(bounds, focus) {
    if (!focus) return bounds;
    coordinate([focus.lon, focus.lat], 'Focus');
    const zoom = focus.zoom == null ? 1 : focus.zoom;
    if (!finite(zoom) || zoom < 1 || zoom > 6) throw new RangeError('Focus zoom must be 1..6');
    const halfW = (bounds[2] - bounds[0]) / zoom / 2, halfH = (bounds[3] - bounds[1]) / zoom / 2;
    const centerX = unwrap(focus.lon, (bounds[0] + bounds[2]) / 2), centerY = clamp(focus.lat, -90 + halfH, 90 - halfH);
    return [centerX - halfW, centerY - halfH, centerX + halfW, centerY + halfH];
  }
  function viewFor(scene, opts) {
    const viewport = { x: opts.x == null ? 0 : opts.x, y: opts.y == null ? 0 : opts.y, width: opts.width == null ? 1280 : opts.width, height: opts.height == null ? 720 : opts.height };
    const bounds = focusedBounds(scene.region.bounds, opts.focus), key = JSON.stringify([bounds, viewport]);
    const cache = caches.get(scene);
    if (cache.views.has(key)) return cache.views.get(key);
    const projection = createProjection(bounds, viewport), geometry = {};
    for (const [kind, list] of Object.entries(cache.geometry)) geometry[kind] = list.map(f => projectedFeature(f, projection));
    const routes = scene.routes.map(route => ({ route, shapes: projectPart({ kind: 'line', points: route.points }, projection) }));
    const value = { projection, geometry, routes };
    if (cache.views.size >= 4) cache.views.delete(cache.views.keys().next().value);
    cache.views.set(key, value); return value;
  }
  function drawPaths(ctx, feature, fill, stroke, width) {
    ctx.fillStyle = fill || '#000000'; ctx.strokeStyle = stroke || fill || '#000000'; ctx.lineWidth = width || 1;
    for (const shape of feature.shapes) {
      ctx.beginPath();
      for (const ring of shape.paths) { ctx.moveTo(ring[0][0], ring[0][1]); for (let i = 1; i < ring.length; i++) ctx.lineTo(ring[i][0], ring[i][1]); if (shape.kind === 'polygon') ctx.closePath(); }
      if (fill && shape.kind === 'polygon') ctx.fill('evenodd');
      if (stroke) ctx.stroke();
    }
  }
  function hash(value) { let h = 2166136261; for (const c of String(value)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function inView(p, view, pad) { return p[0] >= view.x - pad && p[0] <= view.x + view.width + pad && p[1] >= view.y - pad && p[1] <= view.y + view.height + pad; }
  function polityAnchor(feature, projection, minimumArea) {
    const p = feature.properties, name = p.label || p.nameZh || p.name_zh || p.name || p.Name || p.NAME || p.name_en || p.NAME_EN;
    if (typeof name !== 'string' || !name.trim()) return null;
    // displayArea is supplied in square degrees. Small enclaves retain their
    // geometry but only gain a label after zoom makes them visually substantial.
    if (finite(p.displayArea) && p.displayArea * projection.cosine * projection.scale * projection.scale < minimumArea) return null;
    if (Array.isArray(p.labelAt)) {
      coordinate(p.labelAt, 'Polity labelAt', true);
      const screen = projection.project([canonical(p.labelAt[0]), p.labelAt[1]]);
      if (inView(screen, projection.viewport, 0)) return { id: feature.id, kind: 'polity', text: name, screen };
    }
    let best = null, bestArea = 0;
    for (const shape of feature.shapes) {
      if (shape.kind !== 'polygon') continue;
      const ring = shape.paths[0]; let twiceArea = 0, X = 0, Y = 0;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]; twiceArea += cross; X += (ring[j][0] + ring[i][0]) * cross; Y += (ring[j][1] + ring[i][1]) * cross; }
      if (Math.abs(twiceArea) < 2) continue;
      const screen = [X / (3 * twiceArea), Y / (3 * twiceArea)];
      if (Math.abs(twiceArea) > bestArea && inView(screen, projection.viewport, 0)) { best = screen; bestArea = Math.abs(twiceArea); }
    }
    return best ? { id: feature.id, kind: 'polity', text: name, screen: best } : null;
  }
  function paintRoute(ctx, shape, progress) {
    const p = shape.paths[0], lengths = [], total = p.slice(1).reduce((sum, point, i) => { const n = sum + Math.hypot(point[0] - p[i][0], point[1] - p[i][1]); lengths.push(n); return n; }, 0);
    if (total <= 0 || progress <= 0) return;
    const distance = total * progress; ctx.beginPath(); ctx.moveTo(...p[0]); let end = p[0], previous = 0;
    for (let i = 1; i < p.length; i++) {
      if (distance >= lengths[i - 1]) { ctx.lineTo(...p[i]); end = p[i]; previous = lengths[i - 1]; continue; }
      const span = lengths[i - 1] - previous, q = span ? (distance - previous) / span : 0;
      end = p[i - 1].map((v, k) => v + (p[i][k] - v) * q); ctx.lineTo(...end); break;
    }
    ctx.stroke();
    if (progress < 1) { ctx.beginPath(); ctx.arc(end[0], end[1], 3, 0, TAU); ctx.fill(); }
  }
  const intersects = (a, b) => a.x < b.x + b.width + 3 && a.x + a.width + 3 > b.x && a.y < b.y + b.height + 3 && a.y + a.height + 3 > b.y;
  function labelsFor(ctx, items, viewport) {
    const placed = [], all = [];
    for (const item of items) {
      const size = item.kind === 'event' ? 22 : item.kind === 'polity' ? 18 : 17, maxWidth = Math.max(45, Math.min(310, viewport.width * .42));
      ctx.font = '600 ' + size + 'px serif'; let value = item.text;
      while (value.length > 1 && ctx.measureText(value).width > maxWidth) value = value.slice(0, -1);
      if (value !== item.text) value = value.slice(0, -1) + '…';
      const width = Math.min(maxWidth, ctx.measureText(value).width) + 14, height = size + 11, x = item.screen[0], y = item.screen[1];
      const candidates = [[x + 12, y - height - 5], [x + 12, y + 6], [x - width - 12, y - height - 5], [x - width - 12, y + 6], [x - width / 2, y - height - 20], [x - width / 2, y + 21], [x - width / 2, y - height - 42], [x - width / 2, y + 43], [x + 30, y - height - 25], [x - width - 30, y - height - 25]];
      let rectangle = null;
      for (const [X, Y] of candidates) {
        const r = { x: clamp(X, viewport.x + 5, viewport.x + viewport.width - width - 5), y: clamp(Y, viewport.y + 5, viewport.y + viewport.height - height - 5), width, height };
        if (r.x < viewport.x || r.y < viewport.y || r.x + width > viewport.x + viewport.width || r.y + height > viewport.y + viewport.height) continue;
        if (!placed.some(p => intersects(r, p))) { rectangle = r; break; }
      }
      if (rectangle) placed.push(rectangle);
      all.push({ ...item, label: rectangle, displayText: value, fontSize: size });
    }
    return all;
  }
  function drawPrepared(ctx, scene, time, options) {
    if (!preparedSet.has(scene)) throw new TypeError('Call GeoAtlas.prepare(scene) before drawing');
    if (!ctx || typeof ctx.save !== 'function' || !finite(time)) throw new TypeError('Canvas context and finite time required');
    const opts = { showCities: true, showRoutes: true, showPolities: true, showPolityLabels: true, animate: true, ...scene.options, ...options };
    const paletteOption = opts.palette || opts.theme || 'battle';
    const palette = typeof paletteOption === 'object' ? { ...PALETTES.battle, ...paletteOption } : PALETTES[paletteOption];
    if (!palette) throw new RangeError('Unknown atlas palette');
    const minimumLabelArea = opts.minPolityLabelArea == null ? 3500 : opts.minPolityLabelArea;
    if (!finite(minimumLabelArea) || minimumLabelArea < 0) throw new RangeError('minPolityLabelArea must be nonnegative');
    const { projection, geometry, routes } = viewFor(scene, opts), viewport = projection.viewport, year = scene.period.year, t = Math.max(0, time);
    const cities = scene.cities.filter(c => eligible(c, year)).map(c => ({ ...c, screen: projection.project([c.lon, c.lat]) }));
    const events = scene.events.map(e => ({ ...e, screen: projection.project([e.lon, e.lat]) }));
    cities.forEach(c => { c.visible = opts.showCities && inView(c.screen, viewport, 0); });
    events.forEach(e => { e.visible = inView(e.screen, viewport, 0) && (!opts.animate || t >= (e.start || 0)); });
    const visibleRoutes = opts.showRoutes ? routes.filter(r => eligible(r.route, year)) : [];
    let labels = [];
    ctx.save();
    try {
      ctx.beginPath(); ctx.rect(viewport.x, viewport.y, viewport.width, viewport.height); ctx.clip();
      ctx.globalCompositeOperation = 'source-over'; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.setLineDash([]);
      ctx.fillStyle = palette.ocean; ctx.fillRect(viewport.x, viewport.y, viewport.width, viewport.height);
      for (const feature of geometry.land) drawPaths(ctx, feature, palette.land, palette.coast, .7);
      if (opts.showPolities) {
        ctx.save(); ctx.globalAlpha *= .64;
        for (const feature of geometry.polities) {
          const p = feature.properties;
          const colorIndex = Number.isInteger(p.paletteIndex) ? ((p.paletteIndex % palette.polity.length) + palette.polity.length) % palette.polity.length : hash(p.name || p.Name || p.NAME || p.NAME_EN || feature.id) % palette.polity.length;
          const color = validColor(p.fill) ? p.fill : validColor(p.color) ? p.color : palette.polity[colorIndex];
          drawPaths(ctx, feature, color, palette.coast, .95);
        }
        ctx.restore();
      }
      for (const feature of geometry.lakes) drawPaths(ctx, feature, palette.ocean, palette.river, .65);
      for (const feature of geometry.rivers) drawPaths(ctx, feature, null, palette.river, .85);
      for (const entry of visibleRoutes) {
        const route = entry.route, color = route.kind === 'water' ? palette.river : palette.accent;
        ctx.save(); ctx.strokeStyle = ctx.fillStyle = color; ctx.lineWidth = route.kind === 'rail' ? 2.8 : 1.6;
        ctx.setLineDash(route.kind === 'road' ? [5, 4] : route.kind === 'rail' ? [9, 3, 2, 3] : []);
        const progress = opts.animate ? clamp((t - (route.start || 0)) / (route.duration || 4), 0, 1) : 1;
        for (const shape of entry.shapes) paintRoute(ctx, shape, progress); ctx.restore();
      }
      ctx.setLineDash([]);
      for (const city of cities.filter(c => c.visible)) { ctx.fillStyle = palette.ink; ctx.beginPath(); ctx.arc(...city.screen, city.rank != null && city.rank <= 1 ? 3.5 : 2.6, 0, TAU); ctx.fill(); }
      const icons = opts.icons || root.VisualIcons;
      for (const event of events.filter(e => e.visible)) {
        const [x, y] = event.screen, phase = opts.animate ? (t - (event.start || 0)) / (event.duration || 2) : 0;
        ctx.save(); ctx.strokeStyle = palette.accent; ctx.fillStyle = palette.accent; ctx.lineWidth = 1.5;
        ctx.globalAlpha *= .42; ctx.beginPath(); ctx.arc(x, y, 10 + (phase % 1) * 14, 0, TAU); ctx.stroke(); ctx.restore();
        if (event.icon && icons && typeof icons.draw === 'function') {
          try { icons.draw(ctx, event.icon, t, { x: x - 20, y: y - 20, size: 40, ink: palette.ink, accent: palette.accent, paper: palette.land, animate: false }); }
          catch (_) { ctx.fillStyle = palette.accent; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); }
        } else { ctx.fillStyle = palette.accent; ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 7, y); ctx.closePath(); ctx.fill(); }
      }
      const cityItems = cities.filter(c => c.visible).sort((a, b) => (a.rank == null ? 4 : a.rank) - (b.rank == null ? 4 : b.rank)).map(c => ({ id: c.id, kind: 'city', text: c.name, screen: c.screen, rank: c.rank }));
      const polityItems = opts.showPolities && opts.showPolityLabels ? geometry.polities.map(f => polityAnchor(f, projection, minimumLabelArea)).filter(Boolean) : [];
      const items = [...events.filter(e => e.visible).map(e => ({ id: e.id, kind: 'event', text: e.title, screen: e.screen })), ...cityItems.filter(c => c.rank != null && c.rank <= 1), ...polityItems, ...cityItems.filter(c => c.rank == null || c.rank > 1)];
      labels = labelsFor(ctx, items, viewport);
      for (const item of labels) {
        const r = item.label; if (!r) continue;
        ctx.strokeStyle = palette.labelBg; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(...item.screen); ctx.lineTo(clamp(item.screen[0], r.x, r.x + r.width), clamp(item.screen[1], r.y, r.y + r.height)); ctx.stroke();
        ctx.fillStyle = palette.labelBg; ctx.fillRect(r.x, r.y, r.width, r.height);
        ctx.fillStyle = palette.labelText; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = '600 ' + item.fontSize + 'px serif'; ctx.fillText(item.displayText, r.x + 7, r.y + r.height / 2);
      }
    } finally { ctx.restore(); }
    const labelMap = new Map(labels.map(l => [l.kind + ':' + l.id, l.label]));
    return { time: t, year, period: scene.period.id, projection, cities: cities.map(c => ({ ...c, label: labelMap.get('city:' + c.id) || null })), events: events.map(e => ({ ...e, label: labelMap.get('event:' + e.id) || null })), routes: visibleRoutes.map(r => r.route.id), labels };
  }
  function createRenderer(ctx, scene, options) { const prepared = prepare(scene), fixed = { ...options }; return { scene: prepared, renderAt: t => drawPrepared(ctx, prepared, t, fixed) }; }
  function normalize(value) { return String(value).normalize('NFKC').toLowerCase().replace(/[\s·•._-]+/g, ''); }
  function resolvePlace(query, places) {
    if (typeof query !== 'string' || !Array.isArray(places)) throw new TypeError('Place query and place array required');
    const q = normalize(query.trim()); if (!q) return [];
    return places.map(p => {
      const names = [p.name, p.id, ...(Array.isArray(p.aliases) ? p.aliases.map(a => typeof a === 'string' ? a : a.name || '') : [])].filter(v => typeof v === 'string').map(normalize);
      return { p, score: names.includes(q) ? 0 : names.some(n => n.includes(q)) ? 1 : 2 };
    }).filter(x => x.score < 2).sort((a, b) => a.score - b.score).map(x => x.p);
  }
  function nearestPeriod(year, periods, region) {
    if (!finite(year) || !Number.isInteger(year) || !Array.isArray(periods)) throw new TypeError('Integer event year and period array required');
    const regionId = typeof region === 'string' ? region : region && region.id;
    if (typeof regionId !== 'string' || !regionId) throw new TypeError('Explicit region is required');
    const hits = periods.filter(p => p && (p.region && typeof p.region === 'object' ? p.region.id : p.region || p.regionId) === regionId && finite(p.year) && Number.isInteger(p.year));
    if (!hits.length) return null;
    const period = hits.reduce((best, p) => Math.abs(p.year - year) < Math.abs(best.year - year) || Math.abs(p.year - year) === Math.abs(best.year - year) && p.year < best.year ? p : best);
    return { period, requestedYear: year, yearDelta: period.year - year, exact: period.year === year };
  }
  return Object.freeze({ palettes: PALETTES, createProjection, prepare, drawPrepared, createRenderer, resolvePlace, nearestPeriod });
});
