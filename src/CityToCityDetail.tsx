import * as React from 'react'

interface Props {
  airlines: any[]
}

interface State {
  show: boolean,
  airlines: any[],
  startCityGeo?: any,
  endCityGeo?: any
}

class CityToCityDetail extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      show: false,
      airlines: []
    }
  }

  public show = (startCityGeo: any, endCityGeo: any) => {
    const startCityId = startCityGeo.properties.id;
    const endCityId = endCityGeo.properties.id;

    // get the airlines start at the first city and end at the second city
    const airlines = this.props.airlines.filter(d =>
      d.properties.startCityId == startCityId && d.properties.endCityId == endCityId);

    this.setState({
      airlines,
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

export default CityToCityDetail;
