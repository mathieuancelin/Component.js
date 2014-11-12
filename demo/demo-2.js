
var Dispatcher = Component.dispatcher();

var model = Component.model({
    name: '',
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
});

var NewTask = Component.closureElement(function(opts) {

    function createTask() {
        var name = model.getState().name || '';
        model.setState({
            name: ''
        });
        if (name !== '') {
            Dispatcher.trigger('create', name);
        }
    }
    function keyPress(e) {
        model.setState({ name: e.target.value });
    }
    return Component.create(model, function() {
        return [
            m('input', {type: 'text', placeholder: 'Task Name', onchange: keyPress, onkeyup: keyPress, value: model.getState().name}),
            m('button', {type: 'button', className: 'btn btn-primary', onclick: createTask}, 'Create Task')
        ];
    });
});

var TaskItem = Component.create({
    flip: function() {
        Dispatcher.trigger('flip', this.props()._id);
    },
    render: function() {
        return [
            m('li', m('a', {onclick: this.flip.bind(this)}, this.props().name + ' ' + (this.props().done ? 'undone' : 'done'))),
        ];
    }
});

var TodoApp = Component.closureElement(function(opts) {

    function init() {
        Dispatcher.on('flip', function(_id) {
            var tasks = _.map(model.getState().tasks, function(task) {
                if (task._id === _id) {
                    task.done = !task.done;
                    return task;
                } else {
                    return task;
                }
            });
            model.setState({ tasks : tasks });
        });
        Dispatcher.on('create', function(name) {
            var tasks = model.getState().tasks;
            tasks.push({
                name: name,
                done: false,
                _id: Component.uuid()
            });
            model.setState({ tasks: tasks });
        });
    }

    return Component.create(model, init, function() {
        var tasks = _.map(model.getState().tasks, function(task) {
            return Component.createElement(TaskItem, task)();
        });
        return [
            m('h3', 'Todo'),
            Component.createElement(NewTask)(),
            m('ul', tasks)
        ];
    });
});

Component.render(Component.createElement(TodoApp), document.getElementById('demo'));

