import logo from './logo.svg';
import './App.css';
import React from 'react';
import Slider from '@material-ui/core/Slider';
import RefreshIcon from '@material-ui/icons/Refresh';
import { withStyles } from '@material-ui/core/styles';

function checkStatus() {
  return fetch('http://192.168.1.184:80/auth?key=sawicki', { method: 'GET' })
    .then(response => response)
    .then((resp) => {
      return resp;
    }).catch(err => {
      console.log('error auth: ', err);
    });
}

function switchReq(token, state) {
  return fetch(`http://192.168.1.184:80/switch/${state}?token=${token}`, { method: 'GET' })
    .then(response => response)
    .then(resp => {
      return resp;
    }).catch(err => {
      console.log('error switch: ', err);
    });
}

function dimmReq(token, value) {
  return fetch(`http://192.168.1.184:80/dimm?dimmval=${value}&token=${token}`, { method: 'GET' })
    .then(response => response)
    .then(resp => {
      return resp;
    }).catch(err => {
      console.log('dimm error: ', err);
    });
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.connectionFree = true;
    this.refreshAnimationFree = true;
    this.token = undefined;
    this.state = {
      buttonText: 'OFF',
      sliderCurrValue: 0,
      connectionStatus: 'Connecting',
      connectionStatusColor: 'gray',
      buttonColor: 'gray',
      disabled: true,
    }
    this.handleSlider = this.handleSlider.bind(this);
    this.handleButton = this.handleButton.bind(this);
    this.sendSliderReq = this.sendSliderReq.bind(this);
    this.handleRefresh = this.handleRefresh.bind(this);
  }
  componentDidMount() {
    if (this.connectionFree) {
      this.connectionFree = false;
      checkStatus().then(data => {
        let statusCode = data.status;
        data.text().then(dataText => {
          this.token = dataText.split(':')[0];
          if (statusCode == 200) {
            let tmp = parseInt(dataText.split(':')[1])
            if(tmp === 0){
              this.setState({
                sliderCurrValue: tmp,
                connectionStatus: 'Connected',
                connectionStatusColor: '#0bb164',
                buttonText: 'OFF',
                buttonColor: '#ea1010'
              });
            } else{
              this.setState({
                sliderCurrValue: tmp,
                connectionStatus: 'Connected',
                connectionStatusColor: '#0bb164',
                buttonText: 'ON',
                buttonColor: '#0bb164'
              });
            }
          } else {
            this.setState({
              connectionStatus: 'Connection failure'
            });
          }
          this.connectionFree = true;
        });
      });
    }
  }

  handleButton() {
    if (this.connectionFree) {
      this.connectionFree = false;
      if (this.state.buttonText === 'OFF') {
        switchReq(this.token, 'on').then(data => {
          if (data.status === 200) {
            data.text().then(dataText => {
              this.setState({
                sliderCurrValue: parseInt(dataText),
                buttonText: 'ON',
                buttonColor: '#0bb164'
              });
            });
          } else {
            this.setState({
              connectionStatus: 'Connection failure'
            });
          }
          this.connectionFree = true;
        });
      } else {
        switchReq(this.token, 'off').then(data => {
          if (data.status == 200) {
            data.text().then(dataText => {
              this.setState({
                buttonText: 'OFF',
                buttonColor: '#ea1010'
              });
            });
          } else {
            this.setState({
              connectionStatus: 'Connection failure'
            });
          }
          this.connectionFree = true;
        });
      }
    }
  }

  handleSlider(e, value) {
    if(this.state.sliderCurrValue !== value){
      this.setState({
        sliderCurrValue: value
      });
    }
  }
  sendSliderReq(e, value) {
    if(this.connectionFree) {
      this.connectionFree = false;
      dimmReq(this.token, value).then(data => {
        if (data.status !== 200) {
          this.setState({
            connectionStatus: 'Connection failure'
          });
        }
        this.connectionFree = true;
      });
    }
  }

  tmp() {
    document.querySelector('.refresh').classList.remove('refreshRotate');
    document.querySelector('.refresh').removeEventListener('animationend', this.tmp);
  }

  handleRefresh(e) {
    if (this.connectionFree) {
      this.connectionFree = false;
      checkStatus().then(data => {
        let statusCode = data.status;
        data.text().then(dataText => {
          this.token = dataText.split(':')[0];
          if (statusCode == 200) {
            let tmp = parseInt(dataText.split(':')[1])
            if(tmp === 0){
              this.setState({
                sliderCurrValue: tmp,
                connectionStatus: 'Connected',
                connectionStatusColor: '#0bb164',
                buttonText: 'OFF',
                buttonColor: '#ea1010'
              });
            } else{
              this.setState({
                sliderCurrValue: tmp,
                connectionStatus: 'Connected',
                connectionStatusColor: '#0bb164',
                buttonText: 'ON',
                buttonColor: '#0bb164'
              });
            }
          } else {
            this.setState({
              connectionStatus: 'Connection failure'
            });
          }
          this.connectionFree = true;
        });
      });
    }

    document.querySelector('.refresh').classList.add('refreshRotate');
    document.querySelector('.refresh').addEventListener('animationend', this.tmp);

  }
  render() {
    return (
      <div className={"container"}>
        <button
          className={this.state.connectionStatus !== 'Connected' ? "refresh disabled" : "refresh"}
          onClick={this.handleRefresh}>
          <RefreshIcon
            fontSize={"large"} />
        </button>
        <button
          onClick={this.handleButton}
          className={this.state.connectionStatus !== 'Connected' ? "switchButton disabled" : "switchButton"}
          style={{ background: this.state.buttonColor }}>
          {this.state.buttonText}
        </button>
        <div className={"connectionStatus"}
          style={{ background: this.state.connectionStatusColor }}> {/*connection status*/}
          <span>{this.state.connectionStatus}</span>
        </div>
        <IOSSlider
          disabled={this.state.buttonText === 'OFF' || this.state.connectionStatus !== "Connected"}
          value={this.state.sliderCurrValue}
          min={0}
          max={30}
          step={1}
          onChange={this.handleSlider}
          onChangeCommitted={this.sendSliderReq}
          aria-labelledby="continuous-slider" />
      </div>
    );
  }
};

export default App;
const iOSBoxShadow = '0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.13),0 0 0 1px rgba(0,0,0,0.02)';
const IOSSlider = withStyles({
  root: {
    color: '#3880ff',
    height: 2,
    padding: '15px 0',
  },
  thumb: {
    height: 28,
    width: 28,
    backgroundColor: '#fff',
    boxShadow: iOSBoxShadow,
    marginTop: -14,
    marginLeft: -14,
    '&:focus, &:hover, &$active': {
      boxShadow: '0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.3),0 0 0 1px rgba(0,0,0,0.02)',
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        boxShadow: iOSBoxShadow,
      },
    },
  },
  active: {},
  valueLabel: {
    left: 'calc(-50% + 12px)',
    top: -22,
    '& *': {
      background: 'transparent',
      color: '#000',
    },
  },
  track: {
    height: 2,
  },
  rail: {
    height: 2,
    opacity: 0.5,
    backgroundColor: '#bfbfbf',
  },
  mark: {
    backgroundColor: '#bfbfbf',
    height: 8,
    width: 1,
    marginTop: -3,
  },
  markActive: {
    opacity: 1,
    backgroundColor: 'currentColor',
  },
})(Slider);