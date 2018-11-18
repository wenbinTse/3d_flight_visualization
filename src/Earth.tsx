import * as React from 'react';
import * as wordJson from './world.json'
import './App.css';

import { event } from 'd3'
import * as d3 from 'd3'
import { runInThisContext } from 'vm';
import { any } from 'prop-types';

interface Props {
  // interface
  
}

type Pos = [number, number]

class Earth extends React.Component<Props, {}> {
  
  projection = d3.geoOrthographic()
  path = d3.geoPath(this.projection)
  features: d3.Selection<d3.BaseType, {}, SVGSVGElement, {}>
  m0: any; o0: [number, number, number] = [0, 0, 0]; scaleFactor = 1
  map:  d3.Selection<SVGSVGElement, {}, HTMLElement, any>
  lines: d3.Selection<d3.BaseType, {}, HTMLElement, any>
  width: number
  height: number


  constructor(props: Props) {
    super(props)
  }

  componentDidMount = () => {
    this.init()
    this.drawLine([0,0],[90,90])
  }

  render = () => {
    return (
      <div id='map'/>
    );
  }

  private init = () => {
    d3.select(window)
    .on('mousemove', this.mousemove)
    .on('mouseup', this.mouseup)
    .on('mousewheel', this.mousewheel)
    
    this.width = window.innerWidth, this.height = window.innerHeight
    this.projection.translate([this.width / 2, this.height / 2])
    this.map = d3.select('#map').append('svg')
    .attr('width', this.width)
    .attr('height', this.height)
    .on('mousedown', this.mousedown)

    // 大洋颜色
    var ocean_fill = this.map.append("defs").append("radialGradient")
        .attr("id", "ocean_fill")
        .attr("cx", "75%")
        .attr("cy", "25%");
    ocean_fill.append("stop").attr("offset", "5%").attr("stop-color", "#fff");
    ocean_fill.append("stop").attr("offset", "100%").attr("stop-color", "#ababab");
    this.map.append("circle")
    .attr("cx", this.width / 2).attr("cy", this.height / 2)
    .attr("r", this.projection.scale())
    .attr("class", "noclicks")
    .style("fill", "url(#ocean_fill)");


    this.map.append('path')
    this.features = this.map.selectAll('.map_path')
      .data(wordJson.features)
      .enter()
      .append('path')
      .attr('d', d => {
        return this.path(d as any)
      })
      .attr('fill', () => d3.schemeCategory10[Math.ceil(Math.random() * 10)])
      
    this.features.append('svg:title').text(d => (d as any).properties.NAME)

    
  }

  private mousedown = () => {
    this.m0 = [event.pageX, event.pageY]
    this.o0 = this.projection.rotate()
    clearInterval(this.rotateTimer)
    event.preventDefault()
  }

  private mousemove = () => {
    if (this.m0) {
      console.log('move')
      var m1 = [event.pageX, event.pageY]
      var o1: Pos = [this.o0[0] + (m1[0] - this.m0[0]) / 6, this.o0[1] + (this.m0[1] - m1[1]) / 6];
      o1[1] = o1[1] > 60  ? 60  :
              o1[1] < -60 ? -60 :
              o1[1];
      this.projection.rotate(o1);
      this.refresh();
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
    this.scaleFactor = event.wheelDelta > 0 ? 1.1 : 0.9
    this.projection.scale(this.projection.scale() * this.scaleFactor)
    this.refresh()
  }

  private refresh = () => {
    this.features.attr('d', this.path)
    // const pos: Pos[] = [[0,0], [90, 90]]
    // this.lines
    // .attr("d", () => this.swoosh(this.getPointsForLine(pos[0], pos[1])) as any)
    this.lines.attr('d', this.path)
  }

  private rotateTimer = window.setInterval(() => {
    this.o0[0] = (this.o0[0] + 0.5) % 360
    this.projection.rotate([this.o0[0], 0])
    this.refresh()
  }, 18)

  private drawLine = (p0: Pos, p1: Pos) => {   
    var data = [
      {
        type: 'Feature',
        geometry: {type: 'LineString', coordinates: [p0, p1]}
      }
    ]
    this.lines = this.map.append('g')
    .data(data)
    .append('path')
    .attr('id', 'flyer')
    .attr('d', this.path as any)
    .attr('stroke', 'blue')
    .attr('fill', 'transparent')
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
  

  
  // 两个投影转换
  // private projectionTween = (projection0: d3.GeoProjection, projection1: d3.GeoProjection) => {
  //   var width = this.width, height = this.height
  //   return function(d: any) {
  //     var t = 0;
  
  //     var projection = d3.geoProjection(project)
  //         .scale(1)
  //         .translate([width / 2, height / 2]);
  
  //     var path = d3.geoPath()
  //         .projection(projection);
  
  //     function project(λ: number, φ: number): [number, number] {
  //       λ *= 180 / Math.PI, φ *= 180 / Math.PI;
  //       var p0 = projection0([λ, φ])!, p1 = projection1([λ, φ])!;
  //       return [(1 - t) * p0[0] + t * p1[0], (1 - t) * -p0[1] + t * -p1[1]];
  //     }
  
  //     return function(_: number) {
  //       t = _;
  //       return path(d);
  //     }
  //   }
  // }
}

export default Earth
