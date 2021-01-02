import './App.css';
import React from 'react';
import Slider from '@material-ui/core/Slider';
import RefreshIcon from '@material-ui/icons/Refresh';
import { withStyles } from '@material-ui/core/styles';
import Settings from './Settings.js';


function checkStatus(ip, x) {
  return fetch(`http://${ip}/auth?key=sawicki`, { method: 'GET' })
    .then(response => response)
    .then((resp) => {
      return resp;
    }).catch(err => {
      console.log('error auth: ', err);
      x.failureState();
    });
}

function switchReq(ip, token, state, x) {
  return fetch(`http://${ip}/switch/${state}?token=${token}`, { method: 'GET' })
    .then(response => response)
    .then(resp => {
      return resp;
    }).catch(err => {
      console.log('error switch: ', err);
      x.failureState();
    });
}

function dimmReq(ip, token, value, x) {
  return fetch(`http://${ip}/dimm?dimmval=${value}&token=${token}`, { method: 'GET' })
    .then(response => response)
    .then(resp => {
      return resp;
    }).catch(err => {
      console.log('dimm error: ', err);
      x.failureState();
    });
}


export default class App extends React.Component{
  constructor(props) {
    super(props);
    this.ipAddress = null;
    this.connectionFree = true;
    this.token = null;

    if(localStorage.getItem('ip_address')){
      this.state = {
        settings: false,
        sliderCurrValue: 0,
        connectionStatus: 'Connecting',
        connectionStatusColor: 'gray',
        buttonText: 'OFF',
        buttonColor: 'gray',
        disabled: true,
      };
    } else{
      this.state = {
        settings: true,
        sliderCurrValue: 0,
        connectionStatus: 'Connecting',
        connectionStatusColor: 'gray',
        buttonText: 'OFF',
        buttonColor: 'gray',
      };
    }

    this.ipAddressHandler = this.ipAddressHandler.bind(this);
    this.handleRefresh = this.handleRefresh.bind(this);
    this.handleButton = this.handleButton.bind(this);
    this.handleSlider = this.handleSlider.bind(this);
    this.sendSliderReq = this.sendSliderReq.bind(this);
    this.handler = this.handler.bind(this);
    this.failureState = this.failureState.bind(this);
  }

  handler(data){
    if(data !== undefined){
      data.text().then(dataText => {
        if(data.status === 200){
          this.token = dataText.split(':')[0];
          let voltage = parseInt(dataText.split(':')[1]);
          if(voltage === 0){
            this.setState({
              settings: false,
              sliderCurrValue: voltage,
              connectionStatus: 'Connected',
              connectionStatusColor: '#0bb164',
              buttonText: 'OFF',
              buttonColor: '#ea1010',
            });
          } else{
            this.setState({
              settings: false,
              sliderCurrValue: voltage,
              connectionStatus: 'Connected',
              connectionStatusColor: '#0bb164',
              buttonText: 'ON',
              buttonColor: '#0bb164',
            });
          }
        } else{
          this.failureState();
        }
      });
    } else{
      this.failureState();
    }
  }

  failureState(){
    this.setState({
      settings: false,
      connectionStatus: 'Connection failure',
      connectionStatusColor: 'darkred'
    });
  }

  switchHandler(state){
    let color;
    if(state === 'on'){
      color = '#0bb164';
    } else{
      color = '#ea1010';
    }

    switchReq(this.ipAddress, this.token, state, this).then(data => {
      this.connectionFree = true;
      if(data !== undefined){
        if(data.status === 200){
          data.text().then(dataText => {
            this.setState({
              sliderCurrValue: parseInt(dataText),
              buttonText: state.toUpperCase(),
              buttonColor: color
            });
          });
        } else{
          this.setState({
            // settings: false,
            connectionStatus: 'Connection failure',
            connectionStatusColor: 'darkred',
          });
        }
      } else{
        this.setState({
          // settings: false,
          connectionStatus: 'Connection failure',
          connectionStatusColor: 'darkred',
        });
      }
    });
  }

  componentDidMount() {
    if(localStorage.getItem('ip_address')){
      this.ipAddress = localStorage.getItem('ip_address');

      if(this.connectionFree){
        this.connectionFree = false;
        checkStatus(this.ipAddress, this).then(data => {
          this.connectionFree = true;
          this.handler(data);
        });
      }
    }
  }

  ipAddressHandler(){
    this.ipAddress= document.getElementById('ip_address').value;
    localStorage.setItem('ip_address', this.ipAddress);
    if(this.connectionFree){
      this.connectionFree = false;
      checkStatus(this.ipAddress, this).then(data => {
        this.connectionFree = true;
        if(data !== undefined){
          data.text().then(dataText => {
            if(data.status === 200){
              this.token = dataText.split(':')[0];
              let voltage = parseInt(dataText.split(':')[1]);
              if(voltage === 0){
                this.setState({
                  settings: false,
                  sliderCurrValue: voltage,
                  connectionStatus: 'Connected',
                  connectionStatusColor: '#0bb164',
                  buttonText: 'OFF',
                  buttonColor: '#ea1010',
                });
              } else{
                this.setState({
                  settings: false,
                  sliderCurrValue: voltage,
                  connectionStatus: 'Connected',
                  connectionStatusColor: '#0bb164',
                  buttonText: 'ON',
                  buttonColor: '#0bb164',
                });
              }
            } else{
              this.failureState();
            }
          })
        } else{
          this.failureState();
        }
      })
    }
  }

  handleRefresh(){
    if(this.connectionFree){
      this.connectionFree = false;
      checkStatus(this.ipAddress, this).then(data => {
        this.connectionFree = true;
        this.handler(data);
      });
    }
  }

  handleButton(e){
    if(this.connectionFree){
      this.connectionFree = false;
      if(this.state.buttonText === 'OFF'){
        this.switchHandler('on');
      } else{
        this.switchHandler('off');
      }
    }
  }

  handleSlider(e, value){
    if(this.state.sliderCurrValue !== value){
      this.setState({
        sliderCurrValue: value
      });
    }
  }

  sendSliderReq(e, value){
    if(this.connectionFree){
      this.connectionFree = false;
      dimmReq(this.ipAddress, this.token, value, this).then(data => {
        this.connectionFree = true;
        if(data !== undefined){
          if(data.status !== 200){
            this.failureState();
          }
        } else{
          this.failureState();
        }
      });
    }
  }

  render(){
    if(this.state.settings){
      return(
        <Settings handler={ this.ipAddressHandler }/>
      );
    } else{
      return(
        <div className="container">
          <button
            className="refresh"
          onClick={ this.handleRefresh }>
            <RefreshIcon fontSize="large"/>
          </button>
          <button
            onClick={this.handleButton}
            className={this.state.connectionStatus !== 'Connected' ? "switchButton disabled" : "switchButton"}
            style={{ background: this.state.buttonColor }}>
            { this.state.buttonText }
          </button>
          <div
            className="connectionStatus"
            style={{ background: this.state.connectionStatusColor }}>
            <span>{ this.state.connectionStatus }</span>
          </div>
          <IOSSlider
            disabled={ this.state.buttonText === 'OFF' || this.state.connectionStatus !== 'Connected' }
            value={ this.state.sliderCurrValue }
            min={0}
            max={30}
            step={1}
            onChange={this.handleSlider}
            onChangeCommitted={this.sendSliderReq}
            aria-labelledby="continuous-slider"/>
        </div>
      );
    }
  }
}
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