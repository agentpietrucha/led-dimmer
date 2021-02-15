import './App.css';
import React from 'react';
import Slider from '@material-ui/core/Slider';
import RefreshIcon from '@material-ui/icons/Refresh';
import SettingsIcon from '@material-ui/icons/Settings';
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

    if(localStorage.getItem('ipAddress')){
      this.state = {
        settings: false,
        sliderCurrValue: 0,
        sliderMaxValue: 100,
        connectionStatus: 'Connecting',
        connectionStatusColor: 'gray',
        buttonText: 'OFF',
        buttonColor: 'gray',
        disabled: true,
      };
    } else{
      this.state = {
        settings: false,
        sliderCurrValue: 0,
        sliderMaxValue: 100,
        connectionStatus: 'Set IP address',
        connectionStatusColor: 'gray',
        buttonText: 'OFF',
        buttonColor: 'gray',
        disabled: true,
      };
    }

    this.ipAddressHandler = this.ipAddressHandler.bind(this);
    this.handleRefresh = this.handleRefresh.bind(this);
    this.handleButton = this.handleButton.bind(this);
    this.handleSlider = this.handleSlider.bind(this);
    this.sendSliderReq = this.sendSliderReq.bind(this);
    this.handler = this.handler.bind(this);
    this.failureState = this.failureState.bind(this);
    this.handleSettings = this.handleSettings.bind(this);
    this.saveHandler = this.saveHandler.bind(this);
    this.connectingState = this.connectingState.bind(this);
  }

  handler(data){
    if(data !== undefined){
      this.connectingState();
      data.text().then(dataText => {
        if(data.status === 200){
          this.token = dataText.split(':')[0];
          let voltage = parseInt(dataText.split(':')[1]);
          if(voltage === 0){
            this.setState({
              sliderCurrValue: voltage,
              connectionStatus: 'Connected',
              connectionStatusColor: '#0bb164',
              buttonText: 'OFF',
              buttonColor: '#ea1010',
            });
          } else{
            this.setState({
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

  connectingState(){
    this.setState({
      connectionStatus: 'Connecting',
      connectionStatusColor: 'gray',
      buttonText: 'OFF',
      buttonColor: 'gray',
      disabled: true,
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
            connectionStatus: 'Connection failure',
            connectionStatusColor: 'darkred',
          });
        }
      } else{
        this.setState({
          connectionStatus: 'Connection failure',
          connectionStatusColor: 'darkred',
        });
      }
    });
  }

  componentDidMount() {
    if(localStorage.getItem('sliderMaxValue')){
      this.setState({sliderMaxValue: parseInt(localStorage.getItem('sliderMaxValue'))});
    }
    if(localStorage.getItem('ipAddress')){
      this.ipAddress = localStorage.getItem('ipAddress');
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
    this.ipAddress= document.getElementById('ipAddress').value;
    localStorage.setItem('ipAddress', this.ipAddress);
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
                  sliderCurrValue: voltage,
                  connectionStatus: 'Connected',
                  connectionStatusColor: '#0bb164',
                  buttonText: 'OFF',
                  buttonColor: '#ea1010',
                });
              } else{
                this.setState({
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

  handleSettings(){
    if(window.screen.width < 480){ // mobile
      if(!this.state.settings){
        document.querySelector('.settingsContainer').style.opacity = 1;
        document.querySelector('.settingsContainer').style.top = '160px';
      } else{
        document.querySelector('.settingsContainer').style.top = '700px';
      }
    } else{ // desktop
      if(!this.state.settings){
        document.querySelector('.settingsContainer').style.top = '160px';
        document.querySelector('.settingsContainer').style.opacity = 1;
      } else{
        document.querySelector('.settingsContainer').style.opacity = 0;
      }
    }
    this.setState({
      settings: !this.state.settings
    });
  }

  saveHandler(){
    this.ipAddress = document.getElementById('ipAddress').value;
    localStorage.setItem('ipAddress', this.ipAddress);
    localStorage.setItem('sliderMaxValue', parseInt(document.getElementById('sliderMaxValue').value));

    if(this.ipAddress !== null && this.ipAddress !== ''){
      checkStatus(this.ipAddress, this).then(data => {
        this.connectionFree = true;
        this.handler(data);
      });
      this.setState({
        settings: false,
        sliderMaxValue: parseInt(document.getElementById('sliderMaxValue').value),
      });
      if(window.screen.width < 480){
        document.querySelector('.settingsContainer').style.top = '700px';
      } else{
        document.querySelector('.settingsContainer').style.opacity = 0;
      }
    } else{
      this.setState({
        connectionStatus: 'Set IP address',
        connectionStatusColor: 'gray',
        buttonText: 'OFF',
        buttonColor: 'gray',
        disabled: true,
      })
    }
    window.scrollTo(0, 0);
  }
  render(){
    return(
      <div className="container">
        <button
          className="refresh"
          onClick={ this.handleRefresh }>
          <RefreshIcon fontSize="large"/>
        </button>
        <button
          className="settings"
          onClick={ this.handleSettings }>
          <SettingsIcon fontSize="large"/>
        </button>
        <Settings handler={ this.saveHandler } ipAddress_value={this.ipAddress} sliderMaxValue_value={this.state.sliderMaxValue}/>
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
          max={this.state.sliderMaxValue}
          step={1}
          onChange={this.handleSlider}
          onChangeCommitted={this.sendSliderReq}
          aria-labelledby="continuous-slider"/>
      </div>
    );
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