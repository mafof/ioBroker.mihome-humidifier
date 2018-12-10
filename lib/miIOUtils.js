const miIO = require('miio-controller');

function miIOUtils(adapter) {
    this.adapter = adapter;
    this.miio = new miIO(this.adapter.config.token, this.adapter.config.ip, 3000, this.adapter.config.port);
    this._handshake = false;
    this.data = null;
}

miIOUtils.prototype.handshake = async function() {
    try {
        await this.miio.handshake();
        return this._handshake = true;
    } catch(err) {
        this.adapter.log.error(err.name + " " + err.message);
        return false;
    }
}

miIOUtils.prototype.updateAllState = function() {
    if(!this._handshake) return false;
    this.reverseUpdateAllState();
}

miIOUtils.prototype.delay = async function(number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(true);
        }, number);
    })
}

miIOUtils.prototype.updateState = function(states) {
    if(this.data == null) {
        this.data = {
            "control.power":  (states[0] == "on") ? true : false,
            "control.mode":   states[1],
            "control.led":    Number(states[2]),
            "control.buzzer": (states[3] == "on") ? true : false,
            "info.depth":  Number(states[4]),
            "info.speed":  Number(states[5])
        }

        for(let key in this.data) {
            this.adapter.setState(key, this.data[key], true);
        }
    } else {
        let index = 0;
        for(let key in this.data) {
            if(((key == "control.power" || key == "control.buzzer") ? (this.data[key]) ? "on" : "off" : this.data[key]) != states[index]) {
                this.adapter.setState(key, (key == "control.power" || key == "control.buzzer") ? (states[index] == "on") ? true : false : states[index], true);
                this.data[key] = (key == "control.power" || key == "control.buzzer") ? (states[index] == "on") ? true : false : states[index];
            }
            ++index;
        }
    }
}

miIOUtils.prototype.reverseUpdateAllState = async function() {
    try {
        let res = await this.miio.sendCommand('get_prop', ["power", "mode", "led", "buzzer", "depth", "speed"]);
        
        if(res.result != undefined || res.result != null)
            this.updateState(res.result)
        else
            this.adapter.log.error("command get_prop not complete");

        await this.delay(1000);
        this.reverseUpdateAllState();
    } catch(err) {
        this.adapter.log.error("device is not response to command, repear...");
        this.reverseUpdateAllState();
    }
}

module.exports = miIOUtils;