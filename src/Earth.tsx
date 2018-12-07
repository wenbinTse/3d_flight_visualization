import * as React from 'react';
import './App.css';
import './Switch.css'
import './RangeInput.css'

import * as d3 from 'd3'
import {event, polygonContains} from 'd3'
import {City, Airline, Pos} from './Interface';
import CityDetail from "./CityDetail";
import CityToCityDetail from "./CityToCityDetail";
import {ChangeEvent} from "react";

interface Props {
  // interface
  width: number
  height: number
  airlines: Airline[]
  cities: City[]
  airlineGeoData: {lines: any[], points: any[]}
  mapGeoData: {countries: any[], land: any, usa: any[], china: any[]}
  maxAirlineNum: number
  updateAirline: (num: number) => {
    airlines: Airline[],
    cities: City[],
    airlineGeoData: {lines: any[], points: any[]}
  }
}

const OCEAN_COLOR = '#696969';
const LAND_COLOR  = '#000000';
const FLYER_COLOR = '#ffffff';
const HIGHLIGHT_FLYER_COLOR = '#0a0';
const NOT_HIGHLIGHT_FLYER_COLOR = '#555';
const FLYER_WIDTH = 0.6;
const BORDER_WIDTH = 0.2;
const BORDER_COLOR = '#dcdcdc';
const HIGHLIGHT_COLOR = '#a00';
const POINT_COLOR = '#0a0';
const HIGHLIGHT_POINT_COLOR = '#FFFF00';
const NOT_HIGHLIGHT_POINT_COLOR = '#333';

const CHINA_ID = 156;
const USA_ID = 840;

class Earth extends React.Component<Props, {}> {

  canvas: d3.Selection<HTMLCanvasElement, {}, HTMLElement, any>;
  tooltip: d3.Selection<HTMLSpanElement, {}, HTMLElement, any>;
  airlineNumElement: d3.Selection<HTMLSpanElement, {}, HTMLElement, any>;
  context: CanvasRenderingContext2D;
  zoomer = d3.zoom();

  width: number; height: number;

  threeDi = true;

  // ms to wait after dragging before auto-rotating
  rotationDelay = 3 * 1000;
  rotating = true;
  allowRotate = true;
  // auto-rotation speed
  degPerSec = 1; degPerMs = this.degPerSec / 1000;
  showChina: boolean = false; showUsa: boolean = false;
  // the value of scale factor when to show/hide the country details
  detailFactor = 2.5;
  // the value of scale factor when to start/end the rotating
  stopRotatingFactor = 1.5;

  // The country or the city which is chosen now
  currentArea: any;
  // The city chosen
  cityChosen: any;
  // The second city chosen
  secondCityChosen: any;

  
  r0: Pos;     // rotate angle
  t0: Pos;     // translate value

  originScale = 400;
  projection = d3.geoOrthographic().scale(this.originScale);
  path = d3.geoPath(this.projection);

  originPointRadius = this.path.pointRadius();

  // Map geoJson data
  countries: any[];
  land: any;
  usa: any[];
  china: any[];

  // Airline geoJson data
  lines: any[];
  points: any[];

  cityDetail: CityDetail;
  cityToCityDetail: CityToCityDetail;
  
  public constructor(props: Props) {
    super(props);
    this.state = {
      showCityDetail: false
    };

    this.width = props.width;
    this.height = props.height;

    this.countries = props.mapGeoData.countries;
    this.land = props.mapGeoData.land;
    this.china = props.mapGeoData.china;
    this.usa = props.mapGeoData.usa;

    this.lines = props.airlineGeoData.lines;
    this.points = props.airlineGeoData.points;
  }

  render() {
    return (
      <div id='globe'>
        <canvas id='canvas'/>
        <CityDetail airlines={this.lines} ref={(r) => this.cityDetail = r!}/>
        <CityToCityDetail airlines={this.lines} ref={(r) => this.cityToCityDetail = r!}/>
        <div className='Container Left_top_container'>
          <div className="Switch">
            <input defaultChecked={true} className="Switch-checkbox" id="3DSwitch" type="checkbox"
                   onChange={() => this.changeProjection()}/>
            <label className="Switch-label" htmlFor="3DSwitch">
              <span className="Switch-inner" data-on="3D" data-off="2D"/>
              <span className="Switch-switch"/>
            </label>
          </div>
          <div className="Switch">
            <input className="Switch-checkbox" id="rotateSwitch" type="checkbox" defaultChecked={true}
                   onChange={() => this.allowRotate = !this.allowRotate}/>
            <label className="Switch-label" htmlFor="rotateSwitch">
              <span className="Switch-inner" data-on="允许转" data-off="禁止转"/>
              <span className="Switch-switch"/>
            </label>
          </div>
        </div>
        <div className="Container Left_bottom_container">
          <div className="Range_container">
            <input type="range" min={0} max={this.props.maxAirlineNum} step={10}
                   defaultValue={this.lines.length.toString()}
                   onChange={this.onAirlineNumChange}/>
            <span id='airlineNum'>{this.lines.length}</span>
          </div>
        </div>
        <span className='tooltip' id='tooltip'>显示提示</span>
      </div>
    )
  }

  public componentDidMount(): void {
    this.init()
  }

  public shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<{}>, nextContext: any): boolean {
    return false
  }


  // render the map
  private canvasRender() {
    const context = this.context;
    const path = this.path;

    context.clearRect(0, 0, this.width, this.height);

    const sphere: any = { type: "Sphere" };
    context.beginPath(); context.fillStyle = OCEAN_COLOR; path(sphere); context.fill();

    context.beginPath();
    context.fillStyle = LAND_COLOR;
    path(this.land as any);
    context.fill();

    context.strokeStyle = BORDER_COLOR;
    context.lineWidth = BORDER_WIDTH;
    this.countries.forEach((d: any) => {
      context.beginPath();
      path(d);
      context.stroke()
    });

    if (this.showChina) {
      this.china.forEach((d, i) => {
        context.beginPath();
        path(d as any);
        context.stroke()
      })
    }

    if (this.showUsa) {
      this.usa.forEach((d, i) => {
        context.beginPath();
        path(d as any);
        context.stroke()
      })
    }

    if (!this.currentArea) {
      this.drawAirlines();
      return
    }

    const type = this.currentArea.properties.type;
    // draw it before airlines
    if (type == 'country' || type == 'province') {
      context.beginPath();
      context.fillStyle = HIGHLIGHT_COLOR;
      path(this.currentArea as any);
      context.fill();

      this.drawAirlines()
    } else {
      this.drawAirlines();

      context.beginPath();
      context.fillStyle = HIGHLIGHT_COLOR;
      path(this.currentArea as any);
      context.fill()
    }
  }

  private drawAirlines = () => {
    const context = this.context;
    const path = this.path;

    const cityChosenId = this.cityChosen ? this.cityChosen.properties.id : -1;
    const secondChosenId = this.secondCityChosen ? this.secondCityChosen.properties.id : -1;
    this.points.forEach(d => {
      const id = d.properties.id;
      context.fillStyle = this.cityChosen || this.secondCityChosen ?
        (id == cityChosenId || id == secondChosenId ? HIGHLIGHT_POINT_COLOR : NOT_HIGHLIGHT_FLYER_COLOR) :
        POINT_COLOR;
      context.beginPath(); path(d); context.fill()
    });

    // need to highlight the airlines start at the 'cityChosen'
    this.lines.forEach(d => {
      const startCityId = d.properties.startCityId;
      const endCityId = d.properties.endCityId;
      if (!this.cityChosen) {
        context.strokeStyle = FLYER_COLOR;
        context.lineWidth = FLYER_WIDTH
      } else if ((!this.secondCityChosen && cityChosenId != startCityId) ||
        (this.secondCityChosen && (cityChosenId != startCityId || secondChosenId != endCityId ))) {
        context.strokeStyle = NOT_HIGHLIGHT_FLYER_COLOR;
        context.lineWidth = FLYER_WIDTH
      } else {
        context.strokeStyle = HIGHLIGHT_FLYER_COLOR;
        context.lineWidth = 2
      }

      context.beginPath(); path(d); context.stroke()
    });

    // draw the ball on airlines
    this.path.pointRadius(2);
    context.save();
    this.lines.forEach(d => {
      const startCityId = d.properties.startCityId;
      const endCityId = d.properties.endCityId;
      if (!this.cityChosen && !this.secondCityChosen) {
        context.fillStyle = FLYER_COLOR;
      } else if ((!this.secondCityChosen && cityChosenId != startCityId) ||
        (this.secondCityChosen && (cityChosenId != startCityId || secondChosenId != endCityId ))) {
        context.fillStyle = NOT_HIGHLIGHT_FLYER_COLOR;
      } else {
        context.fillStyle = HIGHLIGHT_FLYER_COLOR;
      }

      const coors = d.geometry.coordinates;
      const geoInterpolator = d3.geoInterpolate(coors[0], coors[1]);
      let p = d.properties.ballp;
      let dis = d.properties.distance;

      context.beginPath();
      path({type: 'Feature',
        geometry: {type: 'Point', coordinates: geoInterpolator(p)}} as any);
      context.fill();

      p = p + 0.002 / dis;
      p = p > 1 ? p - 1 : p;
      d.properties.ballp = p
    });
    context.restore();
    this.path.pointRadius(this.originPointRadius as number)
  };

  private init = () => {
    // init canvas
    this.canvas = d3.select('#canvas')
      .attr('width', this.width)
      .attr('height', this.height) as d3.Selection<HTMLCanvasElement, {}, HTMLElement, any>;

    // init tooltip
    this.tooltip = d3.select('#tooltip');
    // init airlineNumElement
    this.airlineNumElement = d3.select('#airlineNum');


    this.canvas
      .call(d3.drag()
        .on('start', this.dragStarted)
        .on('drag', this.dragged)
        .on('end', this.dragended)
      )
      .call(this.zoomer.on('zoom', this.zoomed))
      .on('mousemove', this.onMouseMove)
      .on('click', this.onClick);

    window.onresize = this.onReSize;
  
    // init canvas context and geoPath
    this.context = this.canvas.node()!.getContext('2d')!;
    this.path.context(this.context);

    // change the center of earth
    this.projection.translate([this.width / 2, this.height / 2]);
    
    // this.canvasRender()
    this.animation()
  };

  private  changeProjection = () => {
    this.threeDi = !this.threeDi;
    this.projection = (this.threeDi ? d3.geoOrthographic() : d3.geoMercator())
      .translate([this.width / 2, this.height / 2])
      .rotate([this.projection.rotate()[0], 0])
      .scale(this.projection.scale())
      .center(this.projection.center());
    this.path = d3.geoPath(this.projection).context(this.context);
  };

  private zoomed = () => {
    let transform = d3.event.transform;
    this.projection.scale(transform.k * this.originScale);
    let rotateDegree = this.projection.rotate()[0];
    rotateDegree = (rotateDegree + 360) % 360;
    if (rotateDegree > 220 && rotateDegree < 280) {
      this.showChina = transform.k > this.detailFactor
    }
    if (rotateDegree > 70 && rotateDegree < 130) {
      this.showUsa = transform.k > this.detailFactor
    }

    this.allowRotate = transform.k < this.stopRotatingFactor;
  };

  private animation = () => {
    if (this.rotating && this.allowRotate) {
      this.rotate()
    }
    this.canvasRender();
    requestAnimationFrame(this.animation)
  };

  private rotate = () => {
    const rotation = this.projection.rotate();
    rotation[0] += this.degPerMs * 60;
    this.projection.rotate(rotation)
  };

  private stopRotation = () => this.rotating = false;
  private startRotation = (delay: number) => setTimeout(() => this.rotating = true, delay | 0);

  private dragStarted = () => {
    this.r0 = this.projection.rotate().slice(0,2) as Pos;
    this.t0 = this.projection.translate();

    this.stopRotation();
  };

  private dragged = () => {
    const delta: Pos = [event.dx, event.dy];
    const r1: Pos = [this.r0[0] + delta[0] / 10, this.r0[1] - delta[1] / 10];
    const t1: Pos = [this.t0[0], this.t0[1] + delta[1]];
    this.projection.rotate(r1);
    // if (!this.threeD)
    //   this.projection.translate(t1)
    this.canvasRender();

    this.r0 = r1
  };

  private dragended = () => {
    this.startRotation(this.rotationDelay)
  };

  private onMouseMove = () => {
    const c = this.getArea();
    if (c && c.properties.type == 'point') {
      this.canvas.style('cursor', 'pointer')
    } else {
      this.canvas.style('cursor', 'default')
    }
    if (!c) {
      this.currentArea = undefined;
      this.tooltip.style('display', 'none');
      return
    }
    this.currentArea = c;
    if (c && c.properties.name == 'CTU') console.log(c)

    const pos = d3.mouse(this.canvas.node() as any);
    this.updateTooltip(this.currentArea.properties.name, pos[1] + 10, pos[0] + 10);

  };

  private updateTooltip = (text: string, x: number, y: number) => {
    this.tooltip
      .text(text);

    (this.tooltip.node() as any).style =
      'display: block; top: ' + x + 'px; left: ' + y + 'px;';
  };


  private onClick = () => {
    let pos = this.projection.invert!(d3.mouse(this.canvas.node() as any))!;
    const city = this.getPoint(pos);
    if (this.cityChosen && city && this.cityChosen != city) {
      this.secondCityChosen = city;
      this.cityDetail.hide();
      this.cityToCityDetail.show(this.cityChosen, this.secondCityChosen);
    } else {
      this.cityChosen = city;
      this.secondCityChosen = undefined;
      if (this.cityChosen) {
        this.cityDetail.show(this.cityChosen);
      } else {
        this.cityDetail.hide();
      }
      this.cityToCityDetail.hide();
    }
  };

  private onReSize = () => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.attr('width', this.width)
      .attr('height', this.height);
    this.projection.translate([this.width/2, this.height/2]);
  };

  private onAirlineNumChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.persist();
    const num = parseInt(e.target.value);
    this.cityChosen = undefined;
    this.secondCityChosen = undefined;

    // update airline data
    const newData = this.props.updateAirline(num);
    this.lines = newData.airlineGeoData.lines;
    this.points = newData.airlineGeoData.points;

    this.airlineNumElement.text(num);
  };


  // get the area under the mouse
  private getArea = () => {
    let pos = this.projection.invert!(d3.mouse(this.canvas.node() as any))!;


    // find points first
    const point = this.getPoint(pos);
    if (point) return point;

    // find country
    const country = this.countries.find(function(f: any) {
      return f.geometry.coordinates.find(function(c1: any) {
        return polygonContains(c1, pos) || c1.find(function(c2: any) {
          return polygonContains(c2, pos)
        })
      })
    });

    // find province
    const id = country ? country.id : -1;
    if (id == CHINA_ID || id == USA_ID) {
      const json = id == CHINA_ID ? this.china : this.usa;
      if (id == CHINA_ID && !this.showChina)  return country;
      if (id == USA_ID && !this.showUsa) return country;
      else return (json as any).find(function(f: any) {
        return f.geometry.coordinates.find(function(c1: any) {
          return polygonContains(c1, pos)
        })
      })
    }
    return country
  };

  private getPoint = (pos: Pos) => {
    const ACC = 0.5;
    return this.points.find(function(f) {
      return Math.abs(f.geometry.coordinates[0] - pos[0]) < ACC
       && Math.abs(f.geometry.coordinates[1] - pos[1]) < ACC
    })
  }
}

export default Earth
