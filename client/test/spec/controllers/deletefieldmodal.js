'use strict';

describe('Controller: DeletefieldmodalCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var DeletefieldmodalCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    DeletefieldmodalCtrl = $controller('DeletefieldmodalCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));
});
