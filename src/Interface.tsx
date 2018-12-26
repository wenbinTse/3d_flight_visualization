export interface Airline {
  num: number
  start: City
  end: City
}

export interface City {
  name: string
  coordinates: Pos
  state: string
  countryEng: string
  countryChi: string
}

export interface GeoLine {
  type: string
  geometry: {
    type: string
    coordinates: [Pos, Pos]
  }
  properties: {
    type: string
    ballp: number
    distance: number
    id: number
    startCityId: number
    endCityId: number
    num: number
  }
}

export interface GeoPoint {
  type: string
  geometry: {
    type: string
    coordinates: Pos
  }
  properties: {
    id: number,
    type: string,
    state: string,
    countryEng: string,
    countryChi: string,
    name: string
  }
}

export type Pos = [number, number]
export type SvgSelction = d3.Selection<SVGSVGElement, {}, HTMLElement, any>
export type CicleSelction = d3.Selection<SVGCircleElement, {}, HTMLElement, any>
export type RectSelction = d3.Selection<SVGRectElement, {}, HTMLElement, any>
export type BaseTypeSelction = d3.Selection<d3.BaseType, {}, HTMLElement, any>
export type PathSelction = d3.Selection<SVGPathElement, {}, SVGGElement, any>
