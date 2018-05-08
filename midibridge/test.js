// {"midi":["channel 1","on 36 50","off 36 0"]}

const INPUT_ID = 3;
const OUTPUT_ID = 3;
const OUTPUT_ID2 = 0;

const midi = require('midi');

const input = new midi.input();
const output = new midi.output();

console.log('Inputs:');
for(var i=0; i<input.getPortCount(); i++) {
    console.log('Input #'+i+': ' + input.getPortName(i));
}
console.log();

console.log('Outputs:');
for(var i=0; i<output.getPortCount(); i++) {
    console.log('Output #'+i+': ' + output.getPortName(i));
}
console.log();

input.on('message', function(deltaTime, message) {
    // console.log('m:', message);
    ws.send(JSON.stringify({
        rawmidi: message
    }))
});

input.openPort(INPUT_ID);
output.openPort(OUTPUT_ID);
const output2 = new midi.output();
output2.openPort(OUTPUT_ID2);

const WebSocket = require('ws');

const ws = new WebSocket('ws://stagecast.se/api/events/livehacks/ws?x-user-listener=1');

ws.on('open', function open() {
    // ws.send('something');
});

var shake = 0;

var values1 = [];
var values2 = [];

var value = 64.0;
var tvalue = 0.0;
var lvalue = 0;
var dvalue = 0;

var value2 = 64.0;
var tvalue2 = 0.0;
var lvalue2 = 0;
var dvalue2 = 0;

var flash1 = 120;
var flash2 = 120;
var flash3 = 120;
var flash4 = 120;
var lflash1 = 0;
var lflash2 = 0;
var lflash3 = 0;
var lflash4 = 0;

setInterval(() => {
    var t;

    if (values1.length > 0) {
        t = 0;
        values1.forEach(v => t += v);
        t /= values1.length;
        tvalue = t;
    }

    if (values2.length > 0) {
        t = 0;
        values2.forEach(v => t += v);
        t /= values2.length;
        tvalue2 = t;
    }

    dvalue = dvalue * 0.8 + (tvalue - value) * 0.1;
    dvalue2 = dvalue2 * 0.8 + (tvalue2 - value2) * 0.1;

    value += dvalue * 0.8;
    value2 += dvalue2 * 0.8;

    // value += shake * 3;
    // value *= 0.95;

    // console.log('value='+Math.round(value)+' (' + Math.round(tvalue) +'), value2='+Math.round(value2) + ' (' + Math.round(tvalue2) + ')');

    t = Math.min(127, Math.max(5, Math.floor(0 + value * 1.1)));
    if (t != lvalue) {
        lvalue = t;
        console.log('send cutoff', t);
        output.sendMessage([0xB0, 18, t]); // cutoff
        output2.sendMessage([0xB0, 18, t]); // cutoff
    }

    t = Math.min(120, Math.max(5, Math.floor(64 + value2 * 0.66)));
    if (t != lvalue2) {
        lvalue2 = t;
        console.log('send resonance', t);
        output.sendMessage([0xB0, 89, t]); // reso
        output2.sendMessage([0xB0, 89, t]); // cutoff
    }

    t = Math.min(127, Math.max(0, Math.floor(flash1)));
    if (t != lflash1) {
        lflash1 = t;
        console.log('send flash1', t);
        output.sendMessage([0xB0, 40, t]);
        output2.sendMessage([0xB0, 40, t]);
    }

    t = Math.min(127, Math.max(0, Math.floor(flash2)));
    if (t != lflash2) {
        lflash2 = t;
        console.log('send flash2', t);
        output.sendMessage([0xB0, 41, t]);
        output2.sendMessage([0xB0, 41, t]);
    }

    t = Math.min(127, Math.max(0, Math.floor(flash3)));
    if (t != lflash3) {
        lflash3 = t;
        console.log('send flash3', t);
        output.sendMessage([0xB0, 42, t]);
        output2.sendMessage([0xB0, 42, t]);
    }

    t = Math.min(127, Math.max(0, Math.floor(flash4)));
    if (t != lflash4) {
        lflash4 = t;
        console.log('send flash4', t);
        output.sendMessage([0xB0, 43, t]);
        output2.sendMessage([0xB0, 43, t]);
    }

    // shake = 0;
    values1 = [];
    values2 = [];

    flash1 *= 0.95;
    flash2 *= 0.95;
    flash3 *= 0.95;
    flash4 *= 0.95;
}, 40);

function handleMessage(m) {
    // console.log('handle json message', m)
    if (!m.msg) {
        return;
    }

    if (m.msg.rawmidi) {
        output.sendMessage(m.msg.rawmidi);
    }

    if (m.msg.mode === 'tilt') {
        if (m.msg.rawacc) {
            values1.push(Math.abs(m.msg.rawacc[1])); // x
            values2.push(-m.msg.rawacc[2]); // y
        }
    }

    if (m.msg.mode === 'colors') {
        if (m.msg.button === 'a') { flash1 = 127; }
        if (m.msg.button === 'b') { flash2 = 127; }
        if (m.msg.button === 'c') { flash3 = 127; }
        if (m.msg.button === 'd') { flash4 = 127; }
    }
}

ws.on('message', data => {
    // console.log('websocket data', data);
    try {
        data = JSON.parse(data);
        handleMessage(data);
    } catch(e) {

    }
});
