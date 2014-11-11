
var Dispatcher = Component.dispatcher();

var NewTask = Component.create({
    initialState: function() {
        return {
            name: 'First task'
        };
    },
    createTask: function() {
        var name = this.getState().name || '';
        this.setState({
            name: ''
        });
        if (name !== '') {
            Dispatcher.trigger('create', name);
        }
    },
    keyPress: function(e) {
        this.setState({ name: e.target.value });
    },
    render: function() {
        return [
            m('input', {type: 'text', placeholder: 'Task Name', onchange: this.keyPress.bind(this), onkeyup: this.keyPress.bind(this), value: this.getState().name}),
            m('button', {type: 'button', className: 'btn btn-primary', onclick: this.createTask.bind(this)}, 'Create Task')
        ];
    }
});

var TaskItem = Component.create({
    initialState: function() {
        return {
            done: this.props().done
        };
    },
    flip: function() {
        var done = this.getState().done;
        this.setState({
            done: !done
        });
        Dispatcher.trigger('flip', this.props()._id);
    },
    render: function() {
        return [
            m('li', m('a', {href: '#', onclick: this.flip.bind(this)}, this.props().name + ' ' + (this.getState().done ? 'undone' : 'done'))),
        ];
    }
});

var bucket = Component.bucket();

var TodoApp = Component.create({
    initialState: function() {
        return {
            tasks: [
                {
                    _id: Component.uuid(),
                    name: "Buy some stuff",
                    done: false
                },
                {
                    _id: Component.uuid(),
                    name: "Do some stuff",
                    done: false
                }
            ]
        };
    },
    init: function() {
        Dispatcher.on('flip', function(_id) {
            var tasks = _.map(this.getState().tasks, function(task) {
                if (task._id === _id) {
                    task.done = !task.done;
                    return task;
                } else {
                    return task;
                }
            });
            this.setState({ tasks : tasks });
        }.bind(this));
        Dispatcher.on('create', function(name) {
            var tasks = this.getState().tasks;
            tasks.push({
                name: name,
                done: false,
                _id: Component.uuid()
            });
            this.setState({ tasks: tasks });
        }.bind(this));
    },
    render: function() {
        var tasks = _.map(this.getState().tasks, function(task) {
            return Component.createElement(TaskItem, bucket.of(task._id, task))();
        });
        return [
            m('h3', 'Todo'),
            Component.createElement(NewTask, bucket.simple('newTask'))(),
            m('ul', tasks)
        ];
    }
});

Component.render(Component.createElement(TodoApp), document.getElementById('demo'));

