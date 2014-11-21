var Component = Component || (function() {
    var modelCache = {};
    var defaultBucket = {};
    var publicApi = {
        create: function(initial, init, render) {
            var ctrl = {};
            if (initial && !init && !render && !_.isFunction(initial)) {
                ctrl = initial; // object oriented construction, other are closure oriented construction
            } else if (initial && !init && !render && _.isFunction(initial)) {
                ctrl.render = initial;
            } else if (initial && init && !render && _.isFunction(initial)) {
                ctrl.initialState = initial();
                ctrl.render = init;
            } else if (initial && init && !render && !_.isFunction(initial)) {
                ctrl.initialState = initial;
                ctrl.render = init;
            } else if (initial && init && render && _.isFunction(initial)) {
                ctrl.initialState = initial();
                ctrl.init = init;
                ctrl.render = render;
            } else if (initial && init && render && !_.isFunction(initial)) {
                ctrl.initialState = initial;
                ctrl.init = init;
                ctrl.render = render;
            } else {
                throw new Error('WTF ???');
            }
            return function(opts) {
                var firstInit = true;
                return function (node) {
                    if (!ctrl.render) throw new Error('No render method bro !!!');
                    var base = {};
                    var model  = {};
                    if (ctrl.initialState && ctrl.initialState.trigger) {
                        model = ctrl.initialState;
                        ctrl.initialState = function() {
                            return model.toJSON();
                        };
                    } else {
                        if (opts._modelId) {
                            if (!modelCache[opts._modelId]) {
                                var ModelClass = Backbone.Model.extend({});
                                modelCache[opts._modelId] = new ModelClass();
                            } else {
                                firstInit = false;
                            }
                            model = modelCache[opts._modelId];
                        } else {
                            var ModelClass = Backbone.Model.extend({});
                            model = new ModelClass();
                        }
                    }
                    base.render = function() {
                        return m('span', 'No render method bro, WTF ???');
                    };
                    base.init = function () {};
                    base.initialState = function () {
                        return {};
                    };
                    base.props = function () {
                        return opts || {};
                    };
                    base.getState = function () {
                        return model.toJSON();
                    };
                    base.setState = function (state) {
                        model.set(state);
                    };
                    base.syncState = function (state) {
                        m.startComputation();
                        model.set(state);
                        m.endComputation();
                    };
                    base.redraw = function (force) {
                        m.redraw(force);
                    };
                    base.redrawWithStrategy = function (strat) {
                        m.redraw.strategy(strat);
                    };
                    var app = _.extend(base, ctrl);
                    if (firstInit) {
                        model.set(app.initialState());
                    }
                    app.controller = function () {
                        //_.extend(this, ctrl);
                        app.init();
                        if (firstInit) {
                            firstInit = false;
                        }
                    };
                    app.view = function (thectrl) {
                        return app.render(thectrl);
                    };
                    if (node) {
                        m.module(node, app);
                    } else {
                        app.controller();
                        return app.view();
                    }
                };
            };
        },
        model: function(mod, maybeModel) {
            var model = {};
            if (maybeModel) {
                if (!modelCache[mod]) {
                    var ModelClass = Backbone.Model.extend({});
                    modelCache[mod] = new ModelClass();
                } else {
                    maybeModel.__alreadyInitialized = true;
                }
                model = modelCache[mod];
            } else {
                var ModelClass = Backbone.Model.extend({});
                model = new ModelClass();
            }
            model.getState = function () {
                return model.toJSON();
            };
            model.setState = function (state) {
                model.set(state);
            };
            model.syncState = function (state) {
                m.startComputation();
                model.set(state);
                m.endComputation();
            };
            if (maybeModel) {
                if (!maybeModel.__alreadyInitialized) {
                    model.set(maybeModel); 
                } 
            } else {
                model.set(mod); 
            }
            return model;
        },
        closureElement: function(func) {
            func.___ClosureConstructor = true;
            return func;
        },
        createElement: function(element, opts) {
            if (element.___ClosureConstructor) {
                element = element(_.clone(opts));
            }
            return element(opts || {});
        },
        render: function(element, node) {
            if (element.app) {
                return m.module(node, element.app);
            } else {
                return element(node);
            }
        },
        uuid: function() {
            var d = new Date().getTime();
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (d + Math.random()*16)%16 | 0;
                d = Math.floor(d/16);
                return (c=='x' ? r : (r&0x7|0x8)).toString(16);
            });
        },
        keyMirror: function(obj) {
            var ret = {};
            var key;
            if (!(obj instanceof Object && !Array.isArray(obj))) {
                throw new Error('keyMirror(...): Argument must be an object.');
            }
            for (key in obj) {
                if (!obj.hasOwnProperty(key)) {
                    continue;
                }
                ret[key] = key;
            }
            return ret;
        },
        invariant: function(condition, message, a, b, c, d, e, f, g, h, i, j, k, l, m) {
            if (!condition) {
                var args = [a, b, c, d, e, f, g, h, i, j, k, l, m];
                var argIndex = 0;
                throw new Error("Violation : " + message.replace(/%s/g, function() { return args[argIndex++]; }));
            }
        },
        dispatcher: function() {
            return _.extend({}, Backbone.Events);
        },
        defaultBucket: defaultBucket,
        bucket: function() {
            var api = this;
            var cache = {};
            return {
                of: function(name, obj) {
                    if (!cache[name]) {
                        cache[name] = api.uuid();
                    }
                    if (obj) {
                        obj._modelId = cache[name];
                        return obj;
                    } else {
                        return cache[name];
                    }
                },
                modelId: function(name) {
                    var id = this.of(name);
                    return {
                        _modelId: id
                    };
                }
            };
        },
        setTimeout: function(func, time) {
            m.startComputation();
            return setTimeout(function() {
                func();
                m.endComputation();
            }, time);
        },
        setInterval:function(func, time) {
            m.startComputation();
            return setInterval(function() {
                func();
                m.endComputation();
            }, time);
        },
        defer: function(func) {
            m.startComputation();
            return setTimeout(function() {
                func();
                m.endComputation();
            }, 0);
        },
        classSet: function(obj) {
            var returnValue = [];
            _.map(_.keys(obj), function(key) { 
                var value = obj[key];
                if (value === true) {
                    returnValue.push(key);
                }
            });
            return returnValue.join(' ');
        },
        styleSet: function(obj) {
            var returnValue = [];
            _.map(_.keys(obj), function(key) { 
                var value = obj[key];
                if (value.on === true) {
                    returnValue.push(key + ': ' + value.value + ';');
                }
            });
            return returnValue.join(' ');
        },
        empty: function() {
            return {};
        }
    };
    defaultBucket = publicApi.bucket();
    return publicApi;
})();