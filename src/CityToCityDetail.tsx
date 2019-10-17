import * as React from 'react';
import {GeoPoint} from "./Interface";
import * as d3 from 'd3'
import * as wholeAirLinesDict from './data/airlines_dict_clustered_by_city.json'
import icon from './images/cancel.png'

class CityToCityDetail extends React.Component<{}, {}> {

  startCityName = '';
  endCityName = '';
  group: d3.Selection<SVGGElement, {}, HTMLElement, any>;
  
  public show = (startCityName: string, endCityName: string) => {
    this.clear();
    this.startCityName = startCityName;
    this.endCityName = endCityName;
  
    const data = {name: this.startCityName, children: []};
    const children = data.children as any[];
    
    const container = d3.select('#citys_detail_container');
    container.style('display', 'flex')
      .on('mouseleave', this.onMouseLeave);
  
    const block = wholeAirLinesDict[this.startCityName]['end'][this.endCityName];
    if (!block) {
      d3.select('#citys_detail_help')
        .html(`暂时没有从${this.startCityName}到${this.endCityName}的航班`);
      d3.select('#citys_detail_whole_num')
        .html('');
      d3.select('#citys_detail_help1')
        .html('');
      d3.select('#citys_detail_num')
        .text('');
      return;
    }
    
    const dict = {};
    
    for (const item of block.list) {
      const start = item.startAirport, end = item.endAirport, num = item.num;
      if (!dict[start]) {
        dict[start] = {
          children: [],
        }
      }
      dict[start].children.push({
        name: end,
        size: num
      })
    }
    
    for (const start in dict) {
      children.push({
        name: start,
        children: dict[start].children
      })
    }
    
    this.renderChart(data);
  
    const wholeNum = block.num;
    d3.select('#citys_detail_help')
      .html(`从<strong>${this.startCityName}</strong>到<strong>${this.endCityName}</strong>的航班数`);
    d3.select('#citys_detail_whole_num')
      .text(`${wholeNum}`)
  };

  public hide = () => {
    d3.select('#citys_detail_container')
      .style('display', 'none');
  };
  
  private clear = () => {
    d3.select('#citys_detail_help')
      .html('');
    d3.select('#citys_detail_whole_num')
      .html('');
    d3.select('#citys_detail_help1')
      .html('');
    d3.select('#citys_detail_num')
      .text('');
  
    const svg = d3.select('#citys_detail_svg');
    svg.selectAll('*').remove();
  };

  render() {
    return (
      <div className='City-detail-container' id='citys_detail_container'
           style={{display: 'none', height: window.innerHeight / 2}}>
        <img src={icon} onClick={() => this.hide()}/>
        <svg id='citys_detail_svg'/>
        <div className="explanation">
          <span id='citys_detail_help'/><br/>
          <span id='citys_detail_whole_num'/><br/><br/>
          <span id='citys_detail_help1'/><br/>
          <span id='citys_detail_num'/>
        </div>
      </div>
    )
  }
  
  shouldComponentUpdate(nextProps: Readonly<{}>, nextState: Readonly<{}>, nextContext: any): boolean {
    return false;
  }
  
  
  private renderChart = (data: any) => {
    console.log(data)
    const svg = d3.select('#citys_detail_svg');
    const width = (svg.node() as any).clientWidth;
    const height = (svg.node() as any).clientHeight;
    const radius = Math.min(width, height) / 2;
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    
    // Create primary <g> element
    const g = d3.select('#citys_detail_svg')
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
    
    this.group = g;
    
    const partition = d3.partition()
      .size([2 * Math.PI, radius]);
    
    // Find data root
    const root = d3.hierarchy(data)
      .sum(function (d: any) { return d.size})
    ;
  
    const ys = [0, radius * 0.6, radius * 0.8, radius * 0.98];
    function innerR(d: any) {
      return ys[d.depth] + 1
    }
  
    function outerR(d: any) {
      return ys[d.depth + 1]
    }
    // Size arcs
    partition(root);
    const arc = d3.arc()
      .startAngle(function (d: any) { return d.x0 })
      .endAngle(function (d: any) { return d.x1 })
      .innerRadius(function (d: any) { return innerR(d) })
      .outerRadius(function (d: any) { return outerR(d) });
    
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
      .style("opacity", 0.5)
      .style("fill", (d) => {
        return color(d.data.name)
      })
      .text(d => d.data.name)
      .on("mouseover", this.onMouseOver)
    ;
    path.append('text')
      .filter((d: any) => { return d.parent; })
      .text((d: any) => {
        const rate = d.value / d.parent.value * 150;
        const len = d.data.name.length;
        return len > rate? '' : d.data.name;
      })
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
    d3.select('#citys_detail_container').style('opacity', 0.8);
  
    const sequenceArray = d.ancestors().reverse();
    sequenceArray.shift();
    
    this.group.selectAll('path')
      .style('opacity', 0.5)
      .style('cursor', 'pointer');
    this.group.selectAll('path')
      .filter(node => {
        return sequenceArray.indexOf(node) >= 0
      })
      .style('opacity', 1);
    
    if (d.depth==1) {
      d3.select('#citys_detail_help1')
        .html(`从<strong>${d.data.name}</strong>到<strong>${this.endCityName}</strong>的航班数:`);
      d3.select('#citys_detail_num')
        .html(`${d.value}`)
    } else if (d.depth == 2) {
      d3.select('#citys_detail_help1')
        .html(`从<strong>${d.parent.data.name}</strong>到<strong>${d.data.name}</strong>的航班数:`);
      d3.select('#citys_detail_num')
        .text(`${d.value}`)
    }
   
  };
  
  private onMouseLeave = () => {
    this.group.selectAll('path')
      .style('opacity', 0.5);
  };
  
  private computeTextRotation = (d: any) => {
    const angle = (d.x0 + d.x1) / Math.PI * 90;
    
    // Avoid upside-down labels; labels as rims
    return (angle < 120 || angle > 270) ? angle : angle + 180;
    //return (angle < 180) ? angle - 90 : angle + 90;  // labels as spokes
  }
}

export default CityToCityDetail;
