var spawn = require('child_process').spawn;
var Event = require('events');

module.exports = function (args) {
    var that = this;
    this.options = {};
    this.defaults = {
        device: '/dev/input/js0'
    };

    that.options = that.defaults;

    if (args) {
        if (typeof args.options === 'object') {
            that.options = Object.assign(that.defaults, args.options);
        }
    }

    this.event = null;
    this.process = null;
    this.raw = null;

    this.yaw = null;
    this.pitch = null;
    this.thottle = null;
    this.fire = null;
    this.fire_alt = null;

    this.init = function () {
        that.event = new Event();
        that.on('start', function () {
            console.log(' STARTING JOYSTICK ... ');
        });
        that.on('ready', function () {
            console.log(' JOYSTICK IS UP AND RUNNING ');
        });
        that.on('changed', function () {
            //console.log(' JOYSTICK DATA: ', that.data);
        });

        that.yaw = new Axis('yaw');
        that.pitch = new Axis('pitch');
        that.throttle = new Axis('throttle');
        that.fire = new Button('fire');
        that.fire_alt = new Button('fire_alt');

        that.yaw.on('change', function () {
            //console.log(' YAW:', that.yaw.val());
        });
        that.pitch.on('change', function () {
            //console.log(' PITCH:', that.pitch.val());
        });
        that.throttle.on('change', function () {
            //console.log(' THROTTLE:', that.throttle.val());
        });
        that.fire.on('change', function () {
            //console.log(' FIRE:', that.fire.val());
        });
        that.fire_alt.on('change', function () {
            //console.log(' FIRE ALT:', that.fire_alt.val());
        });

        that.run();
    };

    this.run = function () {
        that.emit('start');
        var options = [that.options.device];
        var last_chunk = '';

        that.process = spawn('jstest', options);
        that.process.stdout.setEncoding('utf8');
        that.process.stderr.setEncoding('utf8');

        that.process.stdout.on('data', function (chunk) {
            that.parseConsole(chunk);
        });

        that.process.stderr.on('end', function () {
            console.log(' CLI: ', last_chunk);
        });

        that.emit('ready');
    };

    this.parseConsole = function (chunk) {
        var state_map = {
            'on': true,
            'off': false
        };
        chunk = chunk
            .replace(/\rAxes:  |Buttons:  |0:|1:|2:|3:|4:|5:|6:|7:/gi, '')
            .replace(/  /gi, ' ');

        var arr = chunk.split(' ');

        if (arr[0] === 'Driver') // the first keyword in the inital console print from jstest
            return;

        arr = arr.filter(function (i) {
            if (i != '') {
                return true;
            }
        });
        that.raw = arr;
        that.data = {
            axis: {
                yaw: parseInt(arr[0]),
                pitch: parseInt(arr[1]),
                throttle: parseInt(arr[2])
            },
            button: {
                f1: state_map[arr[6]],
                f2: state_map[arr[7]],
                f3: state_map[arr[8]],
                f4: state_map[arr[9]],
                f5: state_map[arr[10]],
                f6: state_map[arr[11]],
                f7: state_map[arr[12]],
                f8: state_map[arr[13]]
            }
        };

        that.yaw.setVal(arr[0]);
        that.pitch.setVal(arr[1]);
        that.throttle.setVal(arr[2]);
        that.fire.setVal(state_map[arr[6]]);
        that.fire_alt.setVal(state_map[arr[7]]);


        that.emit('changed', that.data);
    };

    this.quit = function () {

    };

    // on event wrapper
    this.on = function () {
        that.event.on.apply(that.event, Array.from(arguments));
    };

    // emit event wrapper
    this.emit = function () {
        that.event.emit.apply(that.event, Array.from(arguments));
    };

    that.init();

    return {
        start: that.start,

        yaw: that.yaw,
        pitch: that.pitch,
        throttle: that.throttle,
        fire: that.fire,
        fire_alt: that.fire_alt,

        on: that.on,
        emit: that.emit
    };
};

//
//  Axis
//
var Axis = function (axis) {
    var that = this;
    this.event = null;

    this.name = null;
    this.value = 0;

    this.init = function () {
        that.event = new Event();
        that.name = axis;

        that.on('change', function () {
            //console.log(' AXIS CHANGED: ', that.name, that.value);
        });
    };

    this.setVal = function (val) {
        if (that.value === val)
            return;

        that.value = val;
        that.emit('change', that);
    };

    this.setName = function (name) {
        that.name = name;
    };

    this.val = function () {
        return that.value;
    };

    this.getName = function(){
        return that.name;
    };

    // on event wrapper
    this.on = function () {
        that.event.on.apply(that.event, Array.from(arguments));
    };

    // emit event wrapper
    this.emit = function () {
        that.event.emit.apply(that.event, Array.from(arguments));
    };

    that.init();

    return {
        setVal: that.setVal,
        setName: that.setName,
        val: that.val,
        getName: that.getName,
        on: that.on,
        emit: that.emit
    };
};


//
// Button
//
var Button = function (axis) {
    var that = this;
    this.event = null;

    this.name = null;
    this.value = null;

    this.init = function () {
        that.event = new Event();
        that.name = axis;

        that.on('change', function () {
            //console.log(' BUTTON CHANGED: ', that.name, that.value);
        });
    };

    this.setVal = function (val) {
        if (that.value === val)
            return;

        that.value = val;
        that.emit('change', that);
    };

    this.setName = function (name) {
        that.name = name;
    };

    this.val = function () {
        return that.value;
    };

    this.getName = function(){
        return that.name;
    };

    // on event wrapper
    this.on = function () {
        that.event.on.apply(that.event, Array.from(arguments));
    };

    // emit event wrapper
    this.emit = function () {
        that.event.emit.apply(that.event, Array.from(arguments));
    };

    that.init();

    return {
        setVal: that.setVal,
        setName: that.setName,
        val: that.val,
        getName: that.getName,
        on: that.on,
        emit: that.emit
    };
};