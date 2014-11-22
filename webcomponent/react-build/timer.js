var Timer = React.createClass({displayName: 'Timer',
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
      React.createElement("div", null, 
        React.createElement("div", null, "Hello ", this.props.who || 'world', "!"), 
        React.createElement("div", null, "Seconds Elapsed: ", this.state.secondsElapsed)
      )
    );
  }
});

