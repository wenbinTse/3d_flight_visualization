import * as React from 'react';
import './App.css';
import './Switch.css'
import './RangeInput.css'

import * as wholeAirLines from './data/airlines_list_clustered_by_city.json'
import * as wholeAirlinesDict from './data/airlines_dict_clustered_by_city.json'

import * as d3 from 'd3'
import {event, geoDistance, GeoPath, polygonContains} from 'd3'
import {City, Airline, Pos, GeoPoint, GeoLine} from './Interface';
import CityDetail from "./CityDetail";
import CityToCityDetail from "./CityToCityDetail";
import {ChangeEvent} from "react";
import {getGeoJsonForAirline} from "./Util";

interface Props {
  // interface
  width: number
  height: number
  airlines: Airline[]
  cities: City[]
  airlineGeoData: {lines: GeoLine[], points: GeoPoint[]}
  mapGeoData: {countries: any[], land: any, usa: any[], china: any[]}
  maxAirlineNum: number
  updateAirline: (num: number) => {
    airlines: Airline[],
    cities: City[],
    airlineGeoData: {lines: GeoLine[], points: GeoPoint[]}
  }
}

const OCEAN_COLOR = '#696969';
const LAND_COLOR  = '#000000';
const AIRLINE_COLOR = '#ffffff';
const HIGHLIGHT_AIRLINE_COLOR = '#0a0';
const NOT_HIGHLIGHT_AIRLINE_COLOR = '#555';
const TRANSPARENT_AIRLINE_COLOR = 'rgba(200, 200, 200, 0.1)';
const AIRLINE_WIDTH = 0.6;
const BORDER_WIDTH = 0.2;
const BORDER_COLOR = '#dcdcdc';
const HIGHLIGHT_COLOR = '#470024';
const POINT_COLOR = '#86cd9f';
const HIGHLIGHT_POINT_COLOR = '#FFFF00';
const NOT_HIGHLIGHT_POINT_COLOR = '#333';
const BUBBLE_IN_COLOR = 'rgb(255, 48, 48, 0.8)';
const BUBBLE_OUT_COLOR = 'rgb(255,255,224, 0.8)';

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
  useAttention = true; // 当地球较大时，降低/维持起点不在当前视窗内的航线的对比度
  showBubblesOut = false; // 显示城市气泡（大小为从此出发的航班数）
  showBubblesIn = false; // 显示城市气泡（大小为到此的航班数）

  // ms to wait after dragging before auto-rotating
  rotationDelay = 3 * 1000;
  rotating = true;
  rotatingBeforeDrag = false;
  allowRotate = true;
  // auto-rotation speed
  degPerSec = 1; degPerMs = this.degPerSec / 1000;
  showChina: boolean = false; showUsa: boolean = false;
  // the value of scale factor when to show/hide the country details
  detailFactor = 2.5;
  // the value of scale factor when to start/end the rotating
  stopRotatingFactor = 1.5 * 400;

  // The country or the city which is chosen now
  currentArea: any;
  // The city chosen
  cityChosen?: GeoPoint;
  // The second city chosen
  secondCityChosen?: GeoPoint;

  
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
  lines: GeoLine[];
  points: GeoPoint[];

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
  
  private showCityToCityDetail = (startCityName: string, endCityName: string) => {
    this.cityToCityDetail.show(startCityName, endCityName);
  };

  render() {
    return (
      <div id='globe'>
        <canvas id='backgroundCanvas'/>
        <canvas id='canvas'/>
        <div className="right_top_container">
          <CityDetail showCityToCityDetail={this.showCityToCityDetail} ref={(r) => this.cityDetail = r!}/>
          <CityToCityDetail ref={(r) => this.cityToCityDetail = r!}/>
        </div>
        <div className='Container Left_top_container'>
          <div className="Switch" title={"3D/2D切换"}>
            <input defaultChecked={true} className="Switch-checkbox" id="3DSwitch" type="checkbox"
                   onChange={() => this.changeProjection()}/>
            <label className="Switch-label" htmlFor="3DSwitch">
              <span className="Switch-inner" data-on="3D" data-off="2D"/>
              <span className="Switch-switch"/>
            </label>
          </div>
          <div className="Switch" title="允许/禁止地球旋转">
            <input className="Switch-checkbox" id="rotateSwitch" type="checkbox" defaultChecked={true}
                   onChange={(e) => {
                     e.persist();
                     this.allowRotate = e.target.checked
                   }
                   }/>
            <label className="Switch-label" htmlFor="rotateSwitch">
              <span className="Switch-inner" data-on="允许转" data-off="禁止转"/>
              <span className="Switch-switch"/>
            </label>
          </div>
          <div className="Switch" title={"当地球较大时，降低/维持起点不在当前视窗内的航线的对比度"}>
            <input defaultChecked={true} className="Switch-checkbox" id="useAttention" type="checkbox"
            onChange={() => this.useAttention = !this.useAttention}/>
            <label className="Switch-label" htmlFor="useAttention">
              <span className="Switch-inner" data-on="低对比" data-off="原对比"/>
              <span className="Switch-switch"/>
            </label>
          </div>
          <div className="Switch" title={"航线出发城市气泡图"}>
            <input defaultChecked={false} className="Switch-checkbox" id="showBubblesOut" type="checkbox"
                   onChange={() => this.showBubblesOut = !this.showBubblesOut}/>
            <label className="Switch-label" htmlFor="showBubblesOut">
              <span className="Switch-inner" data-on="气泡图1" data-off="气泡图1"/>
              <span className="Switch-switch"/>
            </label>
          </div>
          <div className="Switch" title={"航线到达城市气泡图"}>
            <input defaultChecked={false} className="Switch-checkbox" id="showBubblesIn" type="checkbox"
                   onChange={() => this.showBubblesIn = !this.showBubblesIn}/>
            <label className="Switch-label" htmlFor="showBubblesIn">
              <span className="Switch-inner" data-on="气泡图2" data-off="气泡图2"/>
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
      this.china.forEach((d) => {
        context.beginPath();
        path(d as any);
        context.stroke()
      })
    }

    if (this.showUsa) {
      this.usa.forEach((d) => {
        context.beginPath();
        path(d as any);
        context.stroke()
      })
    }

    if (!this.currentArea) {
      this.drawAirlines();
      this.renderLegend(context);
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
      path.pointRadius(this.originPointRadius as number);
      path(this.currentArea as any);
      context.fill();
    }
    
    this.renderLegend(context);
  }
  
  private renderLegend = (context: CanvasRenderingContext2D) => {
    // legend
    const x = 40, y = 100, r = 20, dy = 45;
    if (this.showBubblesOut) {
      context.beginPath();
      context.font = '18px SimHei';
      context.fillStyle = BUBBLE_OUT_COLOR;
      context.arc(x, y, r, 0, 2 * Math.PI);
      context.fillText('航班出发城市(越大航班数越多)', x + r + 10, y + 5);
      context.fill();
    }
    if (this.showBubblesIn) {
      context.beginPath();
      context.fillStyle = BUBBLE_IN_COLOR;
      context.font = '18px SimHei';
      context.arc(x, y + dy, r, 0, 2 * Math.PI);
      context.fillText('航班到达城市(越大航班数越多)', x + r + 10, y + dy + 5);
      context.fill();
    }
  };
  
  // render the star background
  private backgroundRender = () => {
    
    // draw star
    const starCanvas = document.createElement('canvas');
    const starContext = starCanvas.getContext('2d')!;
    starCanvas.width = 50;
    starCanvas.height = 50;
    const half = starCanvas.width / 2,
      gradient = starContext.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0.025, '#fff');
    gradient.addColorStop(0.8, 'rgba(100, 149, 237, 10)');
    gradient.addColorStop(0.9, 'rgba(30, 144, 255, 10)');
    gradient.addColorStop(1, 'transparent');
    starContext.fillStyle = gradient;
    starContext.beginPath();
    starContext.arc(half, half, half, 0, Math.PI * 2);
    starContext.fill();
    
    // draw background
    const backgroundCanvas = d3.select('#backgroundCanvas')
      .attr('width', this.width)
      .attr('height', this.height) as d3.Selection<HTMLCanvasElement, {}, HTMLElement, any>;
    const backgroundContext = backgroundCanvas.node()!.getContext('2d')!;
    
    let starNum = 1000;
    for (let i = 0; i < starNum; i++) {
      const radius = Math.random() > 0.9 ? 4 + Math.random() : 2 + Math.random();
      const x = Math.random() * this.width, y = Math.random() * this.height;
      backgroundContext.drawImage(starCanvas as any, x, y, radius, radius);
    }
    
  };

  private drawAirlines = () => {
    const context = this.context;
    const path = this.path;
    
    if (this.showBubblesOut) {
      context.fillStyle = BUBBLE_OUT_COLOR;
      for (const startCityName in wholeAirlinesDict) {
        path.pointRadius(wholeAirlinesDict[startCityName].num / 5);
        context.beginPath();
        path({
          type: 'Feature',
          geometry: {type: 'Point', coordinates: wholeAirlinesDict[startCityName].coordinates},
        } as any);
        context.fill();
      }
    }
    if (this.showBubblesIn) {
      context.fillStyle = BUBBLE_IN_COLOR;
      for (const startCityName in wholeAirlinesDict) {
        path.pointRadius(wholeAirlinesDict[startCityName].num_in / 5);
        context.beginPath();
        path({
          type: 'Feature',
          geometry: {type: 'Point', coordinates: wholeAirlinesDict[startCityName].coordinates},
        } as any);
        context.fill();
      }
    }
    
    if (this.showBubblesIn || this.showBubblesOut)
      return;
    
    const cityChosenId = this.cityChosen ? this.cityChosen.properties.id : -1;
    const secondChosenId = this.secondCityChosen ? this.secondCityChosen.properties.id : -1;

    // draw cities
    this.path.pointRadius(this.originPointRadius as number);
    context.fillStyle = this.cityChosen? NOT_HIGHLIGHT_POINT_COLOR : POINT_COLOR;
    this.points.forEach(d => {
      context.beginPath(); path(d as any); context.fill()
    });

    const scale = this.projection.scale();
    const attention = this.useAttention && scale > 1000;
    const center = this.getCenter();

    const defaultStrokeColor = this.cityChosen ? NOT_HIGHLIGHT_AIRLINE_COLOR : AIRLINE_COLOR;
    context.strokeStyle = defaultStrokeColor;
    const defaultFillColor = this.cityChosen ? NOT_HIGHLIGHT_AIRLINE_COLOR :AIRLINE_COLOR;
    context.fillStyle = defaultFillColor;
    path.pointRadius(2);
    this.lines.forEach(d => {
      const startCityId = d.properties.startCityId;
      const endCityId = d.properties.endCityId;

      // choose two cities
      if (this.cityChosen && this.secondCityChosen && cityChosenId == startCityId &&
        secondChosenId == endCityId)
        return;

      // choose one city
      if (this.cityChosen && !this.secondCityChosen && cityChosenId == startCityId)
        return;

      if (attention && geoDistance(center, d.geometry.coordinates[0]) > 600 / scale) {
        context.strokeStyle = TRANSPARENT_AIRLINE_COLOR;
        context.fillStyle = TRANSPARENT_AIRLINE_COLOR;
      } else {
        context.strokeStyle = defaultStrokeColor;
        context.fillStyle = defaultFillColor;
      }

      // context.lineWidth = AIRLINE_WIDTH
      context.lineWidth = AIRLINE_WIDTH * d.properties.num;
      context.beginPath(); path(d as any); context.stroke();
      this.drawBall(d, context, path);
    });
    context.restore();
    this.highLight();
  };
  
  private drawBall = (airline: GeoLine, context: CanvasRenderingContext2D, path: GeoPath) => {
    const coors = airline.geometry.coordinates;
    const geoInterpolator = d3.geoInterpolate(coors[0], coors[1]);
    let p = airline.properties.ballp;
    let dis = airline.properties.distance;
  
    context.beginPath();
    path({type: 'Feature',
      geometry: {type: 'Point', coordinates: geoInterpolator(p)}} as any);
    context.fill();
  
    p = p + 0.002 / dis;
    p = p > 1 ? p - 1 : p;
    airline.properties.ballp = p
  };
  
  // highlight the airlines and cities chosen
  highLightPoints: GeoPoint[] = [];
  highLightAirlines: GeoLine[] = [];
  private highLight = () => {
    const context = this.context;
    const path = this.path;
    
    context.strokeStyle = HIGHLIGHT_AIRLINE_COLOR;
    for (const airline of this.highLightAirlines) {
      context.beginPath(); path(airline as any); context.stroke();
    }
    
    context.fillStyle = HIGHLIGHT_POINT_COLOR;
    path.pointRadius(this.originPointRadius as number);
    for (const point of this.highLightPoints) {
      context.beginPath(); path(point as any); context.fill();
    }
    
    context.fillStyle = HIGHLIGHT_AIRLINE_COLOR;
    path.pointRadius(2);
    for (const l of this.highLightAirlines) {
      this.drawBall(l, context, path);
    }
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
    
    // draw background
    this.backgroundRender();
    
    this.animation();
  };

  private changeProjection = () => {
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
    const newScale = transform.k * this.originScale;
    this.projection.scale(newScale);
    let rotateDegree = this.projection.rotate()[0];
    rotateDegree = (rotateDegree + 360) % 360;
    if (rotateDegree > 220 && rotateDegree < 280) {
      this.showChina = transform.k > this.detailFactor
    }
    if (rotateDegree > 70 && rotateDegree < 130) {
      this.showUsa = transform.k > this.detailFactor
    }

    this.rotating = newScale < this.stopRotatingFactor;
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

    this.rotatingBeforeDrag = this.rotating;
    this.stopRotation();
    
    this.canvas.style('cursor', 'move')
  };
  
  private getCenter = () => {
    const rotate = this.projection.rotate();
    const r0 = rotate[0], r1 = rotate[1];
    let r = (-r1 + 360) % 360;
    r = r < 90 ? r : (r < 270 ? 180 - r : r - 360);
    return [(-r0 + 360 + 180) % 360 - 180, r] as [number, number];
  };

  private dragged = () => {
    const delta: Pos = [event.dx, event.dy];
    const speed = 100 / this.projection.scale();
    const r1: Pos = [this.r0[0] + delta[0] * speed, this.r0[1] - delta[1] * speed];
    this.projection.rotate(r1);
    // if (!this.threeD)
    //   this.projection.translate(t1)
    this.r0 = r1
  };

  private dragended = () => {
    if (this.rotatingBeforeDrag)
      this.startRotation(this.rotationDelay);
    this.canvas.style('cursor', 'auto')
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
    if (this.cityChosen && city && this.cityChosen.properties.id != city.properties.id) {
      this.secondCityChosen = city;
      const airlines = wholeAirLines.filter(l => l.start.name == (this.cityChosen!).properties.name
        && l.end.name == (this.secondCityChosen!).properties.name) as Airline[];
      this.highLightAirlines = airlines.map(l => getGeoJsonForAirline(l));
      this.highLightPoints[1] = city;
      
      this.cityDetail.hide();
      this.cityToCityDetail.show(this.cityChosen.properties.name, this.secondCityChosen.properties.name);
    } else {
      this.cityChosen = city;
      this.secondCityChosen = undefined;
      if (this.cityChosen) {
        this.cityDetail.show(this.cityChosen);
        const airlines = wholeAirLines.filter(l => l.start.name == (this.cityChosen!).properties.name) as Airline[];
        this.highLightAirlines = airlines.map(l => getGeoJsonForAirline(l));
        this.highLightPoints = [city!];
      } else {
        this.highLightAirlines = [];
        this.highLightPoints = [];
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
    
    // Redraw the background
    this.backgroundRender();
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
    const ACC = 500 / this.projection.scale() * 0.5;
    return this.points.find(function(f) {
      return Math.abs(f.geometry.coordinates[0] - pos[0]) < ACC
       && Math.abs(f.geometry.coordinates[1] - pos[1]) < ACC
    })
  }
}

export default Earth
