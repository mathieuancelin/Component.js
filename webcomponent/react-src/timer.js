function uuid() {
  var d = new Date().getTime();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (d + Math.random()*16)%16 | 0;
    d = Math.floor(d/16);
    return (c=='x' ? r : (r&0x7|0x8)).toString(16);
  });
}

var Dispatcher = Dispatcher || _.extend({}, Backbone.Events);

var Timer = React.createClass({
  getInitialState: function() {
    return {secondsElapsed: 0};
  },
  tick: function() {
    this.setState({secondsElapsed: this.state.secondsElapsed + 1});
  },
  componentDidMount: function() {
    this.interval = setInterval(this.tick, 1000);
  },
  componentWillUnmount: function() {
    clearInterval(this.interval);
  },
  render: function() {
    return (
      <div>
        <div>Hello {this.props.who || 'world'}!</div>
        <div>Seconds Elapsed: {this.state.secondsElapsed}</div>
      </div>
    );
  }
});

var Emitter = React.createClass({
  getInitialState: function() {
    return {
      uuid: '--'
    };
  },
  emit: function() {
    this.setState({
      uuid: uuid()
    });
    console.log('emitting !!!!');
    var slug = { uuid: uuid(), message: 'A new message' };
    console.log(slug);
    Dispatcher.trigger('chat', slug);
  },
  typed: function(e) {
    console.log(e);
  },
  render: function() {
    return (
      <div>
        <div>{this.state.uuid}</div>
        <input type="text" onKeyPress={this.typed} />
        <button type="button" onClick={this.emit}>Send message</button>
      </div>
    );
  }
});

var Receiver1 = React.createClass({
  getInitialState: function() {
    return {
      uuid: '--',
      message: ':::'
    };
  },
  componentDidMount: function() {
    Dispatcher.on('chat', function(slug) {
      this.setState({
        uuid: slug.uuid,
        message: slug.message
      });
    }.bind(this));
  },
  render: function() {
    return (
      <div>
        <div>Receiver 1 last message : {this.state.uuid} - {this.state.message}</div>
      </div>
    );
  }
});

var Receiver2 = React.createClass({
  getInitialState: function() {
    return {
      uuid: '--',
      message: ':::'
    };
  },
  componentDidMount: function() {
    Dispatcher.on('chat', function(slug) {

      this.setState({
        uuid: slug.uuid,
        message: slug.message
      });
    }.bind(this));
  },
  render: function() {
    return (
      <div>
        <div>Receiver 2 last message : {this.state.uuid} - {this.state.message}</div>
      </div>
    );
  }
});
