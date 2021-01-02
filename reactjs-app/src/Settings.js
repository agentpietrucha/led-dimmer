import './App.css';
import React, { Component } from 'react';

export default class Settings extends Component{
  render(){
    return(
      <div className="settingsContainer">
        <form onSubmit={e => { e.preventDefault(); }}>
          <label>
            IP address:
            <input type="text" name="ip_address" id="ip_address"/>
          </label>
        </form>
         <button
            onClick={this.props.handler}>
            Let's go
          </button>
      </div>
    );
  }
}