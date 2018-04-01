"use strict";

const _ = require("lodash");

/**
 * Handle the pipeline outcome which can be an action, function,
 * generator or promise
 * @param {object | function | generator | promise} outcome - outcome of the pipeline
 * @param {object} action - the action that triggers the pipeline
 * @param {function} next - store provided function to send an action to the dispatcher
 * @return {boolean} if false, the chain execution is halted
 */
const handleOutcome = (outcome, action, next) => {
  if (outcome) {
    if (_.isString(outcome.type)) {
      /**
       * handles the pipeline returning action objects
       * if the action object is not halting the execution, the default
       * action will also reach the reducers
       */
      next(outcome);
      return outcome.halt !== true;
    } else if (_.isFunction(outcome)) {
      const fnOutcome = outcome();

      /**
       * handles the pipeline returning generators
       */
      if (_.isFunction(fnOutcome.next)) {
        let done;
        let value;
        let shouldContinue;

        do {
          ({ done, value } = fnOutcome.next());

          if (!done) {
            shouldContinue = handleOutcome(value, action, next);
          }

          /**
           * if any yielded action is halting the exection we should end the
           * pipeline execution programatically
           */
          if (!shouldContinue) {
            break;
          }
        } while (!done);

        if (!shouldContinue) {
          return false;
        }
      } else {
        /**
         * handles the pipeline returning functions
         */
        return handleOutcome(fnOutcome, action, next);
      }
    } else if (outcome instanceof Promise) {
      /**
       * handles the pipeline returning promises
       */
      outcome.then(prOutcome => {
        const shouldContinue = handleOutcome(prOutcome, action, next);

        if (shouldContinue) {
          next(action);
        }
      });
      /**
       * since promises are async we will stop the default action from occuring
       * and condition it in the promise fullfilment
       */
      return false;
    }
  }

  /**
   * If we did not catch an outcome or the outcome is not an action, function, generator or
   * promise we will proceed with the redux action without the middleware interfeering
   */
  return true;
};

/**
 * Pipeline Middleware implementation
 * @param {object} pipelines - actionType, pipeline pair object
 */
const pipelineMiddleware = pipelines => store => next => action => {
  if (
    pipelines &&
    pipelines[action.type] &&
    _.isFunction(pipelines[action.type])
  ) {
    const shouldContinue = handleOutcome(
      pipelines[action.type](action, store),
      action,
      next
    );

    if (!shouldContinue) {
      return;
    }
  }

  /**
   * If we did not create a pipeline for the action that was triggered
   * we will proceed with the redux action without the middleware interfeering
   */
  next(action);
};

module.exports = pipelineMiddleware;
