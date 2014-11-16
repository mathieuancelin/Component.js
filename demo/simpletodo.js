var TodoApp = (function() {

    return Component.closureElement(function(props) {

        var model = Component.model('todo', {
            tasks: [],
            taskName: ''
        });

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

        function deleteAllDone() {
            var tasks = _.filter(model.getState().tasks, function(task) {
                return task.done === false;
            });
            model.setState({ tasks: tasks });
        }

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

        function updateName(e) {
            model.setState({taskName: e.target.value});
        }

        function keyPress(e) {
            if (e.key === 'Enter') {
                createNewTask();
                e.preventDefault();
            }
        }

        function TaskItem(task) {
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

        function NewTask() {
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

        return Component.create(function() {
            var displayedTasks = _.map(model.getState().tasks, function(task) {
                return TaskItem(task);
            });
            return m('div', { className: 'col-md-4' }, [
                m('h3', 'Todo List'),
                NewTask(),
                m('ul', { className: 'list-group' }, displayedTasks)
            ]);
        });
    });
})();

Component.render(Component.createElement(TodoApp), document.getElementById('demo'));