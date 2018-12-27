import * as React from 'react';
import {GeoPoint} from "./Interface";
import * as d3 from 'd3'
import * as wholeAirLinesDict from './data/airlines_dict_clustered_by_city.json'
import icon from './images/cancel.png'

class CityDetail extends React.Component<{}, {}>{
  
  cityName: string = '';
  group: d3.Selection<SVGGElement, {}, HTMLElement, any>;
  
  public show = (city: GeoPoint) => {
    this.clear();
    this.cityName = city.properties.name;
    
    const data = {name: this.cityName, children: []};
    const children = data.children as any[];
    
    for (const item in wholeAirLinesDict[this.cityName]['end']) {
      children.push({
         name: item,
         size: wholeAirLinesDict[this.cityName]['end'][item].num
       })
    }
    
    const container = d3.select('#city_detail_container');
    container.style('display', 'flex');
    
    this.renderChart(data);
    
    d3.select('#city_detail_svg')
      .on('mouseleave', this.onMouseLeave);
    
    const wholeNum = wholeAirLinesDict[this.cityName].num;
    d3.select('#city_detail_help')
      .html(`从<strong>${this.cityName}</strong>出发的航班数`);
    d3.select('#city_detail_whole_num')
      .text(`${wholeNum}`)
  };

  public hide = () => {
    d3.select('#city_detail_container')
      .style('display', 'none');
  };
  
  private clear = () => {
    d3.select('#city_detail_help')
      .html('');
    d3.select('#city_detail_whole_num')
      .html('');
    d3.select('#city_detail_help1')
      .html('');
    d3.select('#city_detail_num')
      .text('');
  
    const svg = d3.select('#city_detail_svg');
    svg.selectAll('*').remove();
  };

  render() {
    return  (
      <div className='Container City-detail-container' id='city_detail_container' style={{display: 'none'}}>
        <svg id='city_detail_svg'/>
        <img src={icon} onClick={() => this.hide()}/>
        <div className="explanation">
          <span id='city_detail_help'/><br/>
          <span id='city_detail_whole_num'/><br/><br/>
          <span id='city_detail_help1'/><br/>
          <span id='city_detail_num'/>
        </div>
      </div>
    )
  }
  
  shouldComponentUpdate(nextProps: Readonly<{}>, nextState: Readonly<{}>, nextContext: any): boolean {
    return false;
  }
  
  private renderChart = (data: any) => {
    const svg = d3.select('#city_detail_svg');
    const width = (svg.node() as any).clientWidth;
    const height = (svg.node() as any).clientHeight;
    const radius = Math.min(width, height) / 2;
    const color = d3.scaleOrdinal(d3.schemeCategory10);
  
    // Create primary <g> element
    const g = d3.select('#city_detail_svg')
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
    
    this.group = g;
  
    const partition = d3.partition()
      .size([2 * Math.PI, radius]);
  
    // Find data root
    const root = d3.hierarchy(data)
      .sum(function (d: any) { return d.size});
  
    // Size arcs
    partition(root);
    const arc = d3.arc()
      .startAngle(function (d: any) { return d.x0 })
      .endAngle(function (d: any) { return d.x1 })
      .innerRadius(function (d: any) { return d.y0 })
      .outerRadius(function (d: any) { return d.y1 });
  
    g.append("svg:circle")
      .attr("r", radius)
      .style("opacity", 0);
    
    const path = g.selectAll('path')
      .data(root.descendants())
      .enter().append('g');

    // Put it all together
    path.append('path')
      .attr("display", function (d) { return d.depth ? null : "none"; })
      .attr("d", arc as any)
      .style('stroke', '#fff')
      .attr("fill-rule", "evenodd")
      .style("opacity", 1)
      .style("fill", (d) => {
        return color(d.data.name)
      })
      .text(d => d.data.name)
      .on("mouseover", this.onMouseOver)
    ;
    path.append('text')
      .filter((d: any) => { return d.parent; })
      .text(d => d.data.name)
      .attr('dx', d => {
        const len = d.data.name.length;
        return -len * 4.5;
      })
      .attr('dy', '.5em')
      .attr('transform', (d: any) =>
        'translate(' + arc.centroid(d) + ')rotate(' + this.computeTextRotation(d) + ')'
      )
  };
  
  private onMouseOver = (d: any) => {
    d3.select('#city_detail_container').style('opacity', 0.8);
    this.group.selectAll('path')
      .style('opacity', 0.5)
      .style('cursor', 'pointer');
    this.group.selectAll('path')
      .filter(node => {
        return node == d
      })
      .style('opacity', 1);
    
    d3.select('#city_detail_help1')
      .text(`从${this.cityName}到${d.data.name}的航班数:`)
    d3.select('#city_detail_num')
      .text(`${d.data.size}`)
  };
  
  private onMouseLeave = () => {
    this.group.selectAll('path')
      .style('opacity', 1);
  };
  
  private computeTextRotation = (d: any) => {
    const angle = (d.x0 + d.x1) / Math.PI * 90;
    
    // Avoid upside-down labels; labels as rims
    return (angle < 120 || angle > 270) ? angle : angle + 180;
    //return (angle < 180) ? angle - 90 : angle + 90;  // labels as spokes
  }
}

export  default  CityDetail;
