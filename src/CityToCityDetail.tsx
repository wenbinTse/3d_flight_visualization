import * as React from 'react'

interface Props {
  flyers: any[]
}

interface State {
  show: boolean,
  flyers: any[],
  startCityGeo?: any,
  endCityGeo?: any
}

class CityToCityDetail extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      show: false,
      flyers: []
    }
  }

  public show = (startCityGeo: any, endCityGeo: any) => {
    const startCityId = startCityGeo.properties.id;
    const endCityId = endCityGeo.properties.id;

    // get the flyers start at the first city and end at the second city
    const flyers = this.props.flyers.filter(d =>
      d.properties.startCityId == startCityId && d.properties.endCityId == endCityId);

    this.setState({
      flyers,
      show: true,
      startCityGeo,
      endCityGeo
    })
  };

  public hide = () => this.setState({show: false});

  render() {
    if (!this.state.show)
      return null;
    return (
      <div className='City-detail-container'>
        <span>{this.state.startCityGeo.properties.name + ' 到 ' + this.state.endCityGeo.properties.name}</span>
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

export default CityToCityDetail;
