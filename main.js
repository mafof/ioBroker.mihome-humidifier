/* jshint -W097 */// jshint strict:false
/*jslint node: true */
'use strict';

const utils = require(__dirname + '/lib/utils');

const adapter = new utils.Adapter('mihome-humidifier');
const HumidifierUtils = require(__dirname + '/lib/humidifier/humidifierUtility.js');

var humidifier;

adapter.on('unload', function (callback) {
    try {
        adapter.log.info('cleaned everything up...');
        callback();
    } catch (e) {
        callback();
    }
});

adapter.on('stateChange', function (id, state) {
    if (state && !state.ack) {
        humidifier.onStateChange(id, state);
    }
});

adapter.on('ready', function () {
    main();
});

function main() {
    setNameInstanceAdapter(adapter.config.name || "Humidifier");
    
    adapter.setState('info.name', adapter.config.name, true);
    adapter.setState('info.address', adapter.config.ip, true);
    adapter.setState('info.token', adapter.config.token, true);
    adapter.setState('info.port', adapter.config.port, true);
    adapter.setState('info.availability', false, true);
    adapter.subscribeStates('*');

    humidifier = new HumidifierUtils(adapter);
    humidifier.recursiveGettingDeviceStates();

    // examples for the checkPassword/checkGroup functions
    adapter.checkPassword('admin', 'iobroker', function (res) {
        console.log('check user admin pw ioboker: ' + res);
    });

    adapter.checkGroup('admin', 'admin', function (res) {
        console.log('check group user admin group admin: ' + res);
    });
}

function setNameInstanceAdapter(name) {
    if(typeof name != "string") return false;

    let instanceName = adapter.name + '.' + adapter.instance;

    adapter.objects.getObject(instanceName, function (err, obj) {
        if(err) return adapter.log.error(err), false;
        
        obj.common.name = name;
        adapter.objects.setObject(instanceName, obj);
    });
}