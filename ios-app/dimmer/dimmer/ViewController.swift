//
//  ViewController.swift
//  dimmer
//
//  Created by Karolek on 28/12/2020.
//

import UIKit

class ViewController: UIViewController {

    private var connectionFree: Bool = true

    private var serverToken: String?

    @IBOutlet var connectionStatusBar: UILabel!
    @IBOutlet var slider: UISlider!
    @IBOutlet var button: UIButton!
    private var switchButtonOn: Bool = false
    private var sliderValue: Float?

    let session = URLSession.shared
    var dataTask: URLSessionDataTask?
    let url = "http://192.168.1.184/"

    override func viewDidLoad() {
        super.viewDidLoad()
        let notificationCenter = NotificationCenter.default
        notificationCenter.addObserver(self, selector: #selector(foregroundCall), name: UIApplication.didBecomeActiveNotification, object: nil)
        notificationCenter.addObserver(self, selector: #selector(backgroundCall), name: UIApplication.willResignActiveNotification, object: nil)

        DispatchQueue.main.async {
            self.button.backgroundColor = UIColor.gray
            self.disableSlider()
            self.button.isEnabled = false
        }

        self.checkStatus()

        if let sval = self.sliderValue{
            self.slider.value = Float(sval)
        } else{
            self.slider.value = 0
        }
    }

    @IBAction func reload(_ sender: UIButton){
        print("connection free: \(self.connectionFree)")
        if self.connectionFree{
            self.checkStatus()
        }
    }
    
    @IBAction func handleSlider(_ sender: UISlider){
        let value: Float = sender.value
        print("slider value: \(value)")
        if sliderValue != value{
            sliderValue = value
        }
        if self.connectionFree{
            self.connectionFree = false
            self.dataTask?.cancel()
            let url = URLComponents(string: self.url+"dimm?dimmval="+String(Int(value))+"&token="+self.serverToken!)
            if let url = url{
                guard let url = url.url else{
                    print("dimmer error")
                    return
                }
                self.dataTask = session.dataTask(with: url){ data, response, error in
                    defer{
                        self.dataTask = nil
                        self.connectionFree = true
                    }
                    if let error = error{
                        print("error in dimmer: \(error)")
                        return
                    }
                }
            }
            self.dataTask?.resume()
        }
    }

    @IBAction func handleButton(_ sender: UIButton){
        if self.connectionFree{
            self.connectionFree = false
            self.dataTask?.cancel()
            if !switchButtonOn{
                let url = URLComponents(string: self.url+"switch/on?token="+self.serverToken!)
                DispatchQueue.main.async {
                    self.buttonOn()
                }

                if let url = url{
                    guard let url = url.url else{
                        print("some shit wrong")
                        return
                    }
                    self.dataTask = session.dataTask(with: url){ data, response, error in
                        defer{
                            self.dataTask = nil
                            self.connectionFree = true
                        }
                        if let error = error{
                            print("error in dataTask handleButton(): \(error.localizedDescription)")
                            DispatchQueue.main.async {
                                self.updateconnectionStatusBar(text: "Connection failure", color: .systemRed)
                                self.disableSlider()
                                self.button.isEnabled = false
                            }
                            return
                        }
                        if let data = data, let dataString = String(data: data, encoding: .utf8), let response = response as? HTTPURLResponse{
                            if response.statusCode == 200{
                                DispatchQueue.main.async {
                                    self.enableSlider()
                                    self.slider.value = Float(dataString)!
                                }
                            }
                        }
                    }
                }
                self.dataTask?.resume()

            } else{
                DispatchQueue.main.async {
                    self.buttonOf()
                }
                let url = URLComponents(string: self.url+"switch/off?token="+self.serverToken!)
                if let url = url{
                    guard let url = url.url else{
                        print("some shit wrong")
                        return
                    }
                    self.dataTask = session.dataTask(with: url){ data, response, error in
                        defer{
                            self.dataTask = nil
                            self.connectionFree = true
                        }
                        if let error = error{
                            print("error in dataTask: \(error.localizedDescription)")
                            DispatchQueue.main.async {
                                self.updateconnectionStatusBar(text: "Connection failure", color: .systemRed)
                                self.disableSlider()
                                self.button.isEnabled = false
                            }
                            return
                        }
                        if let response = response as? HTTPURLResponse{
                            if response.statusCode == 200{
                                DispatchQueue.main.async {
                                    self.disableSlider()
                                }
                            }
                        }
                    }
                }
                self.dataTask?.resume()
            }
        }
    }
}

extension ViewController{
    private func checkStatus(){
        if self.connectionFree{
            self.connectionFree = false
            DispatchQueue.main.async {
                self.updateconnectionStatusBar(text: "Connecting...", color: .gray)
                self.disableSlider()
                self.buttonOf()
            }
            self.dataTask?.cancel()
            let url = URLComponents(string: self.url + "auth?key=sawicki")
            if let url = url{
                guard let url = url.url else{
                    print("url failure")
                    return
                }
                self.dataTask = session.dataTask(with: url){ data, response, error in
                    defer{
                        self.dataTask = nil
                        self.connectionFree = true
                    }
                    if let error = error{
                        print("error in datatask in checkStatus(): \(error)")
                        DispatchQueue.main.async {
                            self.updateconnectionStatusBar(text: "Connection failure", color: .systemRed)
                            self.disableSlider()
                            self.button.isEnabled = false
                        }
                        return
                    }
                    if let data = data, let dataString = String(data: data, encoding: .utf8), let response = response as? HTTPURLResponse{
                        if response.statusCode == 200{
                            let tmp = dataString.components(separatedBy: ":")
                            self.serverToken = tmp.first
                            self.sliderValue = Float(tmp.last!)
                            DispatchQueue.main.async {
                                self.updateconnectionStatusBar(text: "Connected", color: .systemGreen)
                                self.slider.value = self.sliderValue!
                                if self.sliderValue == 0{
                                    self.disableSlider()
                                    self.buttonOf()
                                } else{
                                    self.enableSlider()
                                    self.buttonOn()
                                }
                                self.button.isEnabled = true
                            }
                        } else{
                            DispatchQueue.main.async {
                                self.updateconnectionStatusBar(text: "Connection failure", color: .systemRed)
                                self.disableSlider()
                                self.button.isEnabled = false
                            }
                        }
                    }
                    print("end of datatask")
                }
            }
            self.dataTask?.resume()
            print("after datatask resume")
        }
    }

    @objc func foregroundCall() {
        if self.connectionFree{
            self.checkStatus()
        }
    }

    @objc func backgroundCall() {
        session.invalidateAndCancel()
        self.connectionFree = true
    }
    private func updateconnectionStatusBar(text: String, color: UIColor){
        self.connectionStatusBar.text = text
        self.connectionStatusBar.backgroundColor = color
    }
    private func disableSlider(){
        self.slider.isEnabled = false
        self.slider.alpha = 0.5
    }
    private func enableSlider(){
        self.slider.isEnabled = true
        self.slider.alpha = 1.0
    }
    private func buttonOn(){
        self.switchButtonOn = true
        self.button.backgroundColor = UIColor.systemGreen
        self.button.setTitle("ON", for: .normal)
    }
    private func buttonOf(){
        self.switchButtonOn = false
        self.button.backgroundColor = UIColor.gray
        self.button.setTitle("OFF", for: .normal)
    }
}
