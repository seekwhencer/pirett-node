var Event = require('events');
var fs = require('fs');
var keypress = require('keypress');

var Joystick = require('./lib/joystick.js');
var Engine = require('./lib/engine.js');
var Config = require('./config/app.js');

var App = function (args) {

    var that = this;

    this.defaults = {
        movement_timeout: 2000
    };
    this.options = {};

    this.joystick = null;
    this.engine = null;
    this.event = null;

    this.last_move = null;
    this.timeout_movement_stop = null;
    this.stdin = null;

    this.init = function () {
        that.defaults = Object.assign(that.defaults, Config);
        that.options = that.defaults;
        if (args) {
            if (typeof args.options === 'object') {
                that.options = Object.assign(that.defaults, args.options);
            }
        }
        that.event = new Event();
        that.initEngine();
    };

    this.initEngine = function () {
        that.engine = new Engine();
        that.engine.on('ready', function () {
            that.initConsoleInput();
            that.initJoystick();
        });
    };

    this.initConsoleInput = function () {
        console.log(' CONSOLE MONITORING STARTED ');
        keypress(process.stdin);

        process.stdin.on('keypress', function (ch, key) {
            if (key && key.ctrl && key.name == 'c') {
                process.exit(0);
            }
            that.engine.keyboard(ch, key);
        });

        //process.stdin.setRawMode(true);
        process.stdin.resume();
    };

    this.initJoystick = function () {
        that.joystick = new Joystick();
        that.joystick.yaw.on('change', function (axis) {
            if (that.joystick.fire_alt.val() !== true)
                return;

            console.log('>>>', axis.getName(), axis.val());
            if (axis.val() < 1)
                that.engine.left();

            if (axis.val() > -1)
                that.engine.right();
        });
        that.joystick.pitch.on('change', function (axis) {
            if (that.joystick.fire_alt.val() !== true)
                return;

            console.log('>>>', axis.getName(), axis.val());
            if (axis.val() < 1000)
                that.engine.down();

            if (axis.val() > 1000)
                that.engine.up();
        });


        that.joystick.throttle.on('change', function (axis) {
            console.log('>>>', axis.getName(), axis.val());
        });

        that.joystick.fire_alt.on('change', function (axis) {

            console.log('>>>', axis.getName(), axis.val());

            if (that.joystick.fire_alt.val() === true) {
                return;
            }

            that.engine.stop();
        });
        that.joystick.fire_alt.on('change', function (axis) {
            console.log('>>>', axis.getName(), axis.val());
        });
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
        on: that.on,
        emit: that.emit
    };

}(); // <-- run it instantly

