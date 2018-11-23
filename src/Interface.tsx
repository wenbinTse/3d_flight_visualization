export interface Flyer {
  start: Pos
  end: Pos
  properties: {
    size: number,
    startCity: string,
    endCity: string
  } //存放航班属性
}

export interface City {
  position: Pos
  properties: {
    name: string
    //存放城市属性
  }
}

export type Pos = [number, number]
export type SvgSelction = d3.Selection<SVGSVGElement, {}, HTMLElement, any>
export type CicleSelction = d3.Selection<SVGCircleElement, {}, HTMLElement, any>
export type RectSelction = d3.Selection<SVGRectElement, {}, HTMLElement, any>
export type BaseTypeSelction = d3.Selection<d3.BaseType, {}, HTMLElement, any>
export type PathSelction = d3.Selection<SVGPathElement, {}, SVGGElement, any>
