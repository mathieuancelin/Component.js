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

Here is more complicated Todo app using some kind of [Flux architecture](http://facebook.github.io/flux/) flavor :

```javascript
var TodoApp = (function() {

	// Possible actions of the application
	var TaskConstants = Component.keyMirror({
	    SAVE_NEW_TASK: null,
	    DELETE_DONE_TASKS: null,
	    CHANGE_TASK_STATE: null,
	    TASKS_CHANGED: null,
	    TASKS_ADDED: null
	});

	// Event dispatcher. Store can register themself on the dispatcher to handle actions
	var TaskDispatcher = Component.dispatcher();

	// Actions triggered by the UI components throught the dispatcher
	var TaskActions = {
	    saveNewTask: function(text) {
	        TaskDispatcher.trigger(TaskConstants.SAVE_NEW_TASK, {text: text});
	    },
	    deleteDone: function() {
	        TaskDispatcher.trigger(TaskConstants.DELETE_DONE_TASKS, {});
	    },
	    changeTaskState: function(id, done) {
	        TaskDispatcher.trigger(TaskConstants.CHANGE_TASK_STATE, {id: id, done: done});
	    }
	};

	// Structure that can store model and listen to actions. 
	// Components can register themself on stores to trigger re-render based on events.
	// Components can only fetch data from store.
	var TaskStore = (function() {

		var tasks = [];
		var notifier = Component.dispatcher();

		function notifyChanges() {
		    notifier.trigger(TaskConstants.TASKS_CHANGED, tasks);
		}

		function updateStore() {
		    notifyChanges();
		}

		function createNewTask(text) {
		    var task = {
		    	_id: Component.uuid(),
		        name: text,
		        done: false
		    };
		    tasks.push(task);
		    notifier.trigger(TaskConstants.TASKS_ADDED);
	        updateStore();
		}

		function deleteAllDone() {
		    tasks = _.filter(tasks, function(item) {
		    	return item.done === false;
		    });
	        updateStore();
		}

		function flipTaskState(id, done) {
		    tasks = _.map(tasks, function(item) {
		    	if (id === item._id) {
		    		var newTask = _.clone(item);
		    		newTask.done = done;
		    		return newTask;
		    	} 
		    	return item;
		    });
	        updateStore();
		}

		TaskDispatcher.on(TaskConstants.SAVE_NEW_TASK, function(data) {
		    createNewTask(data.text);
		});
		TaskDispatcher.on(TaskConstants.DELETE_DONE_TASKS, function() {
		    deleteAllDone();
		});
		TaskDispatcher.on(TaskConstants.CHANGE_TASK_STATE, function(data) {
		    flipTaskState(data.id, data.done);
		});

		return {
		    init: updateStore,
		    on: function(what, callback) {
		        notifier.on(what, callback);
		    },
		    off: function(what, callback) {
		        notifier.off(what, callback);
		    },
		    getAllTasks: function() {
		        return tasks;
		    }
		};

	})();

	// Component for task creation and removal
	var NewTask = Component.closureElement(function(props) {

		var model = Component.model('newtask', {
            taskName: ''
        });

	    function clearTaskName() {
	        model.setState({
	            taskName: ''
	        });
	    }

	    function init() {
	        TaskStore.on(TaskConstants.TASKS_ADDED, clearTaskName);
	    }

	    function updateName(e) {
	        model.setState({taskName: e.target.value});
	    }

	    function save() {
	        if (model.getState().taskName && model.getState().taskName !== '') {
	            TaskActions.saveNewTask(model.getState().taskName);
	        }
	    }

	    function deleteAll() {
	        TaskActions.deleteDone();
	    }

	    function keyPress(e) {
	        if (e.key === 'Enter') {
	            save();
	            e.preventDefault();
	        }
	    }

	    return Component.create(model, init, function() {
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
										onclick: save, 
										className: "btn btn-success"
									},
    								m('span', { 
    									className: "glyphicon glyphicon-floppy-saved" 
    								})
								),
                                m('button', 
                            		{
                                		type: "button", 
                                		onclick: deleteAll, 
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
	    });
	});

	// Component to display the state of a particular task
	var TaskItem = Component.closureElement(function(props) {

		var model = Component.model(props.task._id, {
            done: props.task.done
        });

	    function change() {
	        TaskActions.changeTaskState(props.task._id, !model.getState().done);
	        model.setState({
	            done: !model.getState().done
	        });
	    }

	    return Component.create(function () {
	        var classes = Component.classSet({
	            'task-done': true,
	            'label': true,
	            'label-success': model.getState().done,
	            'label-default': !model.getState().done
	        });
	        return m('li', { className: "list-group-item" },
	        	m('div', { className: "row" }, 
	        		[
	        			m('div', { className: "col-md-10" }, props.task.name),
	        			m('div', { className: "col-md-2" }, 
	        				m('span', { 
	        					className: classes, 
	        					onclick: change, 
	        					style: 'cursor: pointer;' 
	        				}, 'Done')
	    				)
	        		]
	    		)
	    	);
	    });
	});

	// The final application combining all the components
	var app = Component.closureElement(function(props) {

		var model = Component.model('todo', {
            tasks: []
        });

	    function reloadTasks() {
	        model.setState({
	            tasks: TaskStore.getAllTasks()
	        });
	    }

	    function init() {
	        TaskStore.init();
	        TaskStore.on(TaskConstants.TASKS_CHANGED, reloadTasks);
	    }

	    return Component.create(model, init, function() {
	        var displayedTasks = _.map(model.getState().tasks, function(task) {
	        	return Component.createElement(TaskItem, {task: task})();
	        });
	        return m('div', { className: 'col-md-4' }, [
	        	m('h3', 'Todo List'),
	        	Component.createElement(NewTask)(),
	        	m('ul', { className: 'list-group' }, displayedTasks)
	        ]);
	    });
	});

	return app;

})();

// attach the todo application in the DOM node with id 'demo'
Component.render(Component.createElement(TodoApp), document.getElementById('demo'));

```

and the same example using a more object oriented approach :

```javascript
var TodoApp = (function() {
	
	// Possible actions of the application
	var TaskConstants = Component.keyMirror({
	    SAVE_NEW_TASK: null,
	    DELETE_DONE_TASKS: null,
	    CHANGE_TASK_STATE: null,
	    TASKS_CHANGED: null,
	    TASKS_ADDED: null
	});

	// Event dispatcher. Store can register themself 
	// on the dispatcher to handle actions
	var TaskDispatcher = Component.dispatcher();

	// Actions triggered by the UI components throught the dispatcher
	var TaskActions = {
	    saveNewTask: function(text) {
	        TaskDispatcher.trigger(TaskConstants.SAVE_NEW_TASK, {text: text});
	    },
	    deleteDone: function() {
	        TaskDispatcher.trigger(TaskConstants.DELETE_DONE_TASKS, {});
	    },
	    changeTaskState: function(id, done) {
	        TaskDispatcher.trigger(TaskConstants.CHANGE_TASK_STATE, 
	        	{id: id, done: done});
	    }
	};

	// Structure that can store model and listen to actions. 
	// Components can register themself on stores to trigger 
	//   re-render based on events.
	// Components can only fetch data from store.
	var TaskStore = (function() {

		var tasks = [];
		var notifier = Component.dispatcher();

		function notifyChanges() {
		    notifier.trigger(TaskConstants.TASKS_CHANGED, tasks);
		}

		function updateStore() {
		    notifyChanges();
		}

		function createNewTask(text) {
		    var task = {
		    	_id: Component.uuid(),
		        name: text,
		        done: false
		    };
		    tasks.push(task);
		    notifier.trigger(TaskConstants.TASKS_ADDED);
	        updateStore();
		}

		function deleteAllDone() {
		    tasks = _.filter(tasks, function(item) {
		    	return item.done === false;
		    });
	        updateStore();
		}

		function flipTaskState(id, done) {
		    tasks = _.map(tasks, function(item) {
		    	if (id === item._id) {
		    		var newTask = _.clone(item);
		    		newTask.done = done;
		    		return newTask;
		    	} 
		    	return item;
		    });
	        updateStore();
		}

		TaskDispatcher.on(TaskConstants.SAVE_NEW_TASK, function(data) {
		    createNewTask(data.text);
		});
		TaskDispatcher.on(TaskConstants.DELETE_DONE_TASKS, function() {
		    deleteAllDone();
		});
		TaskDispatcher.on(TaskConstants.CHANGE_TASK_STATE, function(data) {
		    flipTaskState(data.id, data.done);
		});

		return {
		    init: updateStore,
		    on: function(what, callback) {
		        notifier.on(what, callback);
		    },
		    off: function(what, callback) {
		        notifier.off(what, callback);
		    },
		    getAllTasks: function() {
		        return tasks;
		    }
		};

	})();

	// Component for task creation and removal
	var NewTask = Component.create({
	    initialState: function() {
	        return {
	            taskName: ''
	        };
	    },
	    clearTaskName: function() {
	        this.setState({
	            taskName: ''
	        });
	    },
	    init: function() {
	        TaskStore.on(TaskConstants.TASKS_ADDED, this.clearTaskName.bind(this));
	    },
	    updateName: function(e) {
	        this.setState({taskName: e.target.value});
	    },
	    save: function() {
	        if (this.getState().taskName && this.getState().taskName !== '') {
	            TaskActions.saveNewTask(this.getState().taskName);
	        }
	    },
	    deleteAll: function() {
	        TaskActions.deleteDone();
	    },
	    keyPress: function(e) {
	        if (e.key === 'Enter') {
	            this.save();
	            e.preventDefault();
	        }
	    },
	    render: function() {
	    	return m('div', 
	    		m('div', { className: "row" }, 
	    			m('form', { role: 'form' }, [
    					m('div', { className: "form-group col-md-10" }, 
    						m('input', { 
    							placeholder: "What do you have to do ?", 
    							type: "text", 
    							className: "form-control", 
    							value: this.getState().taskName, 
    							onchange: this.updateName.bind(this), 
    							onkeypress: this.keyPress.bind(this) 
    						})
						),
    					m('div', { className: "form-group" }, 
    						m('div', { className: "btn-group" }, [
    							m('button', 
									{
										type: "button", 
										onclick: this.save.bind(this), 
										className: "btn btn-success"
									},
    								m('span', { 
    									className: "glyphicon glyphicon-floppy-saved" 
    								})
								),
                                m('button', 
                            		{
                                		type: "button", 
                                		onclick: this.deleteAll.bind(this), 
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
	});

	// Component to display the state of a particular task
	var TaskItem = Component.create({
	    initialState: function () {
	        return {
	            done: this.props().task.done
	        };
	    },
	    change: function() {
	        TaskActions.changeTaskState(this.props().task._id, !this.getState().done);
	        this.setState({
	            done: !this.getState().done
	        });
	    },
	    render: function () {
	        var classes = Component.classSet({
	            'task-done': true,
	            'label': true,
	            'label-success': this.getState().done,
	            'label-default': !this.getState().done
	        });
	        return m('li', { className: "list-group-item" },
	        	m('div', { className: "row" }, 
	        		[
	        			m('div', { className: "col-md-10" }, this.props().task.name),
	        			m('div', { className: "col-md-2" }, 
	        				m('span', { 
	        					className: classes, 
	        					onclick: this.change.bind(this), 
	        					style: 'cursor: pointer;' 
	        				}, 'Done')
	    				)
	        		]
	    		)
	    	);
	    }
	});

	// cache for component models so they can survive through 
	// multiple re-render of components
	var bucket = Component.bucket();

	// The final application combining all the components
	var app = Component.create({
	    initialState: function() {
	        return {
	            tasks: []
	        };
	    },
	    reloadTasks: function() {
	        this.setState({
	            tasks: TaskStore.getAllTasks()
	        });
	    },
	    init: function() {
	        TaskStore.init();
	        TaskStore.on(TaskConstants.TASKS_CHANGED, this.reloadTasks.bind(this));
	    },
	    render: function() {
	        var displayedTasks = _.map(this.getState().tasks, function(task) {
	        	return Component.createElement(TaskItem, 
	        		bucket.of(task._id, {task: task}))();
	        });
	        return m('div', { className: 'col-md-4' }, [
	        	m('h3', 'Todo List'),
	        	Component.createElement(NewTask, bucket.modelId('newTask'))(),
	        	m('ul', { className: 'list-group' }, displayedTasks)
	        ]);
	    }
	});

	return app;

})();

// attach the todo application in the DOM node with id 'demo'
Component.render(Component.createElement(TodoApp), document.getElementById('demo'));
```