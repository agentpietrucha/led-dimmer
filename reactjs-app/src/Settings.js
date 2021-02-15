import './App.css';
import React, { Component } from 'react';

export default class Settings extends Component{
  render(){
    return(
      <div className="settingsContainer" style={{opacity: this.props.opacity}}>
        <label>
          IP address:
          <input type="text" name="ip_address" id="ipAddress" defaultValue={this.props.ipAddress_value ? this.props.ipAddress_value : ''}/>
        </label>
        <label>
          Slider max value:
          <input type="text" name="sliderMaxValue" id="sliderMaxValue" defaultValue={this.props.sliderMaxValue_value ? this.props.sliderMaxValue_value : ''}/>
        </label>
        <button className="saveButton" onClick={this.props.handler}>Save</button>
      </div>
    );
  }
}