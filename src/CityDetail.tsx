import * as React from 'react';

interface Props {
  flyers: any[]
}

interface State {
  flyers: any[],
  cityGeo?: any,
  show: boolean
}

class CityDetail extends React.Component<Props, State>{
  constructor(props: Props) {
    super(props)
    this.state = {
      show: false,
      flyers: []
    }
  }

  public show = (cityGeo: any) => {
    const cityId = cityGeo.properties.id;
    // get the flyers start at the given city
    const flyers = this.props.flyers.filter(d =>
      d.properties.startCityId == cityId);
    this.setState({
      flyers,
      show: true,
      cityGeo
    })
  };

  public hide = () => this.setState({show: false});

  render() {
    if (!this.state.show)
      return <span>df</span>;
    return  (
      <div className='City-detail-container'>
        <span>城市: {this.state.cityGeo.properties.name}</span>
        <div>
          详细信息
          {
            this.state.flyers.map(f =>
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
