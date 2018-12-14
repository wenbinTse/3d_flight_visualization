import * as React from 'react';

interface Props {
  airlines: any[]
}

interface State {
  airlines: any[],
  cityGeo?: any,
  show: boolean
}

class CityDetail extends React.Component<Props, State>{
  constructor(props: Props) {
    super(props);
    this.state = {
      show: false,
      airlines: []
    }
  }

  public show = (cityGeo: any) => {
    const cityId = cityGeo.properties.id;
    // get the airlines start at the given city
    const airlines = this.props.airlines.filter(d =>
      d.properties.startCityId == cityId);
    this.setState({
      airlines,
      show: true,
      cityGeo
    })
  };

  public hide = () => this.setState({show: false});

  render() {
    if (!this.state.show)
      return null;
    return  (
      <div className='Container City-detail-container'>
        <span>城市: {this.state.cityGeo.properties.name}</span>
        <div>
          详细信息
          {
            this.state.airlines.map(f =>
              <div>
                {f.properties.startCity + ' 到 ' + f.properties.endCity}
              </div>)
          }
        </div>
      </div>
    )
  }
}

export  default  CityDetail;
