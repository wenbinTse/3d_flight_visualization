import * as worldJson from './data/world.json'
import * as chinaJson from './data/china.json'
import * as usaJson from './data/us.json'
import * as countryCodeJson from './data/country_code.json'

import * as topojson from 'topojson';
import {Airline, City} from './Interface';
import * as d3 from 'd3'

let id = 0;
let mapMaxId = -1; // The max id used by map(country and province)

const cityToId = new Map();


/* get the map information from JSON file and combine them, then return together

IMPORTANT:
 notice that I use a variable 'id' as the identify of the geoJson object. Since the 'id'
 increases each time it's called, each time we run the project, we should just call this
 function one time and call it before call 'getGeoJsonForAirlines'.
*/
export function getMapGeoData() {
  const countries = (topojson.feature(worldJson as any, worldJson.objects.countries as any) as any)
  .features;
  const land = topojson.feature(worldJson as any, worldJson.objects.land as any);
  const usa = usaJson.features;
  const china = chinaJson.features;

  countries.forEach((d: any) => {
    d.properties.type = 'country';
    d.properties.id = id++;

    const countryId: string = parseInt(d.id).toString(); // example: change '003' to '3'
    d.id = countryId;
    d.properties.name = countryCodeJson[countryId] ? countryCodeJson[countryId].name : 'unknown';
    d.properties.countryId = countryId;
  });
  usa.forEach(d => {
    (d.properties as any).type = 'province';
    (d.properties as any).id = id++
  });
  china.forEach(d => {
    (d.properties as any).type = 'province';
    (d.properties as any).id = id++
  });

  mapMaxId = id;

  return {
    countries,
    land,
    usa,
    china
  }
}

/* use the information from the airlines to generate the geoJson data
 */
export function getGeoJsonForAirlines(airlines: Airline[], cities: City[]) {
  id = mapMaxId
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

  const lines = airlines.map(airline => { return {
    type: 'Feature',
    geometry: {type: 'LineString', coordinates: [airline.start, airline.end]},
    properties: {
      ...airline.properties,
      type: 'airline',
      ballp: Math.random(), // the position of the ball
      distance: d3.geoDistance(airline.start, airline.end),
      id: id++,
      startCityId: cityToId[airline.properties.startCity],
      endCityId: cityToId[airline.properties.endCity]
    }
  }});

  return {
    lines,
    points
  }
}


// get the set of cities from the given airlines
export function getCities(airlines: Airline[]) {
  let cities: City[] = [];
  airlines.forEach(f => {
    cities.push({
      position: f.start,
      properties: {name: f.properties.startCity}
    });
    cities.push({
      position: f.end,
      properties: {name: f.properties.endCity}
    })
  });
  let helper = new Map();
  return cities.filter(c => !helper.get(c.properties.name) && helper.set(c.properties.name, 1))
}
