Component.js
==================

Component.js is an lightweight toy library built on top of [Mithril](http://lhorie.github.io/mithril/index.html) inspired by [React](http://facebook.github.io/react/index.html) to create efficient UI components.

Here is a simple exemple of a Todo application :

```javascript
// Model of the application
var tasksModel = Component.model({
    tasks: [],
    taskName: ''
});

// Component to display a particular task in the todo list
function TaskItem(task, model) {

    function flipTaskState(task) {
        return function() {
            var tasks = _.map(model.getState().tasks, function(item) {
                if (task._id === item._id) {
                    var newTask = _.clone(item);
                    newTask.done = !task.done;
                    return newTask;
                }
                return item;
            });
            model.setState({ tasks: tasks });
        }
    }

    var classes = Component.classSet({
        'task-done': true,
        'label': true,
        'label-success': task.done,
        'label-default': !task.done
    });

    return m('li', { className: "list-group-item" },
        m('div', { className: "row" }, [
            m('div', { className: "col-md-10" }, task.name),
            m('div', { className: "col-md-2" },
                m('span', {
                    className: classes,
                    onclick: flipTaskState(task),
                    style: 'cursor: pointer;'
                }, 'Done')
            )
        ])
    );
}

// Component to display task creation and removal
function NewTask(model) {

    function deleteAllDone() {
        var tasks = _.filter(model.getState().tasks, function(task) {
            return task.done === false;
        });
        model.setState({ tasks: tasks });
    }

    function createNewTask() {
        var task = {
            _id: Component.uuid(),
            name: model.getState().taskName,
            done: false
        };
        var tasks = model.getState().tasks;
        tasks.push(task);
        model.setState({ tasks: tasks, taskName: '' });
    }

    function updateName(e) {
        model.setState({taskName: e.target.value});
    }

    function keyPress(e) {
        if (e.key === 'Enter') {
            createNewTask();
            e.preventDefault();
        }
    }

    return m('div',
        m('div', { className: "row" },
            m('form', { role: 'form' }, [
                m('div', { className: "form-group col-md-10" },
                    m('input', {
                        placeholder: "What do you have to do ?",
                        type: "text",
                        className: "form-control",
                        value: model.getState().taskName,
                        onchange: updateName,
                        onkeypress: keyPress
                    })
                ),
                m('div', { className: "form-group" },
                    m('div', { className: "btn-group" }, [
                        m('button',
                            {
                                type: "button",
                                onclick: createNewTask,
                                className: "btn btn-success"
                            },
                            m('span', {
                                className: "glyphicon glyphicon-floppy-saved"
                            })
                        ),
                        m('button', 
                            {
                                type: "button",
                                onclick: deleteAllDone,
                                className: "btn btn-danger"
                            },
                            m('span', {
                                className: "glyphicon glyphicon-trash"
                            })
                        )
                    ])
                )
            ])
        )
    );
}

// The actual Todo application
var TodoApp = Component.create(function() {
    var displayedTasks = _.map(tasksModel.getState().tasks, function(task) {
        return TaskItem(task, tasksModel);
    });
    return m('div', { className: 'col-md-4' }, [
        m('h3', 'Todo List'),
        NewTask(tasksModel),
        m('ul', { className: 'list-group' }, displayedTasks)
    ]);
});

// render the application in the 'demo' node
Component.render(Component.createElement(TodoApp), document.getElementById('demo'));
```

Here is more complicated example of the Todo app using a [Flux flavored architecture](http://facebook.github.io/flux/) :

* [Closure oriented example](https://github.com/mathieuancelin/Component.js/blob/master/demo/todo.js)
* [Object oriented example](https://github.com/mathieuancelin/Component.js/blob/master/demo/todo2.js)
