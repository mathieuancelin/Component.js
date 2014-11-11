
// Clock element using object oriented construction (react like)
var Clock1 = Component.create({
    initialState: function() {
        return {
            value : new Date().toString(),
            started: false,
            button: "Start clock"
        };
    },
    init: function() {
        setInterval(function() {
            if (this.getState().started) {
                this.syncState({ value: new Date().toString() });
            }
        }.bind(this), 1000);
    },
    startOrStop: function() {
        if (this.getState().started) {
            this.setState({
                value: new Date().toString(),
                button: "Start clock",
                started: false
            });
        } else {
            this.setState({
                value: new Date().toString(),
                button: "Stop clock",
                started: true
            });
        }
    },
    render: function() {
        return [
            m('div', this.getState().value),
            m("button", {type: 'button', class: "btn btn-primary", onclick: this.startOrStop.bind(this)}, this.getState().button)
        ];
    }
});

// Clock component using closure oriented construction to avoid usage `this` keyword
var Clock2 = Component.closureElement(function() {

    var model = Component.model({
        value : new Date().toString(),
        started: false,
        button: "Start clock"
    });

    setInterval(function() {
        if (model.getState().started) {
            model.syncState({ value: new Date().toString() });
        }
    }, 1000);

    function startOrStop() {
        if (model.getState().started) {
            model.setState({
                value: new Date().toString(),
                button: "Start clock",
                started: false
            });
        } else {
            model.setState({
                value: new Date().toString(),
                button: "Stop clock",
                started: true
            });
        }
    }

    return Component.create(
        model,
        function() {
            return [
                m('div', model.getState().value),
                m("button", {type: 'button', class: "btn btn-primary", onclick: startOrStop}, model.getState().button)
            ];
        }
    );
});

Component.render(Component.createElement(Clock1), document.getElementById('clock1'));
Component.render(Component.createElement(Clock2), document.getElementById('clock2'));

