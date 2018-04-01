"use strict";

const pipelineMiddleware = require("../index");;

const ACTION1 = "ACTION/ACTION1";
const ACTION2 = "ACTION/ACTION2";
const ACTION3 = "ACTION/ACTION3";

const action1 = param => ({type: ACTION1, param});
const action2 = param => ({type: ACTION2, param});
const action3 = param => ({type: ACTION3, param});

describe(">>> pipelineMiddleware", () => {
  describe(">>> with no pipelines defined", () => {
    const next = jest.fn();
    const pipelines = {};

    test("should let unrelated actions pass through", () => {
      pipelineMiddleware(pipelines)({})(next)(action1(false));
      pipelineMiddleware(pipelines)({})(next)(action2(true));

      expect(next.mock.calls.length).toBe(2);
      expect(next.mock.calls[0][0].type).toBe(ACTION1);
      expect(next.mock.calls[0][0].param).toBe(false);
      expect(next.mock.calls[1][0].type).toBe(ACTION2);
      expect(next.mock.calls[1][0].param).toBe(true);
    });
  });

  describe(">>> with null pipelines defined", () => {
    const next = jest.fn();
    const pipelines = {
      [ACTION1]: null,
      [ACTION2]: null
    };

    test("should let unrelated actions pass through", () => {
      pipelineMiddleware(pipelines)({})(next)(action1(false));
      pipelineMiddleware(pipelines)({})(next)(action2(true));

      expect(next.mock.calls.length).toBe(2);
      expect(next.mock.calls[0][0].type).toBe(ACTION1);
      expect(next.mock.calls[0][0].param).toBe(false);
      expect(next.mock.calls[1][0].type).toBe(ACTION2);
      expect(next.mock.calls[1][0].param).toBe(true);
    });
  });

  describe(">>> with null outcome pipelines defined", () => {
    const next = jest.fn();
    const pipelines = {
      [ACTION1]: () => null,
      [ACTION2]: () => null
    };

    test("should let unrelated actions pass through", () => {
      pipelineMiddleware(pipelines)({})(next)(action1(false));
      pipelineMiddleware(pipelines)({})(next)(action2(true));

      expect(next.mock.calls.length).toBe(2);
      expect(next.mock.calls[0][0].type).toBe(ACTION1);
      expect(next.mock.calls[0][0].param).toBe(false);
      expect(next.mock.calls[1][0].type).toBe(ACTION2);
      expect(next.mock.calls[1][0].param).toBe(true);
    });
  });

  describe(">>> with random object, array or primitive outcome pipelines defined", () => {
    const next = jest.fn();
    const pipelines = {
      [ACTION1]: () => [0, 1, 2],
      [ACTION2]: () => 12,
      [ACTION3]: () => ({
        random: 1,
        object: true
      })
    };

    test("should execute whole chain without halt", () => {
      pipelineMiddleware(pipelines)({})(next)(action1(false));
      pipelineMiddleware(pipelines)({})(next)(action2(true));
      pipelineMiddleware(pipelines)({})(next)(action3(false));

      expect(next.mock.calls.length).toBe(3);
      expect(next.mock.calls[0][0].type).toBe(ACTION1);
      expect(next.mock.calls[0][0].param).toBe(false);
      expect(next.mock.calls[1][0].type).toBe(ACTION2);
      expect(next.mock.calls[1][0].param).toBe(true);
      expect(next.mock.calls[2][0].type).toBe(ACTION3);
      expect(next.mock.calls[2][0].param).toBe(false);
    });
  });

  describe(">>> with action outcome pipelines defined", () => {
    const next = jest.fn();
    const pipelines = {
      [ACTION1]: () => action2(true),
      [ACTION2]: () => ({ ...action1(true), halt: true })
    };

    test("should execute whole chain without halt", () => {
      pipelineMiddleware(pipelines)({})(next)(action1(false));

      expect(next.mock.calls.length).toBe(2);
      expect(next.mock.calls[0][0].type).toBe(ACTION2);
      expect(next.mock.calls[0][0].param).toBe(true);
      expect(next.mock.calls[1][0].type).toBe(ACTION1);
      expect(next.mock.calls[1][0].param).toBe(false);
    });

    test("should execute chain till halt is met", () => {
      pipelineMiddleware(pipelines)({})(next)(action2(true));

      expect(next.mock.calls.length).toBe(3);
      expect(next.mock.calls[2][0].type).toBe(ACTION1);
      expect(next.mock.calls[2][0].param).toBe(true);
    });
  });

  describe(">>> with function outcome pipelines defined", () => {
    const next = jest.fn();
    const pipelines = {
      [ACTION1]: () => () => action2(true),
      [ACTION2]: () => () => ({
        ...action1(true),
        halt: true
      })
    };

    test("should execute whole chain without halt", () => {
      pipelineMiddleware(pipelines)({})(next)(action1(false));

      expect(next.mock.calls.length).toBe(2);
      expect(next.mock.calls[0][0].type).toBe(ACTION2);
      expect(next.mock.calls[0][0].param).toBe(true);
      expect(next.mock.calls[1][0].type).toBe(ACTION1);
      expect(next.mock.calls[1][0].param).toBe(false);
    });

    test("should execute chain till halt is met", () => {
      pipelineMiddleware(pipelines)({})(next)(action2(true));

      expect(next.mock.calls.length).toBe(3);
      expect(next.mock.calls[2][0].type).toBe(ACTION1);
      expect(next.mock.calls[2][0].param).toBe(true);
    });
  });

  describe(">>> with generator outcome pipelines defined", () => {
    const next = jest.fn();
    const pipelines = {
      [ACTION1]: () =>
        function* generator() {
          yield action2(true);
          yield () => action2(false);
          yield () => () => () => action2(true);
          yield action2(false);
        },
      [ACTION2]: () =>
        function* generator() {
          yield action1(true);
          yield () => action1(false);
          yield { ...action1(true), halt: true };
          yield action1(false);
        }
    };

    test("should execute whole chain without halt", () => {
      pipelineMiddleware(pipelines)({})(next)(action1(false));

      expect(next.mock.calls.length).toBe(5);
      expect(next.mock.calls[0][0].type).toBe(ACTION2);
      expect(next.mock.calls[0][0].param).toBe(true);
      expect(next.mock.calls[1][0].type).toBe(ACTION2);
      expect(next.mock.calls[1][0].param).toBe(false);
      expect(next.mock.calls[2][0].type).toBe(ACTION2);
      expect(next.mock.calls[2][0].param).toBe(true);
      expect(next.mock.calls[3][0].type).toBe(ACTION2);
      expect(next.mock.calls[3][0].param).toBe(false);
      expect(next.mock.calls[4][0].type).toBe(ACTION1);
      expect(next.mock.calls[4][0].param).toBe(false);
    });

    test("should execute chain till halt is met", () => {
      pipelineMiddleware(pipelines)({})(next)(action2(true));

      expect(next.mock.calls.length).toBe(8);
      expect(next.mock.calls[5][0].type).toBe(ACTION1);
      expect(next.mock.calls[5][0].param).toBe(true);
      expect(next.mock.calls[6][0].type).toBe(ACTION1);
      expect(next.mock.calls[6][0].param).toBe(false);
      expect(next.mock.calls[7][0].type).toBe(ACTION1);
      expect(next.mock.calls[7][0].param).toBe(true);
    });
  });

  describe(">>> with promise outcome pipelines defined", () => {
    const next = jest.fn();
    const promiseP1 = new Promise(resolve => {
      setTimeout(resolve, 100, () => action2(false));
    });
    const promiseP2 = new Promise(resolve => {
      setTimeout(resolve, 300, () => () => () => () => () => ({
        ...action1(true),
        halt: true
      }));
    });
    const pipelines = {
      [ACTION1]: () => promiseP1,
      [ACTION2]: () => promiseP2
    };

    test("should execute whole chain without halt", () => {
      pipelineMiddleware(pipelines)({})(next)(action1(false));

      expect.assertions(5);
      return promiseP1.then(() => {
        expect(next.mock.calls.length).toBe(2);
        expect(next.mock.calls[0][0].type).toBe(ACTION2);
        expect(next.mock.calls[0][0].param).toBe(false);
        expect(next.mock.calls[1][0].type).toBe(ACTION1);
        expect(next.mock.calls[1][0].param).toBe(false);
      });
    });

    test("should execute chain till halt is met", () => {
      pipelineMiddleware(pipelines)({})(next)(action2(true));
      expect.assertions(3);
      return promiseP2.then(() => {
        expect(next.mock.calls.length).toBe(3);
        expect(next.mock.calls[2][0].type).toBe(ACTION1);
        expect(next.mock.calls[2][0].param).toBe(true);
      });
    });
  });
});
