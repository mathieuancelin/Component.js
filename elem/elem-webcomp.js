var Elem = Elem || {};
(function(window, document, exports, undefined) {
  var registrationFunction = (document.registerElement || document.register).bind(document);
  if (registrationFunction === undefined) {
    console.error('No registerElement function !!!');
    return;
  }
  function registerWebComponent(tag, elem) {
    var ElementProto = Object.create(HTMLElement.prototype);
    ElementProto.createdCallback = function() {
      var props = {};
      for (var i in this.attributes) {
        var item = this.attributes[i];
        props[item.name] = item.value;    
      }
      this.props = props;
      if (props.renderOnly && props.renderOnly === true) {
        this.renderedElement = Elem.render(elem, this); 
      } else {
        this.renderedElement = Elem.renderComponent(elem, this); 
      }
    };
    ElementProto.attributeChangedCallback = function (attr, oldVal, newVal) {
      this.props[attr] = newVal;
      if (this.props.renderOnly && this.props.renderOnly === true) {
        this.renderedElement = Elem.render(elem, this); 
      } else {
        this.renderedElement = Elem.renderComponent(elem, this); 
      }
    }
    registrationFunction(tag, {
      prototype: ElementProto
    });
  }
  exports.registerWebComponent = registerWebComponent;
})(window, document, Elem);