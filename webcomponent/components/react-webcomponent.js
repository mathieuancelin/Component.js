var ReactWebComponent = ReactWebComponent || {};

(function(window, document, exports, undefined) {

    var registrationFunction = (document.registerElement || document.register).bind(document);
    if (registrationFunction === undefined) {
        console.error('No registerElement function !!!');
        return;
    }

    function extend(extandable, extending) {
        for (var i in extending) {
            if (extandable[i] === undefined) {
                if (typeof extending[i] === 'function') {
                    extandable[i] = extending[i].bind(extending);
                } else {
                    extandable[i] = extending[i];
                }
            }
        }
    }

    function getContentNodes(el) {
      var fragment = document.createElement('content');
      while(el.childNodes.length) {
        fragment.appendChild(el.childNodes[0]);
      }
      return fragment;
    }

    function bootstrapComponent(tag, reactClass) {
        var thatDoc = document;
        var ElementProto = Object.create(HTMLElement.prototype);
        ElementProto.createdCallback = function() {
            var _uuid = uuid();
            console.log('Creating instance of ' + tag + ' (' + _uuid + ')');
            this._content = getContentNodes(this);
            this.uuid = _uuid;
            var reactiveElement = {};
            var props = {};
            for (var i in this.attributes) {
                var item = this.attributes[i];
                props[item.name] = item.value;    
            }
            reactiveElement.props = props;
            reactiveElement = React.createElement(reactClass, props);
            // Events does not seems to be catched by react ????
            // var shadowRoot = this.createShadowRoot();
            // var clone = thatDoc.createElement('div');
            // clone.setAttribute('id', 'reactcomponent');
            // shadowRoot.appendChild(clone);
            // var root = shadowRoot.querySelector('#reactcomponent');
            // this.renderedReactElement = React.render(reactiveElement, root); 
            this.renderedReactElement = React.render(reactiveElement, this); 
        };
        ElementProto.attributeChangedCallback = function (attr, oldVal, newVal) {
            console.log('Changed attrs "' + attr + '" of ' + tag + ' from "' + oldVal + '" to "' + newVal + '" (' + this.uuid + ')');
            var props = {};
            props[attr] = newVal;
            this.renderedReactElement.setProps(props);
        }
        registrationFunction(tag, {
            prototype: ElementProto
        });
    }

    exports.bootstrapComponent = bootstrapComponent;

})(window, document, ReactWebComponent);