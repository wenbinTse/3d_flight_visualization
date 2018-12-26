import * as React from 'react';
import './App.css';
import Earth from './Earth';
import * as data from './data/airlines_list_clustered_by_city.json'
import {getCities, getGeoJsonForAirlines, getMapGeoData} from "./Util";
import {Airline} from "./Interface";


class App extends React.Component {

  // @ts-ignore
  private getAirlines = (num: number) => (data.slice(0, num) as Airline[]);

  mapGeoData = getMapGeoData();
  airlines = this.getAirlines(600);
  cities = getCities(this.airlines);
  airlineGeoData = getGeoJsonForAirlines(this.airlines, this.cities);

  private updateData = (num: number) => {
    const airlines = this.getAirlines(num);
    const cities = getCities(airlines);
    return {
      airlines,
      cities,
      airlineGeoData: getGeoJsonForAirlines(airlines, cities)
    }
  };


  public render() {
    const width = window.innerWidth, height = window.innerHeight;
    console.log(data)
    return (
     <Earth width={width} height={height} airlines={this.airlines} cities={this.cities}
            airlineGeoData={this.airlineGeoData}
            mapGeoData={this.mapGeoData}
            maxAirlineNum={data.length}
            updateAirline={this.updateData}
     />
    );
  }
}

export default App;
