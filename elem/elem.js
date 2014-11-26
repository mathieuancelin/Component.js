var Elem = Elem || {};
(function(exports) {
    var debug = false;
    var voidElements = ["AREA","BASE","BR","COL","COMMAND","EMBED","HR","IMG","INPUT","KEYGEN","LINK","META","PARAM","SOURCE","TRACK","WBR"];
    var mouseEvents = 'MouseDown MouseEnter MouseLeave MouseMove MouseOut MouseOver MouseUp'.toLowerCase();
    var events = 'Wheel Scroll TouchCancel TouchEnd TouchMove TouchStart Click DoubleClick Drag DragEnd DragEnter DragExit DragLeave DragOver DragStart Drop Change Input Submit Focus Blur KeyDown KeyPress KeyUp Copy Cut Paste'.toLowerCase();
    function styleToString(attrs) {
        if (_.isUndefined(attrs)) return '';
        var attrsArray = _.map(_.keys(attrs), function(key) {
            var keyName = key.dasherize();
            if (key === 'className') {
                keyName = 'class';
            }
            var value = attrs[key];
            if (!_.isUndefined(value) && _.isFunction(value)) {
                value = value();
            }
            if (!_.isUndefined(value)) {
                return keyName + ': ' + value + ';';
            } else {
                return undefined;
            }
        });
        attrsArray = _.filter(attrsArray, function(item) { return !_.isUndefined(item); });
        return attrsArray.join(' ');
    }

    function classToArray(attrs) {
        if (_.isUndefined(attrs)) return [];
        var attrsArray = _.map(_.keys(attrs), function(key) {
            var value = attrs[key];
            if (!_.isUndefined(value) && value === true) {
                return key.dasherize();
            } else {
                return undefined;
            }
        });
        attrsArray = _.filter(attrsArray, function(item) { return !_.isUndefined(item); });
        return attrsArray;
    }

    function objToString(node, context) {
        if (_.isUndefined(node.attrs)) return '';
        var attrsArray = _.map(_.keys(node.attrs), function(key) {
            var keyName = key.dasherize();
            if (key === 'className') {
                keyName = 'class';
            }
            if (keyName.startsWith('on')) {
                if (context && context.waitingHandlers) {
                    context.waitingHandlers.push({
                        root: context.root,
                        id: node.__nodeId, 
                        event: keyName,
                        callback: node.attrs[key]
                    });
                }
                return undefined;
            } else {
                var value = node.attrs[key];
                if (!_.isUndefined(value) && _.isFunction(value)) {
                    value = value();
                }
                if (!_.isUndefined(value)) {
                    if (_.isObject(value) && keyName === 'style') {
                        return keyName + '="' + styleToString(value) + '"';
                    } else if (_.isArray(value) && keyName === 'class') {
                        return keyName + '="' + value.join(' ') + '"';
                    } else if (_.isObject(value) && keyName === 'class') {
                        return keyName + '="' + classToArray(value).join(' ') + '"';
                    } else {
                        return keyName + '="' + value + '"';
                    }
                } else {
                    return undefined;
                }
            }
        });
        attrsArray = _.filter(attrsArray, function(item) { return !_.isUndefined(item); });
        return attrsArray.join(' ');
    }

    function wrapChildren(children) {
        if (children === 0) {
            return children;
        } else if (children === '') {
            return children;
        }
        return children || [];
    }

    function toHtml(node, context) {
        node.name = node.name || 'unknown';
        node.attrs = node.attrs || {};
        node.children = wrapChildren(node.children);
        var selfCloseTag = _.contains(voidElements, node.name.toUpperCase()) && _.isUndefined(node.children);
        var html = '<' + _.escape(node.name) + ' data-nodeid="' + _.escape(node.__nodeId) + '" ' + objToString(node, context);
        if (debug) html = html + (' title="' + node.__nodeId) + '"';
        if (selfCloseTag) {
            html = html + '/>';
        } else {
            html = html + '>';
            if (_.isArray(node.children)) {
                var elementsToHtml = _.chain(node.children).map(function(child) {
                    if (_.isFunction(child)) {
                        return child();
                    } else {
                        return child;
                    }
                }).filter(function(item) { 
                    return !_.isUndefined(item); 
                }).map(function(child) {
                    return toHtml(child, context); 
                }).value().join('');
                html = html + elementsToHtml;
            } else if (_.isNumber(node.children)) {
                html = html + node.children;
            } else if (_.isString(node.children)) {
                html = html + _.escape(node.children);
            } else if (_.isBoolean(node.children)) {
                html = html + node.children;
            } else if (_.isObject(node.children) && node.children.__isElement) {
                html = html + toHtml(node.children, context);
            } else if (_.isObject(node.children) && node.children.__asHtml) {
                html = html + node.children.__asHtml;
            } else if (_.isRegExp(node.children) || _.isUndefined(node.children) || _.isNull(node.children)) { // do nothing
            } else {
                html = html + _.escape(node.children.toString());
            }
            html = html + '</' + node.name + '>';
        }
        return html;
    }

    function el(name, attrs, children) {
        if (_.isUndefined(children) && !_.isUndefined(attrs) && !attrs.__isAttrs) {
            children = attrs;
            attrs = {};
        }
        return {
            name: name || 'unknown',
            attrs: attrs || {},
            children: wrapChildren(children),
            __isElement: true,
            __nodeId: _.uniqueId('node_'),
            toHtml: function() { return toHtml(this); },
            render: function(node) { exports.render(this, node); }
        };
    }

    function renderToString(el, context) {
        if (_.isFunction(el)) el = el((context || { props: {}}).props)
        if (!_.isUndefined(el)) {
            if (_.isArray(el)) {
                return _.chain(el).map(function(item) {
                    if (_.isFunction(item)) {
                        return item();
                    } else {
                        return item;
                    }
                }).filter(function (item) {
                    return !_.isUndefined(item);
                }).map(function (item) {
                    return toHtml(item, context);
                }).value().join('');
            } else {
                return toHtml(el, context);
            }
        } else {
            return '';
        }
    }   
    
    exports.state = function(mod) {
        var theModel = _.extend({}, mod || {});
        var callbacks = [];
        var lastCallbacks = [];
        function fireCallbacks(key, value) { 
            _.each(callbacks, function(callback) { callback(key, value); }); 
            _.each(lastCallbacks, function(callback) { callback(key, value); }); 
        }
        return {
            on: function(what, callback) { callbacks.push(callback); },
            onChange: function(callback) { callbacks.push(callback); },
            atLast: function(callback) { lastCallbacks.push(callback); },
            set: function(key, value, propagate) {
                if (_.isUndefined(value) && _.isUndefined(propagate) && _.isObject(key)) {
                    _.map(_.keys(key), function(k) {
                        theModel[k] = key[k];
                        fireCallbacks(k, key[k]);   
                    });
                } else if (_.isUndefined(propagate) && _.isObject(key)) {
                    _.map(_.keys(key), function(k) {
                        theModel[k] = key[k];
                        if (value !== false) fireCallbacks(k, key[k]);   
                    });
                } else if (_.isUndefined(propagate) && !_.isObject(key)) {
                    theModel[key] = value;
                    if (value !== false) fireCallbacks(key, value);
                } else {
                    theModel[key] = value;
                    if (propagate !== false) fireCallbacks(key, value);
                }
            },
            get: function(key) { return theModel[key]; },
            refresh: function() { fireCallbacks('__refresh', {}); },
            remove: function(key) {
                delete theModel[key];
                fireCallbacks(key, 'deleted');
            },
            toJson: function() { return _.clone(theModel); }
        };
    };
    exports.el = el;
    exports.sel = function(name, children) { return el(name, {}, children); }; // simple node sel(name, children)
    exports.cel = function(name, attrs) { return el(name, attrs, []); }; // node without content, cel(name, attrs)
    exports.nbsp = function(times) { return el('span', { __asHtml: _.times(times || 1, function() { return '&nbsp;'; }) }); };
    exports.renderToString = renderToString;
    exports.elements = function() {
        var elems = [];
        _.each(arguments, function(item) {
            elems.push(item);
        });
        return elems;
    };
    exports.render = function(el, node, props) {
        var ret;
        var waitingHandlers = (props || {}).__waitingHandlers || [];
        var html = renderToString(el, { root: node, waitingHandlers: waitingHandlers, props: props });
        if (_.isString(node)) {
            ret = $(node).html(html);
        } else if (node.jquery) {
            ret = node.html(html);
        } else {
            node.innerHTML = html;
        }
        if (!(props && props.__rootListener)) {  // external listener here
            _.each(waitingHandlers, function(handler) { // handler on each concerned node
                $('[data-nodeid="' + handler.id + '"]').on(handler.event.replace('on', ''), function() {
                    handler.callback.apply({}, arguments);
                });   
            });
        }
        return ret;
    };
    exports.component = function(opts) {
        var el = opts.container;
        var state = opts.state || Elem.state();
        var props = opts.props || {};
        var render = opts.render;
        var eventCallbacks = {};
        var oldHandlers = [];
        if (opts.init) { opts.init(state, _.clone(props)); }
        $(el).on(events/* + ' ' + mouseEvents */, function(e) { // bubbles listener, TODO : handle mouse event in a clever way
            var node = e.target;
            var name = node.dataset.nodeid + "_" + e.type;
            if (eventCallbacks[name]) {
                eventCallbacks[name](e);    
            } else {
                while(!eventCallbacks[name] && node.dataset.nodeid) {
                    node = node.parentElement;
                    name = node.dataset.nodeid + "_" + e.type;
                }
                if (eventCallbacks[name]) {
                    eventCallbacks[name](e);    
                }
            }
        });
        function rerender() {
            _.each(oldHandlers, function(handler) {
                delete eventCallbacks[handler];
            });
            oldHandlers = [];
            var focus = document.activeElement;
            var key = $(focus).data('key');
            var waitingHandlers = [];
            Elem.render(render(state, _.clone(props)), el, { __waitingHandlers: waitingHandlers, __rootListener: true });
            if (key) {
                var focusNode = $('[data-key="' + key + '"]');
                focusNode.focus();
                if (focusNode.val()) {
                    var strLength = focusNode.val().length * 2;
                    focusNode[0].setSelectionRange(strLength, strLength); // TODO : handle other kind of input ... like select, etc ...   
                }
            }
            _.each(waitingHandlers, function(handler) {
                oldHandlers.push(handler.id + '_' + handler.event.replace('on', ''));
                eventCallbacks[handler.id + '_' + handler.event.replace('on', '')] = function() {
                    handler.callback.apply({ render: render }, arguments);                        
                }
            });
        }
        rerender();
        if (state.atLast) {
            state.atLast(rerender);
        } else {
            state.on('all', rerender); // Do we really need to handle BackBone models
        }
        return state;
    };
})(Elem);