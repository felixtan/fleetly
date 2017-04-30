"use strict";

var ENV = {};

// Import variables if present (from env.js)
if (window) {
  Object.assign(ENV, window.__env);
}

 angular.module('config', [])
.constant('ENV', ENV);
