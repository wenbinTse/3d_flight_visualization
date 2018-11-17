import * as React from 'react';
import * as wordJson from './world.json'
import './App.css';

import { event } from 'd3'
import * as d3 from 'd3'

interface Props {
  // interface
}

type Pos = [number, number]

class Earth extends React.Component<Props, {}> {
  
  projection = d3.geoOrthographic()
  path = d3.geoPath(this.projection)
  featrues: d3.Selection<d3.BaseType, {}, SVGSVGElement, {}>
  m0: any; o0: [number, number, number] = [0, 0, 0]; scaleFactor = 1
  map:  d3.Selection<SVGSVGElement, {}, HTMLElement, any>
  lines: d3.Selection<d3.BaseType, {}, HTMLElement, any>

  constructor(props: Props) {
    super(props)
  }

  componentDidMount = () => {
    this.init()
    this.drawLine()
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
    
    var width = window.innerWidth, height = window.innerHeight
    this.projection.translate([width / 2, height / 2])
    this.map = d3.select('#map').append('svg')
    .attr('width', width)
    .attr('height', height)
    .on('mousedown', this.mousedown)

    // 大洋颜色
    var ocean_fill = this.map.append("defs").append("radialGradient")
        .attr("id", "ocean_fill")
        .attr("cx", "75%")
        .attr("cy", "25%");
    ocean_fill.append("stop").attr("offset", "5%").attr("stop-color", "#fff");
    ocean_fill.append("stop").attr("offset", "100%").attr("stop-color", "#ababab");
    this.map.append("circle")
    .attr("cx", width / 2).attr("cy", height / 2)
    .attr("r", this.projection.scale())
    .attr("class", "noclicks")
    .style("fill", "url(#ocean_fill)");


    this.map.append('path')
    this.featrues = this.map.selectAll('.map_path')
      .data(wordJson.features)
      .enter()
      .append('path')
      .attr('d', d => {
        console.log(d)
        return this.path(d as any)
      })
      .attr('fill', () => d3.schemeCategory10[Math.ceil(Math.random() * 10)])
      
    this.featrues.append('svg:title').text(d => (d as any).properties.NAME)

    
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
    this.featrues.attr('d', this.path)
    const pos: Pos[] = [[0,0], [90, 90]]
    this.lines
    .attr("d", () => this.swoosh(this.getPointsForLine(pos[0], pos[1])) as any)
  }

  private rotateTimer = window.setInterval(() => {
    this.o0[0] = (this.o0[0] + 0.5) % 360
    this.projection.rotate([this.o0[0], 0])
    this.refresh()
  }, 18)

  private swoosh = d3.line()
  .x(function(d) { return d[0] })
  .y(function(d) { return d[1] })
  .curve(d3.curveCardinal.tension(0))

  private drawLine = () => {
    const pos: Pos[] = [[0,0], [90, 90]]
    this.lines = this.map.append("path")
    .attr("class","flyer")
    .attr("d", () => this.swoosh(this.getPointsForLine(pos[0], pos[1])))
    .attr('stroke', 'blue')
    .attr('fill', 'transparent')
  }

  private getPointsForLine = (p0: Pos, p1: Pos) : Pos[] => {
    // get canvas coords of arc midpoint and globe center
    var mid = this.projection(this.location_along_arc(p0, p1, .5))!;
    // var ctr = this.projection.translate();
    
    // max length of a great circle arc is π, 
    // so 0.3 means longest path "flies" 20% of radius above the globe
    // var scale = 1 + 0.05 * d3.geoDistance(p0, p1) / Math.PI;
  
    // mid[0] = ctr[0] + (mid[0]-ctr[0])*scale;
    // mid[1] = ctr[1] + (mid[1]-ctr[1])*scale;
    
    var result = [ this.projection(p0),
                   mid,
                   this.projection(p1) ]
    return result as Pos[];
  }

  // 线性插值得到新点
  private location_along_arc = (start: Pos, end: Pos, loc: number) => {
    var interpolator = d3.geoInterpolate(start, end)
    return interpolator(loc)
  }
  
  
}

export default Earth
