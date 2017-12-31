var Event = require('events');

module.exports = function (args) {
    var that = this;
    this.defaults = {
        duration: 200,
        speed: 2000,
    };
    this.options = {};
    this.event = null;
    this.driver = null;

    this.name = null;
    this.pins = null;
    this.is = null;
    this.writes = [];
    this.reads = [];
    this.ready = false;
    this.loop = {
        blink: null
    };

    this.stopper = null;

    //
    this.init = function () {
        that.event = new Event();
        that.options = that.defaults;

        if (args) {
            if (args.options)
                if (typeof args.options === 'object') {
                    that.options = Object.assign(that.defaults, args.options);
                }
            if (args.driver)
                if (typeof args.driver === 'object') {
                    that.driver = args.driver;
                }
            if (args.pins)
                if (typeof args.pins === 'object') {
                    that.pins = args.pins;
                }

            that.name = args.name;
        }

        that.on('ready', function () {
            that.ready = true;
            console.log(' MOTOR READY:', that.name);
            console.log('');
        });

        that.on('setup_complete', function () {
            console.log(' SETUP COMPLETE FOR:', that.name);
            that.emit('ready');
        });

        that.on('read', function (pin, value) {
            console.log(' READ PIN:', pin, 'VALUE:', value, 'FOR:', that.name);
        });

        that.on('write', function (pin, value) {
            //console.log(' WRITE ON', that.name, 'PIN', pin.pin, 'VALUE:', value);
        });


        // pin setup complete
        that.on('setup_write_complete', function (pin) {
            console.log(' INIT WRITE SUCCESS FOR:', that.name, 'ON PIN:', pin);
        });
        that.on('setup_read_complete', function (pin) {
            console.log(' INIT READ SUCCESS FOR:', that.name, 'ON PIN:', pin);
        });

        // pin errors
        that.on('setup_write_error', function (err, pin) {
            console.log(' CAN`T WRITE FOR:', that.name, 'ON PIN:', pin);
        });
        that.on('setup_read_error', function (err, pin) {
            console.log(' CAN`T READ FOR:', that.name, 'ON PIN:', pin);
        });

        that.on('write_error', function (err, pin) {
            console.log(' WRITE ERROR ', pin, err);
        });
        that.on('read_error', function (err, pin) {
            console.log(' READ ERROR ', pin, err);
        });

        that.on('stopped', function(stopper){
            console.log(' STOPPED', JSON.stringify(stopper));
            that.stop();
        });

        that.on('released', function(stopper){
            console.log(' RELEASED', JSON.stringify(stopper));
        });


        that.setup();
    };

    this.plus = function () {
        that.turnOff(that.writes[0]);
       // that.trigger(that.writes[1]);
        that.turnOn(that.writes[1]);
    };

    this.minus = function () {
        that.turnOff(that.writes[1]);
        //that.trigger(that.writes[0]);
        that.turnOn(that.writes[0]);
    };

    this.stop = function () {
        that.turnOff(that.writes[0]);
        that.turnOff(that.writes[1]);
    };

    this.turnOn = function (pin) {
        that.driver.write(pin.pin, pin.on, function (err) {
            if (err) {
                that.emit('write_error', err, pin.pin);
            }
            that.emit('write', pin, pin.on);
            that.is = true;
            that.driver.write(pin.pin, true, function (err) {
                if (err) {
                    that.emit('write_error', err, pin.pin);
                }
                that.emit('write', pin, true);
                that.is = true;
            });
        });
    };


    this.turnOff = function (pin) {
        that.driver.write(pin.pin, pin.off, function (err) {
            if (err) {
                that.emit('write_error', err, pin.pin);
            }
            that.emit('write', pin, pin.off);
            that.is = false;
            that.driver.write(pin.pin, false, function (err) {
                if (err) {
                    that.emit('write_error', err, pin.pin);
                }
                that.emit('write', pin, false);
                that.is = false;
            });
        });
    };

    // turn it on, then off
    this.trigger = function (pin, callback) {
        if (!that.driver)
            return;

        that.turnOn(pin);
        setTimeout(function () {
            that.turnOff(pin);
            if (typeof callback === 'function') {
                callback();
            }
        }, that.options.duration);
    };

    this.setup = function (index) {
        if (!index)
            index = 0;

        if (index === that.pins.length) {
            that.emit('setup_complete');
            return;
        }
        var pin = that.pins[index];
        if (pin.use === 'write') {
            that.writes.push(pin);
            that.setupWrite(pin, function () {
                that.setup(index + 1);
            });
        }
        if (pin.use === 'read') {
            that.reads.push(pin);
            that.setupRead(pin, function () {
                that.setup(index + 1);
            });
        }
    };

    this.setupWrite = function (pin, callback) {
        that.emit('setup_write_before');
        that.driver.setup(pin.pin, pin.setup, function (err) {
            if (err) {
                that.emit('setup_write_error', err, pin.pin);
            }
            that.driver.write(pin.pin, pin.initial, function (err) {
                if (err) {
                    that.emit('setup_write_error', err, pin.pin);
                }

                that.emit('setup_write_complete', pin.pin);
                if (typeof callback === 'function') {
                    callback();
                }
            });
        });
    };


    this.setupRead = function (pin, callback) {
        that.emit('setup_read_before');
        that.driver.setup(pin.pin, pin.setup, that.driver.EDGE_BOTH);
        that.emit('setup_read_complete', pin.pin);
        if (typeof callback === 'function') {
            callback();
        }
    };

    this.setStopper = function (stopper) {
        if (stopper.value === true) {
            if (that.stopper === stopper.name)
                return;

            that.stopper = stopper.name;
            that.emit('stopped', stopper);
        } else {
            if (that.stopper === false)
                return;

            that.stopper = false;
            that.emit('released', stopper);
        }
    };

    this.getStopper = function(){
        return that.stopper;
    };

    this.toggle = function (pin) {
        switch (that.is) {
            case true:
                that.turnOff(pin);
                break;

            case false:
                that.turnOn(pin);
                break;
        }
    };

    this.test = function () {
        var index = 0;
        clearInterval(that.loop.blink);
        that.loop.blink = setInterval(function () {
            if (index === that.writes.length) {
                that.emit('test_complete');
                return that.test();
            }
            that.trigger(that.writes[index]);
            index++;
        }, that.options.speed);
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
        ready: function () {
            return that.ready;
        },
        stop: that.stop,
        setStopper: that.setStopper,
        getStopper: that.getStopper,
        test: that.test,
        setup: that.setup,
        plus: that.plus,
        minus: that.minus,
        trigger: that.trigger,
        toggle: that.toggle,
        turnOn: that.turnOn,
        turnOff: that.turnOff,
        on: that.on,
        emit: that.emit,

        number: that.number,
        pin: that.pin,
        initial: that.initial,
        is: that.is
    };
};
