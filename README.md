# Pipeline Middleware
[![Build Status](https://travis-ci.org/s-timofte/pipeline-middleware.svg?branch=master)](https://travis-ci.org/s-timofte/pipeline-middleware)
[![Coverage Status](https://coveralls.io/repos/github/s-timofte/pipeline-middleware/badge.svg?branch=master)](https://coveralls.io/github/s-timofte/pipeline-middleware?branch=master)

Pipeline Middleware represents a simple and customizable way to dispatch Redux actions based on other actions being dispatched. The Pipeline Middleware is capable of handling simple actions as the output as well as action returning functions, action yielding generators and actions resulting from promise fullfilment.

The Pipeline Middleware provide a simple way of combining the pipelines based on an actionType keyed object that will pair actions with execution pipelines that result in different actions.

The original action can be allowed to reach the reducer or not through a simple `halt` flag that breaks the pipeline execution thread when an action containing it has been fired.

## Installation
To install Pipeline Middleware simply add it to your dependency modules:

NPN: `npm install pipeline-middleware`  
Yarn: `yarn add pipeline-middleware`  

Then simply hook it into the Redux middlewares declaration:
```javascript
const middlewares = applyMiddleware(pipelineMiddleware(pipelines()));
const store = createStore(reducers, {}, middlewares);
```

Pipeline Middleware takes one argument when invoked, and that is an object of actionType, function (pipeline) pairs. Each function will be executed when that specific action whose type is the pipeline key will be fired.

## Support
Pipelines will be executed expecting an action representation as a result. If one is not reached the outcome will be recursively executed (if possible) until such an action representation is reached. As such the pipelines can return an action representation, a function, a generator, a promise or any chain of the previous as long as at the end of all the executions an action representation is returned. If that point is not reached the pipeline will simply let the normal flow continue.

### Action Example
```javascript
const pipelines = () => ({
    [action1.type]: (action1, store) => chAction1(),
    [action2.type]: (action2, store) => ({ ...chAction2(), halt: true })
});
```

While the first example will chain chAction1 and action1 and send them both to the reducers, the second example will only send chAction2 to the reducers, the halt flag being present and telling the pipeline that execution has to be stopped after this action is sent to the store.

### Function example
```javascript
const pipelines = () => ({
    [action1.type]: (action1, store) => () => chAction1(),
    [action2.type]: (action2, store) => () => ({ ...chAction2(), halt: true })
});
```

As in the previous exemple the pipeline will fire the following actions:  
Eg1: chAction1 > action1  
Eg2: chAction2

### Generator example
```javascript
const pipelines = () => ({
    [action1.type]: () => function* generator() {
        yield chAction1();
        yield () => chAction2();
        yield () => () => () => chAction3();
        yield chAction4();
    },
    [action2.type]: () => function* generator() {
        yield chAction5();
        yield () => chAction6();
        yield { ...chAction7(), halt: true };
        yield chAction8();
    }
});
```

The pipeline will fire the following actions:  
Eg1: chAction1 > chAction2 > chAction3 > chAction4 > action1  
Eg2: chAction5 > chAction6 > chAction7

Note that a `halt` flag will stop not only the original action but also the following chained actions

### Promise Example
```javascript
const pipelines = () => ({
    [action1.type]: () => new Promise(resolve => {
      setTimeout(resolve, 100, () => chAction1());
    });,
    [action2.type]: () => new Promise(resolve => {
      setTimeout(resolve, 300, () => () => () => () => () => ({
        ...chAction2(),
        halt: true
      }));
    });
});
```

The pipeline will fire the following actions:  
Eg1: chAction1 > action1  
Eg2: chAction2
