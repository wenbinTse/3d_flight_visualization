import * as React from 'react';
import * as wordJson from './world.json'
import './App.css';

import { event } from 'd3'
import * as d3 from 'd3'

interface Props {
  // interface
}

class Earth extends React.Component<Props, {}> {
  
  projection = d3.geoOrthographic()
  path = d3.geoPath(this.projection)
  featrues: d3.Selection<d3.BaseType, {}, SVGSVGElement, {}>
  m0: any; o0: [number, number, number] = [0, 0, 0]; scaleFactor = 1
  map:  d3.Selection<SVGSVGElement, {}, HTMLElement, any>

  constructor(props: Props) {
    super(props)
  }

  componentDidMount = () => {
    this.init()
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

    this.map.append('path')
    this.featrues = this.map.selectAll('.map_path')
      .data(wordJson.features)
      .enter()
      .append('path')
      .attr('d', this.path as any)
      .attr('fill', () => d3.rgb(Math.random() * 255, 0, 0) as any)
      
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
      var o1: [number, number] = [this.o0[0] + (m1[0] - this.m0[0]) / 6, this.o0[1] + (this.m0[1] - m1[1]) / 6];
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
  }

  private rotateTimer = window.setInterval(() => {
    this.o0[0] = (this.o0[0] + 0.5) % 360
    this.projection.rotate([this.o0[0], 0])
    this.refresh()
  }, 18)

}

export default Earth
