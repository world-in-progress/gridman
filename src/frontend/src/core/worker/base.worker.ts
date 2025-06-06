import Actor from "../message/actor";
import { Callback, WorkerSelf } from "../types";

// Base Worker Types //////////////////////////////////////////////////

type FuncModule = { [key: string]: Function };
declare const self: WorkerSelf;

// Base Worker Members /////////////////////////////////////////////////

self.actor = new Actor(self, self);

self.checkIfReady = async (_: any, callback: Callback<any>) => {
  callback();
};

function register(module: any) {
  for (const key in func) {
    // Bind each function in the module to the worker context
    for (const key in module) {
      if (typeof module[key] !== "function") continue; // Only bind functions
      const element = module[key];
      if (element) self[key] = element.bind(self);
    }
  }
}

// Register all functions from the module //////////////////////////////

import * as func from "./func.worker";
register(func);

import * as gridUtils from "../grid/util.worker";
register(gridUtils);

import * as schemaUtils from "@/components/schemaPanel/utils/util.worker";
register(schemaUtils);

import * as projectUtils from "@/components/projectPanel/utils/util.worker";
register(projectUtils);

import * as featureUtils from "@/components/featurePanel/utils/util.worker";
register(featureUtils);
