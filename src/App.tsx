import * as React from 'react';
import './App.css';
import Earth from './Earth';
import { Flyer, City } from './Interface';
import * as data from './data/airlines_complete.json'


class App extends React.Component {
  private dummyData = (num: number) : Flyer[] => {
    // var flyers : Flyer[] = [];
    // var i = 0
    // while (i < num) {
    //   var tmp: Flyer = {
    //     start: [Math.random() * 360 - 180, Math.random() * 180 -90],
    //     end: [Math.random() * 360 - 180, Math.random() * 180 -90],
    //     properties: {
    //       size: Math.round(Math.random() * 8)
    //     }
    //   }
    //   flyers.push(tmp)
    //   i++
    // }
    // return flyers
    // return [
    //   {
    //     start: [20, 20],
    //     end: [40, 40],
    //     properties: {
    //       size: 2,
    //       startCity: '20',
    //       endCity: '40'
    //     }
    //   },
    //   {
    //     start: [20, 20],
    //     end: [0, 0],
    //     properties: {
    //       size: 2,
    //       startCity: '20',
    //       endCity: '0'
    //     }
    //   },
    //   {
    //     start: [40, 40],
    //     end: [0, 0],
    //     properties: {
    //       size: 2,
    //       startCity: '40',
    //       endCity: '0'
    //     }
    //   }
    // ]
    return data.slice(0, 1000) as any
  }
  private getCities = (flyers: Flyer[]) => {
    var cities: City[] = []
    flyers.forEach(f => {
      cities.push({
        position: f.start,
        properties: {name: f.properties.startCity}
      })
      cities.push({
        position: f.end,
        properties: {name: f.properties.endCity}
      })
    })
    var helper = new Map()
    return cities.filter(c => !helper.get(c.properties.name) && helper.set(c.properties.name, 1))
  }
  public render() {
    var width = window.innerWidth, height = window.innerHeight
    var flyers = this.dummyData(20)
    var cities = this.getCities(flyers)
    console.log(cities)
    return (
     <Earth width={width} height={height} flyers={this.dummyData(20)} cities={cities}/>
    );
  }
}

export default App;
