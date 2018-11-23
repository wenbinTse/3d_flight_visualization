import * as React from 'react';
import * as wordJson from './world.json'
import './App.css';
import * as chinaJson from './data/china.json'
import * as usJson from './data/us.json'

import { event } from 'd3'
import * as d3 from 'd3'
import { Flyer, Pos, CicleSelction, PathSelction, SvgSelction, RectSelction, City } from './Interface.js';

/*
  一些小问题：
    加载了美国地图后，旋转性能降低
    现在是双击中国和美国显示各自的细节，之后可能需要通过放大来显示
    二维地图我不确定用哪种投影方式
*/


interface Props {
  // interface
  width: number
  height: number
  flyers: Flyer[]
  cities: City[]
}

var scaleChangeSpeed = [1.05, 0.95]
const CHINA = 'China', US = 'United States'

class Earth extends React.Component<Props, {}> {
  
  projection = d3.geoOrthographic()
  path = d3.geoPath(this.projection)
  features: d3.Selection<d3.BaseType, {}, SVGSVGElement, {}>
  m0: any; o0: [number, number, number] = [0, 0, 0]; t0: [number, number]; scaleFactor = 1
  map:  SvgSelction
  lines: PathSelction
  width: number
  height: number
  rotateTimer?: number
  
  ocean3D: CicleSelction
  ocean2D: RectSelction
  showChina = false
  showUS = false
  china?: PathSelction
  us?: PathSelction
  cities: any

  threeD: boolean = true

  constructor(props: Props) {
    super(props)
    this.width = this.props.width
    this.height = this.props.height
  }

  componentDidMount = () => {
    this.init()
    this.drawLine()
  }

  render = () => {
    return (
      <div>
        <div id='map-container'>
          <svg id='map' height={this.props.height} width={this.props.width}>
            <defs>
              <radialGradient id='ocean_fill' cx='75%' cy='75%'>
                <stop offset='5%' stopColor='#fff'/>
                <stop offset='100%' stopColor='#ababab'/>
              </radialGradient>
              <linearGradient id='line_color' x1='0%' y1='0%' x2='100%'>
                <stop offset='0%' stopColor='#000'/>
                <stop offset='100%' stopColor='#fff'/>
              </linearGradient>
              <filter id='Line_blur'>
                <feGaussianBlur result='blurout' in='SourceGraphic' dx='20' dy='20'/>
                <feBlend in='SourceGraphic' in2='blurout' mode='normal' />
              </filter>
            </defs>
          </svg>
        </div>
        <div className='Button-container'>
          <button onClick={this.changeProjection}>RUN</button>
        </div>
      </div>
    );
  }

  private init = () => {
    d3.select(window)
    .on('mousemove', this.mousemove)
    .on('mouseup', this.mouseup)
    .on('mousewheel', this.mousewheel)
    .on('keyup', this.keyUp)
    
    this.projection.translate([this.width / 2, this.height / 2])

    this.map = (d3.select('#map') as SvgSelction)
    .attr('width', this.width)
    .attr('height', this.height)
    .on('mousedown', this.mousedown)

    this.initOcean()

    this.map.append('path')
    this.features = this.map.append('g')
      .attr('class', 'World')
      .selectAll('.map_path')
      .data(wordJson.features)
      .enter()
      .append('path')
      .attr('d', d => {
        return this.path(d as any)
      })
      .attr('fill', () => d3.schemeCategory10[Math.ceil(Math.random() * 10)])
      .on('dblclick', (d) => {
        console.log('double click')
        if (d.properties.NAME == CHINA || d.properties.NAME == US) {
          this.loadDetail(d.properties.NAME)
        }
      }, true) as any
      
    this.features.append('svg:title').text(d => (d as any).properties.NAME)

    this.rotate()
    
  }

  // 海洋
  private initOcean = () => {
    this.ocean3D = this.map.append("circle")
    .attr('class', 'Ocean3D')
    .attr("cx", this.width / 2).attr("cy", this.height / 2)
    .attr("r", this.projection.scale())
    .style("fill", "url(#ocean_fill)");

    this.ocean2D = this.map.append('rect')
    .attr('class', 'Ocean2D')
    .attr("fill", "url(#ocean_fill)")
    .attr('display', 'none')
  }

  // TODO(放小取消细节)
  // 显示国家细节
  private loadDetail = (country: string) => {
    console.log(country)
    if (country == CHINA && this.showChina)
      return
    if (country == US && this.showUS)
      return

    var json = country == CHINA ? chinaJson : usJson

    var tmp = this.map.append('g')
      .selectAll('path')
      .data(json.features as any)
      .enter()
      .append('path')
      .attr('class', country+'-province')
      .attr('d', this.path as any)
      .attr('fill', 'translate')
      .attr('stroke', 'grey')
    
    country == CHINA ? this.china = tmp : this.us = tmp
    country == CHINA ? this.showChina = true : this.showUS = true
  }

  private mousedown = () => {
    this.m0 = [event.pageX, event.pageY]
    this.o0 = this.projection.rotate()
    this.t0 = this.projection.translate()
    clearInterval(this.rotateTimer)
    this.rotateTimer = undefined
    event.preventDefault()
  }

  private mousemove = () => {
    if (!this.m0)
      return

    if (this.m0) {
      console.log('move')
      var m1 = [event.pageX, event.pageY]
      var o1: Pos = [this.o0[0] + (m1[0] - this.m0[0]) / 6, this.o0[1] + (this.m0[1] - m1[1]) / 6];
      var t1: Pos = [this.t0[0], this.t0[1] + (m1[1] - this.m0[1])]
      o1[1] = this.threeD ?
        (
          o1[1] > 60  ? 60  :
          o1[1] < -60 ? -60 : o1[1]
        ) : 0
      this.projection.rotate(o1);
      if (!this.threeD)
          this.projection.translate(t1)
      this.refresh();
    }
  }

  private keyUp = () => {
    console.log(event)
    if (event.ctrlKey && (event.key == 'c' || event.key == 'C')) {
      this.changeProjection()
    }
  }
  
  private mouseup = () => {
    if (this.m0) {
      this.mousemove();
      this.m0 = null;
    }
  }
  
  private mousewheel = () => {
    console.log(event)
    this.scaleFactor = event.wheelDelta > 0 ? scaleChangeSpeed[0] : scaleChangeSpeed[1]
    this.projection.scale(this.projection.scale() * this.scaleFactor)
    this.refresh()
  }

  private refresh = (animation: boolean = false) => {
    this.features.transition().duration(animation? 1000 : 0).attr('d', this.path)
    this.lines.transition().duration(animation? 1000 : 0)
      .attr('d', this.path)
    
    this.cities.transition().duration(animation? 1000 : 0)
      .attr('d', this.path)

    if (this.threeD) {
      this.ocean3D.attr('r', this.projection.scale())
    }
    else {
      var scale = this.projection.scale()
      var trans = this.projection.translate()
      var x = trans[0] - Math.PI * scale,
          y = trans[1] - Math.PI * scale,
          width = scale * Math.PI * 2,
          height = scale * Math.PI * 2
      this.ocean2D
        .attr('x', x)
        .attr('y', y)
        .attr('width', width)
        .attr('height', height)
    }
    if (this.china) {
      this.china.attr('d', this.path)
    }
    if (this.us) {
      console.log('move us')
      this.us.attr('d', this.path)
    }
  }

  private rotate = () => {
    if (this.rotateTimer != undefined)
      return
    this.rotateTimer = window.setInterval(() => {
      this.o0[0] = (this.o0[0] + 1) % 360
      this.projection.rotate([this.o0[0], 0])
      this.refresh()
    }, 30)
  }

  private drawLine = () => {   
    var data = this.props.flyers.map(flyer => { return {
      type: 'Feature',
      geometry: {type: 'LineString', coordinates: [flyer.start, flyer.end]},
      properties: flyer.properties
    }})

    // 航线
    this.lines = this.map.append('g')
    .selectAll('path')
    .data(data)
    .enter()
    .append('path')
    .attr('class', 'flyer')
    .attr('d', this.path as any)
    .attr('stroke', 'url(#line_color)')
    .attr('stroke-width', d => d.properties.size)
    .attr('vector-effect', 'non-scaling-stroke')
    .attr('mask', 'url(#Mask)')
    .attr('filter', 'url(#Line_blur)')
    .on('click', (d) => console.log(d))

    var cityData = this.props.cities.map(city => { return {
      type: 'Feature',
      geometry: {type: 'Point', coordinates: city.position},
      properties: city.properties
    }})

    this.cities = this.map.append('g')
    .selectAll('path')
    .data(cityData)
    .enter()
    .append('path')
    .attr('class', 'city')
    .attr('d', this.path as any)
    .on('click', (d) => this.highlightCity(d.properties.name))
    
    this.cities.append('svg:title').text((d: any) => d.properties.name)
  }
  

  private changeProjection = () => {
    this.threeD = !this.threeD
    this.projection = (this.threeD ? d3.geoOrthographic() : d3.geoMercator())
    .translate([this.width / 2, this.height / 2])
    .rotate([this.projection.rotate()[0], 0])
    .scale(this.projection.scale())
    .center(this.projection.center())
  
    this.path = d3.geoPath(this.projection)

    if (this.threeD) {
      this.ocean2D.transition().duration(1000).attr('display', 'none')
      this.ocean3D.transition().duration(1000).attr('display', 'inline')
    } else {
      this.ocean2D.transition().duration(1000).attr('display', 'inline')
      this.ocean3D.transition().duration(1000).attr('display', 'none')
    }
  
    this.refresh(true)
  }

  private highlightCity = (cityName: string) => {
    this.lines.filter((d: any) => d.properties.startCity == cityName)
      .attr('stroke', 'red')
    this.lines.filter((d: any) => d.properties.startCity != cityName)
    .attr('stroke', 'url(#line_color)')
  }


  // 注释的是自封装的两点连线算法，但是背面的线可会被看到
  // private swoosh = d3.line()
  // .x(function(d) { return d[0] })
  // .y(function(d) { return d[1] })
  // .curve(d3.curveCardinal.tension(0))

  // private drawLine = () => {
  //   const pos: Pos[] = [[0,0], [90, 90]]
  //   this.lines = this.map.append("path")
  //   .attr("class","flyer")
  //   .attr("d", () => this.swoosh(this.getPointsForLine(pos[0], pos[1])))
  //   .attr('stroke', 'blue')
  //   .attr('fill', 'transparent')
  // }

  // private getPointsForLine = (p0: Pos, p1: Pos) : Pos[] => {
  //   // get canvas coords of arc midpoint and globe center
  //   var mid = this.projection(this.location_along_arc(p0, p1, .5))!;
  //   // var ctr = this.projection.translate();
    
  //   // max length of a great circle arc is π, 
  //   // so 0.3 means longest path "flies" 20% of radius above the globe
  //   // var scale = 1 + 0.05 * d3.geoDistance(p0, p1) / Math.PI;
  
  //   // mid[0] = ctr[0] + (mid[0]-ctr[0])*scale;
  //   // mid[1] = ctr[1] + (mid[1]-ctr[1])*scale;
    
  //   var result = [ this.projection(p0),
  //                  mid,
  //                  this.projection(p1) ]
  //   return result as Pos[];
  // }

  // // 线性插值得到新点
  // private location_along_arc = (start: Pos, end: Pos, loc: number) => {
  //   var interpolator = d3.geoInterpolate(start, end)
  //   return interpolator(loc)
  // }
  
}

export default Earth
