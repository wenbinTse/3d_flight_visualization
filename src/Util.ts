import * as worldJson from './data/world.json'
import * as chinaJson from './data/china.json'
import * as usaJson from './data/us.json'
import * as topojson from 'topojson';
import {Flyer, City, Pos} from './Interface';
import * as d3 from 'd3'

let id = 0;
const cityToId = new Map()

export function getData() {
  const countries = (topojson.feature(worldJson as any, worldJson.objects.countries as any) as any)
  .features;
  const land = topojson.feature(worldJson as any, worldJson.objects.land as any);
  const usa = usaJson.features;
  const china = chinaJson.features;

  countries.forEach((d: any) => {
    d.properties.type = 'country';
    d.properties.id = id++
  });
  usa.forEach(d => {
    (d.properties as any).type = 'province';
    (d.properties as any).id = id++
  });
  china.forEach(d => {
    (d.properties as any).type = 'province';
    (d.properties as any).id = id++
  });

  return {
    countries,
    land,
    usa,
    china
  }
}

export function getGeoJsonForFlyers(flyers: Flyer[], cities: City[]) {
  const points = cities.map(city => {
    cityToId[city.properties.name] = id;
    return {
      type: 'Feature',
      geometry: {type: 'Point', coordinates: city.position},
      properties: {
        ...city.properties,
        type: 'point',
        id: id++
    }
  }});

  const lines = flyers.map(flyer => { return {
    type: 'Feature',
    geometry: {type: 'LineString', coordinates: [flyer.start, flyer.end]},
    properties: {
      ...flyer.properties,
      type: 'flyer',
      ballp: Math.random(), // the postion of the ball
      distance: d3.geoDistance(flyer.start, flyer.end),
      id: id++,
      startCityId: cityToId[flyer.properties.startCity],
      endCityId: cityToId[flyer.properties.endCity]
    }
  }});

  return {
    lines,
    points
  }
}

export function pointEqual(a: Pos, b: Pos) {
  return a[0] == b[0] && a[1] == b[1]
}
