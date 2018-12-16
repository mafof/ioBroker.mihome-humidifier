const RecursiveUtils = require('./recursiveUtility');
const MiIO = require('miio-controller');

class HumidifierUtility extends RecursiveUtils {
    constructor(adapter) {
        super(adapter);

        this.poolingInterval = this.adapter.config.poolingInterval * 1000;
        this.listenerState = new MiIO(this.token, this.ip, 3000, this.adapter.config.port);
        this.miioSendMessage = new MiIO(this.token, this.ip, 3000, this.adapter.config.port);
    }

    recursiveGettingDeviceStates() {
        this.checkHandshakeListener()
            .then(this.sendCommandGettingAllStatesDevice.bind(this))
            .then(res => {
                if(res.result !== undefined) this.updateDataState(res.result);
                else if(res.error.code != -9999) this.adapter.log.warn("error with get data states. Code error " + res.error.code + " message " + res.error.message);
                
                this.updateAvailabilityDevice(true);
                setTimeout(this.recursiveGettingDeviceStates.bind(this), this.poolingInterval);
            })
            .catch(err => {
                    this.updateAvailabilityDevice(false);
                    this.listenerState.__isHandshake = false;

                    if(err.message != "invalid config") setTimeout(this.recursiveGettingDeviceStates.bind(this), this.poolingInterval);
            })
    }

    sendCommand(command, value, id) {
        this.checkHandshakeSocketMiioSendMessage()
            .then(this.sendCustomCommand.bind(this, command, value))
            .then(res => {
                this._data[id] = value[0];
                if(res.result !== undefined) this.adapter.setState(id, {ack: true});
                else this.adapter.log.warn("error send command code " + res.error.code + " message " + res.error.message);
                this.updateAvailabilityDevice(true);
            })
            .catch(err => {
                this.updateAvailabilityDevice(false);
                this.miioSendMessage.__isHandshake = false;
                
                this.adapter.log.error(err.name + " " + err.message + " " + err.stack);
            })
    }

    onStateChange(id, state) {
        id = id.split(/([0-9]\.)/)[2];
        let value = (id == "control.power" || id == "control.buzzer") ? (state.val) ? "on" : "off" : state.val;
        let command = "";

        if(id == "control.led") {
            command = "set_led_b";
            value = String(value);
        } else  {
            command = "set_" + id.split(".")[1];
        }

        this.sendCommand(command, [value], id);
    }

    checkHandshakeListener() {
        return new Promise((resolve, reject) => {
            if(this.ip === undefined || this.ip === null || this.ip === "") {
                reject(new Error("invalid config")); 
            }

            if((Date.now() - this.listenerState.__isHandshake) < 120000 && this.listenerState.__isHandshake !== false) return resolve(true);

            this.listenerState.__isHandshake = Date.now();
            
            this.listenerState.handshake()
                .then(res => {
                    resolve(true)
                })
                .catch(err => reject(err));

        })
    }

    checkHandshakeSocketMiioSendMessage() {
        return new Promise((resolve, reject) => {
            
            if((Date.now() - this.miioSendMessage.__isHandshake) < 120000 && this.miioSendMessage.__isHandshake !== false) return resolve(true);

            this.miioSendMessage.__isHandshake = Date.now();
            
            this.miioSendMessage.handshake()
                .then(res => {
                    resolve(true)
                })
                .catch(err => reject(err));

        })
    }

    sendCommandGettingAllStatesDevice() {
        return this.listenerState.sendCommand('get_prop', ["power", "mode", "led", "buzzer", "limit_hum", "depth", "speed", "temp", "humidity"]);
    }

    sendCustomCommand(command, value) {
        return this.miioSendMessage.sendCommand(command, value);
    }
}

module.exports = HumidifierUtility;