'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:AddfieldmodalinstanceCtrl
 * @description
 * # AddfieldmodalinstanceCtrl
 * Controller of the clientApp
 */
angular.module('clientApp')
  .controller('AddFieldModalInstanceCtrl', function ($q, $state, getAssets, getCars, getDrivers, getProspects, $scope, $modalInstance, dataService) {
    
    // var mexp = 
    $scope.formData = {};
    $scope.objects = [];
    $scope.objectType = null;
    $scope.assetType = null;
    $scope.update = function(object) { return; };
    $scope.fields = [];
    $scope.functionFieldSelect = { value: null };
    $scope.functionConstantInput = { value: null };

    // Inequalities
    $scope.rightSide = false;

    var testExpressionItems = [];
    $scope.validExpression = true;      // this will depend on results from mexp
    var testExpression = "";       // passed into mexp for validation, fields will be replaced with 1
    $scope.expressionErrorMessage;

    /*
      Type of field     Data type 
      -------------     ---------
      text              text
      number            number
      boolean           boolean
      function          number
      inequality        boolean
    */

    $scope.field = {  // when this value changes, the UI dynamically changes
      name: null,
      type: null,
      dataType: null,
      expressionItems: [],
      expression: '',
      inequalitySign: '',             // for displaying the inequality to client
      inequalitySignId: null,
      leftExpressionItems: [],
      leftExpression: '',
      rightExpressionItems: [],
      rightExpression: ''
    };

    $scope.setInequalitySign = function(signId) {
      switch(signId) {
        case '0':
          // $scope.field.inequalitySign = '>';      // might want to use html codes instead
          $scope.field.inequalitySign = ">";
          break;
        case '1':
          $scope.field.inequalitySign = '≥';
          break;
        case '2':
          $scope.field.inequalitySign = '<';
          break;
        case '3':
          $scope.field.inequalitySign = '≤';
          break;
        default:
          $scope.field.inequalitySign = undefined;
          break;
      }
    };

    $scope.setDataType = function(field) {
      switch(field.type) {
        case "text":
          $scope.field.dataType = "text";
          break;
        case "number":
          $scope.field.dataType = "number";
          break;
        case "boolean":
          $scope.field.dataType = "boolean";
          break;
        case "function":
          $scope.field.dataType = "number";
          break;
        case "inequality":
          $scope.field.dataType = "boolean";
          break;
        default:
          $scope.field.dataType = undefined;
          break;
      }
    };

    $scope.invalidFieldType = function() {
      return (($scope.field.type === null) || (typeof $scope.field.type === 'undefined') || ($scope.field.dataType === null) || (typeof $scope.field.dataType === 'undefined'));
    };

    /*
      Type of items     Additonal actions 
      -------------     -----------------
      operator          ?
      constant          none
      field             replace with 1 for testExpression
    */
    $scope.appendItemToFunction = function(item, typeOfItem) {
      if($scope.field.type === 'function') {
        $scope.field.expressionItems.push({ type: typeOfItem, value: item });
      } else {
        if($scope.rightSide) {
          $scope.field.rightExpressionItems.push({ type: typeOfItem, value: item });
        } else {
          $scope.field.leftExpressionItems.push({ type: typeOfItem, value: item });
        }
      }

      // validation
      validate(testExpressionItems, typeOfItem, item);

      // console.log(testExpression);
      // console.log(testExpressionItems);
      
      // resetting
      $scope.functionFieldSelect.value = null;
      $scope.functionConstantInput.value = null;
    };

    function validate(testExpressionItems, typeOfItem, item) {
      firstStageValidation(testExpressionItems, typeOfItem, item).then(function(result1) {
        console.log(result1);
        displayExpression().then(function(expressionItems) {
          buildTestExpression(result1.testExpressionItems).then(function(mockTestExpression) {
            console.log(mockTestExpression);
            if(result1.valid) {
              // call second stage
                console.log('testExpression:', testExpression);
                $scope.validExpression = true;  
                validateExpression();
            } else {  
              // don't call second stage
            }
          });
        });
      });
    };

    function firstStageValidation(testExpressionItems, typeOfItem, item) {
      var deferred = $q.defer();
      $scope.validExpression = true;
      if(testExpressionItems.length) {
        // validate before pushing
        if(typeOfItem === 'field' || typeOfItem === 'constant') {
          if(testExpressionItems[testExpressionItems.length-1].type !== 'operator') {
            // should fix 2mileage problem; not the first item and last item isnt an operator -> invalid
            testExpressionItems.push({ type: typeOfItem, value: item });    // this should render the expression invalid according to first stage validation
            $scope.validExpression = false;
            $scope.expressionErrorMessage = "Missing operator before " + typeOfItem + " " + item;
          } else {
            // not the first item and last item is an operator -> ok
            if(typeOfItem === 'field') {
              testExpressionItems.push({ type: typeOfItem, value: '1' });  
            } else {
              // it's a constant
              testExpressionItems.push({ type: typeOfItem, value: item });  
            }
          }
        } else {
          // it's an operator -> ok
          testExpressionItems.push({ type: typeOfItem, value: item });
        }
      } else {
        // push it then validate
        testExpressionItems.push({ type: typeOfItem, value: item });
      }

      deferred.resolve({ testExpressionItems: testExpressionItems, valid: $scope.validExpression });
      deferred.reject(new Error('Error in first stage validation of expression'));
      return deferred.promise;
    };

    function setAndValidateExpression() {
      displayExpression().then(function() {
        buildTestExpression(testExpressionItems).then(function() {
          $scope.validExpression = true;  
          validateExpression();
        });
      });
    };

    function validateExpression() {
      $scope.expressionErrorMessage = undefined;

      try {
        mexp.eval(testExpression);
      } catch(e){
        console.error(e);
        $scope.validExpression = false;
        $scope.expressionErrorMessage = e.message;
      }
    };

    function buildTestExpression(_testExpressionItems_) {
      var deferred = $q.defer();
      testExpression = "";
      _.each(_testExpressionItems_, function(item) {
        // console.log(item.value);
        testExpression = testExpression + item.value;
      });
      deferred.resolve(testExpression);
      deferred.reject(new Error('Error building test expression'));
      return deferred.promise;
    };

    function displayExpression() {
      var deferred = $q.defer();

      if($scope.field.type === 'function') {
        $scope.field.expression = "";
        deferred.resolve(_.each($scope.field.expressionItems, function(item) {
          $scope.field.expression = $scope.field.expression + item.value;
        }));
      } else {
        if($scope.rightSide) {
          $scope.field.rightExpression = "";
          deferred.resolve(_.each($scope.field.rightExpressionItems, function(item) {
            $scope.field.rightExpression += item.value;
          }));
        } else {
          $scope.field.leftExpression = "";
          deferred.resolve(_.each($scope.field.leftExpressionItems, function(item) {
            $scope.field.leftExpression += item.value;
          }));
        }
      }

      deferred.reject(new Error('Error getting display expression'));
      return deferred.promise;
    };

    $scope.undoExpression = function() {
      var item = {};
      if($scope.field.type === 'function') {
        if($scope.field.expressionItems.length) {
          item = $scope.field.expressionItems.pop();
        }
      } else {
        if($scope.rightSide) {
          if($scope.field.rightExpressionItems.length) {
            item = $scope.field.rightExpressionItems.pop();
          }
        } else {
          if($scope.field.leftExpressionItems.length) {
            // console.log('removing left');
            // console.log($scope.field.leftExpressionItems);
            item = $scope.field.leftExpressionItems.pop();
          }
        }
      }

      console.log('removed:', item);
      testExpressionItems.pop();
      
      firstStageValidate_Undo().then(function(validExpression) {
        displayExpression().then(function(expressionItems) {
          buildTestExpression(testExpressionItems).then(function(mockTestExpression) {
            console.log(mockTestExpression);
            if(validExpression) {
              // call second stage
                console.log('testExpression:', testExpression);
                $scope.validExpression = true;  
                validateExpression();
            } else {  
              // don't call second stage
            }
          });
        });
      });
    };

    function firstStageValidate_Undo() {
      var deferred = $q.defer();
      var lastItem = testExpressionItems[testExpressionItems.length-1];
      $scope.validExpression = true;
      if(testExpressionItems.length > 1) {
        if(lastItem.type === 'field' || lastItem.type === 'constant') {
          var previousItem = testExpressionItems[testExpressionItems.length-2];
          if(previousItem.type !== 'operator') {
            $scope.validExpression = false;
            $scope.expressionErrorMessage = "Missing operator before " + previousItem.type + " " + previousItem.value;
          }
        }  
      }

      deferred.resolve($scope.validExpression);
      deferred.reject(new Error('Error during first stage validation after undo'));
      return deferred.promise;
    }

    $scope.clearExpression = function() {
      testExpression = "";
      $scope.field.expression = "";
      $scope.field.expressionItems = [];
      testExpressionItems = [];
      $scope.field.leftExpressionItems = [];
      $scope.field.leftExpression = "";
      $scope.field.rightExpressionItems = [];
      $scope.field.rightExpression = "";
      $scope.field.inequalitySign = "";
      $scope.field.inequalitySignId = null;
      $scope.validExpression = true;
      $scope.expressionErrorMessage = undefined;
    };

    if($state.includes('carProfile') || $state.includes('dashboard.cars')) {
      // console.log("add field modal called from carProfile");
      $scope.objects = getCars.data;
      $scope.objectType = 'car';
      $scope.update = dataService.updateCar;
    } else if($state.includes('driverProfile') || $state.includes('dashboard.drivers')) {
      // console.log("add field modal called from driverProfile");
      $scope.objects = getDrivers.data;
      $scope.objectType = 'driver';
      $scope.update = dataService.updateDriver;
    } else if($state.includes('prospectProfile') || $state.includes('dashboard.prospects')) {
      // console.log("add field modal called from prospectProfile");
      $scope.objects = getProspects.data;
      $scope.objectType = 'prospect';
      $scope.update = dataService.updateProspect;
    } else if($state.includes('assetProfile') || $state.includes('dashboard.assets')) {
      // console.log("add field modal called from assetProfile");
      $scope.assetType = getAssets.type;
      $scope.objects = _.filter(getAssets.data, function(asset) { return asset.assetType === $scope.assetType; });
      $scope.objectType = 'asset';
      $scope.update = dataService.updateAsset;
    } else {
      console.log('add field modal called from invalid state', $state.current);
    }

    // General post-processing regardless of object
    $scope.fields = $scope.objects[0] ? (Object.keys($scope.objects[0].data)) : [];
    if($scope.objects[0]) setValidFieldsForExpressions($scope.objects[0].data);

    function createNewFieldData(field) {
      var deferred = $q.defer();
      deferred.resolve({
        value: null,
        log: $scope.formData.log || false,
        dataType: field.dataType,
        type: field.type,
        expressionItems: ((field.type === 'function' || field.type === 'inequality') ? field.expressionItems : undefined)
      });
      deferred.reject(new Error('Error creating new field data'));
      return deferred.promise;
    };

    function appendNewFieldToObject(fieldName, fieldDataObj, object) {
      var deferred = $q.defer();
      // console.log(fieldName);
      // console.log(fieldDataObj);
      object.data[fieldName] = fieldDataObj;
      deferred.resolve(object);
      deferred.reject(new Error('Error updating object'));
      return deferred.promise;
    };

    function updateObjects() {
      var deferred = $q.defer();
    
      deferred.resolve(_.each($scope.objects, function(object) {
        evaluateExpression(object, $scope.field.expressionItems).then(function(expressionValue) {
          // console.log(expressionVal);
          createNewFieldData($scope.field).then(function(fieldDataObj) {
            fieldDataObj.value = expressionValue;
            appendNewFieldToObject($scope.field.name, fieldDataObj, object).then(function(objectToUpdate) {
              // console.log('object to update:', objectToUpdate);
              $scope.update(objectToUpdate).then(function(whatever) {
                $state.forceReload();
              });
            });
          });
        });
      }));
      deferred.reject(new Error('Error updating objects'));
      return deferred.promise;
    };

    $scope.submit = function() {
      updateObjects().then(function(updatedObjects) {
        // console.log(updatedObjects);
        $scope.ok($scope.field);
      });
    };

    $scope.reset = function () {
      $scope.formData = {};
      $scope.form.$setPristine();
      $scope.form.$setUntouched();
      $state.forceReload();
    };

    $scope.ok = function(newFieldObj) {
      $state.forceReload();
      $modalInstance.close(newFieldObj);
    };

    $scope.close = function () {
        $state.forceReload();
        $modalInstance.dismiss('cancel');
    };

    // build expression
    function buildExpression(object, expressionItems) {
        var deferred = $q.defer();
        var expression = "";

        _.each(expressionItems, function(item) {
            if(item.type === 'field') {
                expression += object.data[item.value].value;
            } else {
                expression += item.value;
            }
        });

        deferred.resolve(expression);
        deferred.reject(new Error('Error building expression'));
        return deferred.promise;
    };

    // evaluate expression
    function evaluateExpression(object, expressionItems) {
      var deferred = $q.defer();
      var result;
      buildExpression(object, expressionItems).then(function(expression) {
          // console.log(expression);
          // console.log(mexp.eval(expression));
          // return ((typeof parseFloat(mexp.eval(expression)) === 'number') ? mexp.eval(expression) : null);
          // result = ((typeof parseFloat(mexp.eval(expression)) === 'number') ? mexp.eval(expression) : null);
          deferred.resolve(((typeof parseFloat(mexp.eval(expression)) === 'number') ? mexp.eval(expression) : null));
          deferred.reject(new Error('Error evaluating expression'));
      });

      // deferred.resolve(result);
      // deferred.reject(new Error('Error evaluating expression'));
      return deferred.promise;
    };

    function setValidFieldsForExpressions(objectData) {
        // only numbers
        // neglect the field in questions or else shit gets recursive
        // console.log(objectData);
        var keys = Object.keys(objectData);
        $scope.validFieldsForExpressions = _.filter(keys, function(key) {
            return ((objectData[key].dataType === 'number'));
        });
    };
  });
