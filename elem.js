var Elem = Elem || {};
(function(exports) {

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
            if (context && keyName.startsWith('on')) {
                context.waitingHandlers.push({
                    root: context.root,
                    id: node.__nodeId, 
                    event: keyName,
                    callback: node.attrs[key]
                });
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

        var selfCloseTag = ((node.name === 'br' ||
        node.name === 'hr' ||
        node.name === 'img' ||
        node.name === 'input' ||
        node.name === 'link' ||
        node.name === 'meta') && _.isUndefined(node.children));

        var html = '<' + _.escape(node.name) + ' data-nodeid="' + _.escape(node.__nodeId) + '" ' + objToString(node, context);

        if (selfCloseTag) {
            html = html + '/>';
        } else {
            html = html + '>';
            if (_.isUndefined(node.children)) {
                // do nothing
            } else if (_.isArray(node.children)) {
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
            } else if (_.isNull(node.children)) {
                // do nothing
            } else if (_.isBoolean(node.children)) {
                html = html + node.children;
            } else if (_.isRegExp(node.children)) {
                // do nothing
            } else if (_.isObject(node.children) && node.children.__isElement) {
                html = html + toHtml(node.children, context);
            } else if (_.isObject(node.children) && node.children.__asHtml) {
                html = html + node.children.__asHtml;
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
        var uuid = _.uniqueId('node_');
        return {
            name: name || 'unknown',
            attrs: attrs || {},
            children: wrapChildren(children),
            __isElement: true,
            __nodeId: uuid,
            __toHtml: function() {
                return toHtml(this); 
            }
        };
    }

    function renderToString(el, context) {
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

    var renderedNodes = {};

    exports.elements = function() {
        var elems = [];
        _.each(arguments, function(item) {
            elems.push(item);
        });
        return elems;
    };
    exports.el = el;
    exports.sel = function(name, children) {
        return el(name, {}, children);
    };
    exports.cel = function(name, attrs) {
        return el(name, attrs, []);
    };
    exports.nbsp = function(times) {
        return el('span', { __asHtml: _.times(times || 1, function() { return '&nbsp;'; }) });
    };
    exports.renderToString = renderToString;
    exports.render = function(el, node) {
        var ret;
        var waitingHandlers = [];
        var html = renderToString(el, { root: node, waitingHandlers: waitingHandlers });
        if (_.isString(node)) {
            ret = $(node).html(html);
        } else if (node.jquery) {
            ret = node.html(html);
        } else {
            node.innerHTML = html;
        }
        _.each(waitingHandlers, function(handler) {
            $('[data-nodeid="' + handler.id + '"]').on(handler.event.replace('on', ''), function() {
                handler.callback.apply({}, arguments);
            });   
        });
        return ret;
    };
    exports.renderComponent = function(funct, node, model) {
        if (!renderedNodes[node]) {
            var nbrOfRender = 0;
            var oldHandlers = [];
            function render() {
                nbrOfRender = nbrOfRender + 1;
                var tree = funct(render, node);
                var waitingHandlers = [];
                var html = toHtml(tree, { root: node, waitingHandlers: waitingHandlers });
                $(node).html(html);
                _.each(oldHandlers, function(handler) {
                    $(handler.node).off(handler.event);
                });
                oldHandlers = [];
                _.each(waitingHandlers, function(handler) {
                    oldHandlers.push({
                        event: handler.event.replace('on', ''),
                        node: '[data-nodeid="' + handler.id + '"]'
                    });
                    $('[data-nodeid="' + handler.id + '"]').on(handler.event.replace('on', ''), function() {
                        var focus = document.activeElement;
                        var key = $(this).data('key');
                        var result = handler.callback.apply({ render: render }, arguments);
                        if (result !== false) {
                            render();
                            if (key) {
                                var focusNode = $('[data-key="' + key + '"]');
                                focusNode.focus();
                                if (focusNode.val()) {
                                    var strLength = focusNode.val().length * 2;
                                    // TODO : handle other kind of input ... like select, etc ...
                                    focusNode[0].setSelectionRange(strLength, strLength);    
                                }
                            }
                        }
                    });   
                });
            }
            if (model && model.on) {
                model.on('all', function() {
                    render();
                });
            }
            render();
            var api = {
                render: render,
                stats: {
                    nbrOfRender: nbrOfRender
                },
                toHtmlString: function() { return toHtml(funct(render, node)); }
            };
            renderedNodes[node] = api;
            return api;
        } else {
            renderedNodes[node].render();
            return renderedNodes[node];
        }
    };
})(Elem);