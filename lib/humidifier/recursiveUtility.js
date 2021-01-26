/**
 * Class helper, that helps method for recursive getting all states
 */

class RecursiveUtils {
    constructor(adapter) {
        this.adapter = adapter;
        this.ip = this.adapter.config.ip;
        this.token = this.adapter.config.token;
        this._data = null;
    }

    updateDataState(states) {
        if(states == null) return;
        
        if(this._data == null) {
            this._data = {
                "control.power":     states[0],
                "control.mode":      states[1],
                "control.led":       states[2],
                "control.buzzer":    states[3],
                "control.limit_hum": states[4],
                "info.depth":        states[5],
                "info.speed":        states[6],
                "info.temp":         states[7],
                "info.humidity":     states[8],
                "control.child_lock":states[9],
                "control.dry":       states[10]
            }

            for(let key in this._data) {
                this.adapter.setState(key, this.data(key), true);
            }
        } else {
            let index = 0;
            for(let key in this._data) {
                if(this._data[key] != states[index]) {
                    this._data[key] = states[index];
                    this.adapter.setState(key, this.data(key), true);
                }
                index++;
            }
        }
    }

    /**
     * Getting value then valid for adapter
     * @returns {string|boolean} value
     */
    data(type) {
        if(type === "control.power" || type === "control.buzzer" || type === "control.child_lock" || type === "control.dry") return (this._data[type] === "on")
        else if(type === "info.temp") return (this._data[type] > 100) ? this._data[type]/10 : (this._data[type]);
        else if(type === "info.depth") return (this._data[type] > 120) ? 100 : Math.floor(this._data[type]/1.2);
        else return this._data[type];
    }

    updateAvailabilityDevice(value) {
        if(typeof value != "boolean") return;

        this.adapter.getState('info.availability', (err, state) => {
            if(state.val !== value) {
                this.adapter.setState('info.availability', value, true);
            }
        });
    }
}

module.exports = RecursiveUtils;
