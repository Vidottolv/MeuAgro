export const API = 'https://sh.dataspace.copernicus.eu';
export const TOKEN =
  'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
export function imageSpec(geometry) {
  const ring = geometry.coordinates[0],
    xs = ring.map((p) => p[0]),
    ys = ring.map((p) => p[1]);
  const bounds = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const project = ([lon, lat]) => [
    (6378137 * lon * Math.PI) / 180,
    6378137 * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)),
  ];
  const projected = ring.map(project),
    px = projected.map((p) => p[0]),
    py = projected.map((p) => p[1]);
  const factor = Math.cos((((bounds[1] + bounds[3]) / 2) * Math.PI) / 180);
  const meters = [
    (Math.max(...px) - Math.min(...px)) * factor,
    (Math.max(...py) - Math.min(...py)) * factor,
  ];
  const resolution = Math.max(10, ...meters.map((m) => m / 512));
  return {
    bounds,
    geometry: { type: 'Polygon', coordinates: [projected] },
    width: Math.max(1, Math.min(512, Math.ceil(meters[0] / resolution))),
    height: Math.max(1, Math.min(512, Math.ceil(meters[1] / resolution))),
    resolution_m: Math.round(resolution * 10) / 10,
  };
}
export function evalscript(layer) {
  const calculate =
    layer === 'rgb'
      ? 'return [2.5*s.B04,2.5*s.B03,2.5*s.B02,1];'
      : `
    var denominator=s.B08+s.B04;if(denominator<=0)return [0,0,0,0];
    var v=Math.max(-1,Math.min(1,(s.B08-s.B04)/denominator));
    var stops=[[-1,[30,80,160]],[0,[160,90,40]],[0.2,[224,191,70]],[0.5,[113,171,58]],[1,[0,90,38]]];
    for(var i=1;i<stops.length;i++){if(v<=stops[i][0]){var t=(v-stops[i-1][0])/(stops[i][0]-stops[i-1][0]);return [0,1,2].map(function(k){return (stops[i-1][1][k]*(1-t)+stops[i][1][k]*t)/255;}).concat([1]);}}
    return [0,90/255,38/255,1];`;
  return `//VERSION=3
function setup(){return {input:["B02","B03","B04","B08","SCL","dataMask"],output:{bands:4,sampleType:"AUTO"},mosaicking:"SIMPLE"};}
function evaluatePixel(s){if(!s.dataMask || [4,5,6].indexOf(s.SCL)<0)return [0,0,0,0];${calculate}}
`;
}
export function catalogRequest(geometry, day) {
  return {
    intersects: geometry,
    datetime: day + 'T00:00:00Z/' + day + 'T23:59:59Z',
    collections: ['sentinel-2-l2a'],
    limit: 10,
  };
}
export function selectScene(data, day) {
  return (
    (data.features || [])
      .filter(
        (f) =>
          typeof f.id === 'string' &&
          Number.isFinite(Date.parse(f.properties?.datetime)) &&
          f.properties.datetime.slice(0, 10) === day &&
          Number.isFinite(f.properties['eo:cloud_cover']) &&
          f.properties['eo:cloud_cover'] <= 30,
      )
      .sort(
        (a, b) =>
          a.properties['eo:cloud_cover'] - b.properties['eo:cloud_cover'] ||
          b.properties.datetime.localeCompare(a.properties.datetime),
      )[0] || null
  );
}
export function processRequest(spec, scene, layer) {
  const time = Date.parse(scene.properties.datetime);
  return {
    input: {
      bounds: {
        geometry: spec.geometry,
        properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/3857' },
      },
      data: [
        {
          type: 'sentinel-2-l2a',
          dataFilter: {
            timeRange: {
              from: new Date(time - 1000).toISOString(),
              to: new Date(time + 1000).toISOString(),
            },
            mosaickingOrder: 'mostRecent',
            maxCloudCoverage: 30,
          },
        },
      ],
    },
    output: {
      width: spec.width,
      height: spec.height,
      responses: [{ identifier: 'default', format: { type: 'image/png' } }],
    },
    evalscript: evalscript(layer),
  };
}
export function processingUnits(response) {
  const value = response.headers.get('x-processingunits-spent');
  const n = value === null || value.trim() === '' ? NaN : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function sceneSearchRequest(geometry, from, to) {
  return {
    intersects: geometry,
    datetime: from + 'T00:00:00Z/' + to + 'T23:59:59Z',
    collections: ['sentinel-2-l2a'],
    limit: 100,
  };
}
export function sceneSearchResult(data, from, to) {
  const scenes = (Array.isArray(data.features) ? data.features : [])
    .filter(
      (f) =>
        typeof f.id === 'string' &&
        f.id.length <= 250 &&
        typeof f.properties?.datetime === 'string' &&
        Number.isFinite(Date.parse(f.properties.datetime)) &&
        f.properties.datetime.slice(0, 10) >= from &&
        f.properties.datetime.slice(0, 10) <= to &&
        Number.isFinite(f.properties['eo:cloud_cover']) &&
        f.properties['eo:cloud_cover'] >= 0 &&
        f.properties['eo:cloud_cover'] <= 100,
    )
    .slice(0, 100)
    .map((f) => ({
      id: f.id,
      properties: {
        datetime: f.properties.datetime,
        'eo:cloud_cover': f.properties['eo:cloud_cover'],
      },
    }))
    .sort(
      (a, b) =>
        a.properties['eo:cloud_cover'] - b.properties['eo:cloud_cover'] ||
        b.properties.datetime.localeCompare(a.properties.datetime),
    );
  return {
    scenes,
    truncated: !!data.links?.some((l) => l.rel === 'next') || data.features?.length >= 100,
  };
}
