var ReactWebComponent = ReactWebComponent || {};

(function(window, document, exports, undefined) {

    function bootstrapComponent(elem, tag) {
        var thatDoc = document;
        var ElementProto = Object.create(HTMLElement.prototype);
        var shadowRoot;

        function setupReactElement(webcomponent, root) {
            var props = {};
            for (var i in webcomponent.attributes) {
                var item = webcomponent.attributes[i];
                props[item.name] = item.value;    
            }
            React.render(React.createElement(elem, props), root);
        }
        
        ElementProto.createdCallback = function() {
            shadowRoot = this.createShadowRoot();
            var clone = thatDoc.createElement('div');
            clone.setAttribute('id', 'reactcomponent');
            shadowRoot.appendChild(clone);
            var root = shadowRoot.querySelector('#reactcomponent');
            setupReactElement(this, root);
        };

        ElementProto.attributeChangedCallback = function(attr, oldVal, newVal) {
            var root = shadowRoot.querySelector('#reactcomponent');
            setupReactElement(this, root);
        };

        window[tag + 'Element'] = thatDoc.registerElement(tag, {
            prototype: ElementProto
        });
    }

    exports.bootstrapComponent = bootstrapComponent;

})(window, document, ReactWebComponent);