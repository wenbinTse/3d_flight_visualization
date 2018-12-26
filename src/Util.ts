import * as worldJson from './data/world.json'
import * as chinaJson from './data/china.json'
import * as usaJson from './data/us.json'
import * as countryCodeJson from './data/country_code.json'

import * as topojson from 'topojson';
import {Airline, City, GeoLine, GeoPoint, Pos} from './Interface';
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
  id = mapMaxId;
  const points: GeoPoint[] = cities.map(city => {
    cityToId[city.name] = id;
    return {
      type: 'Feature',
      geometry: {type: 'Point', coordinates: city.coordinates},
      properties: {
        ...city,
        type: 'point',
        id: id++
      }
    }
  });

  const lines: GeoLine[] = airlines.map(airline => {
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [airline.start.coordinates, airline.end.coordinates] as [Pos, Pos]
      },
      properties: {
        type: 'airline',
        ballp: Math.random(), // the position of the ball
        distance: d3.geoDistance(airline.start.coordinates, airline.end.coordinates),
        id: id++,
        startCityId: cityToId[airline.start.name],
        endCityId: cityToId[airline.end.name],
        num: airline.num
      }
    }
  });

  return {
    lines,
    points
  }
}


// get the set of cities from the given airlines
export function getCities(airlines: Airline[]): City[] {
  let cities: City[] = [];
  airlines.forEach(airline => {
    cities.push({
      ...airline.start
    });
    cities.push({
      ...airline.end
    })
  });
  let helper = new Map();
  cities = cities.filter(c => !helper.get(c.name) && helper.set(c.name, 1))
  console.log(cities.length);
  return cities
}
