var gpio = require('rpi-gpio');
var Event = require('events');
var Motor = require('./motor.js');

var Config = require('../config/engine.js');

module.exports = function (args) {
    var that = this;
    this.driver = gpio;

    this.defaults = {
        initial: that.driver.DIR_LOW,
        yaw: { // left right
            name: 'yaw',
            driver: that.driver,
            pins: [
                {
                    name: 'in3',
                    pin: 15,
                    use: 'write',
                    setup: that.driver.DIR_OUT,
                    initial: that.driver.DIR_LOW,
                    on: that.driver.DIR_HIGH,
                    off: that.driver.DIR_LOW
                }, {
                    name: 'in4',
                    pin: 21,
                    use: 'write',
                    setup: that.driver.DIR_OUT,
                    initial: that.driver.DIR_LOW,
                    on: that.driver.DIR_HIGH,
                    off: that.driver.DIR_LOW
                }, {
                    name: 'stop_left',
                    pin: 18,
                    use: 'read',
                    setup: that.driver.DIR_IN,
                    initial: that.driver.DIR_LOW,
                }, {
                    name: 'stop_right',
                    pin: 22,
                    use: 'read',
                    setup: that.driver.DIR_IN,
                    initial: that.driver.DIR_LOW,
                }
            ]
        },
        pitch: {
            name: 'pitch',
            driver: that.driver,
            pins: [ // up down
                {
                    name: 'in1',
                    pin: 11,
                    use: 'write',
                    setup: that.driver.DIR_OUT,
                    initial: that.driver.DIR_LOW,
                    on: that.driver.DIR_HIGH,
                    off: that.driver.DIR_LOW
                }, {
                    name: 'in2',
                    pin: 16,
                    use: 'write',
                    setup: that.driver.DIR_OUT,
                    initial: that.driver.DIR_LOW,
                    on: that.driver.DIR_HIGH,
                    off: that.driver.DIR_LOW
                }, {
                    name: 'stop_up',
                    pin: 23,
                    use: 'read',
                    setup: that.driver.DIR_IN,
                    initial: that.driver.DIR_LOW,
                }, {
                    name: 'stop_down',
                    pin: 12,
                    use: 'read',
                    setup: that.driver.DIR_IN,
                    initial: that.driver.DIR_LOW,
                }
            ]
        }
    };

    this.options = {};
    this.loop = null;
    this.event = null;
    this.yaw = null; // rotation y axis
    this.pitch = null; // rotation x axis
    this.ready = false;

    //
    this.init = function () {
        that.defaults = Object.assign(that.defaults, Config);
        that.options = that.defaults;
        if (args) {
            if (typeof args.options === 'object') {
                that.options = Object.assign(that.defaults, args.options);
            }
        }
        that.event = new Event();

        that.on('ready', function () {
            console.log(' ENGINE READY ', '\n');
            that.stop();
        });
        that.on('driver_ready', function () {
            console.log(' GPIO`S READY', '\n');
        });
        that.on('test_complete', function () {
            console.log(' GPIO TEST COMPLETE ', '\n');
        });
        that.on('read', function (pin, value) {
            //console.log(' READ PIN:', pin, 'VALUE:', value);
            that.setStop(pin, value);
        });

        that.on('stopped', function (data) {
            //console.log(' STOPPED ', JSON.stringify(data));
        });

        that.initEngine();
    };

    this.initEngine = function () {
        that.initYaw();
    };

    // left and right
    this.initYaw = function () {
        that.yaw = new Motor(that.options.yaw);
        that.yaw.on('ready', function () {
            //that.emit('ready');
            that.initPitch();
        });
    };

    // up and down
    this.initPitch = function () {
        that.pitch = new Motor(that.options.pitch);
        that.pitch.on('ready', function () {
            that.initRead();
        });
    };

    this.initRead = function () {
        that.driver.on('change', function (pin, value) {
            that.emit('read', pin, value);
        });
        that.emit('ready');
    };

    //
    //
    //
    this.stop = function () {
        that.yaw.stop();
        that.pitch.stop();
    };

    this.left = function () {
        if (that.yaw.getStopper() === 'stop_left') {
            that.yaw.stop();
            return;
        }
        /*if (that.stop_left === true) {
            that.yaw.stop();
            return;
        }*/

        that.yaw.plus();
    };

    this.right = function () {
        if (that.yaw.getStopper() === 'stop_right') {
            that.yaw.stop();
            return;
        }

        /*if (that.stop_right === true) {
            that.yaw.stop();
            return;
        }
        */
        that.yaw.minus();
    };

    this.up = function () {
        if (that.pitch.getStopper() === 'stop_up') {
            that.pitch.stop();
            return;
        }
        that.pitch.plus();
    };

    this.down = function () {
        if (that.pitch.getStopper() === 'stop_down') {
            that.pitch.stop();
            return;
        }
        that.pitch.minus();
    };

    this.keyboard = function (val, key) {
        switch (key.name) {
            case 'a':
                that.left();
                break;

            case 'd':
                that.right();
                break;

            case 's':
                that.down();
                break;

            case 'w':
                that.up();
                break;
        }
    };

    //

    this.setStop = function (pin, value) {
        var pp = that.getMotorByPin(pin);
        if (pp.length === 0)
            return;

        if (that[pp.name] === value)
            return;

        pp.value = value;
        that.emit('stopped', pp);
        that[pp.axis].setStopper(pp);
        that[pp.name] = value;
    };

    this.getMotorByPin = function (pin) {
        var res = [];
        ['yaw', 'pitch'].forEach(function (axis) {
            that.options[axis].pins.filter(function (i) {
                if (parseInt(i.pin) === parseInt(pin)) {
                    i.axis = axis;
                    res.push(i);
                }
            });
        });
        return res[0];
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
        test: that.test,

        keyboard: that.keyboard,
        joystick: that.joystick,

        left: that.left,
        right: that.right,
        up: that.up,
        down: that.down,
        stop: that.stop,

        on: that.on,
        emit: that.emit,

    };
};
