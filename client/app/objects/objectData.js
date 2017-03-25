(function() {
  'use strict';

  angular.module('clientApp')
    .controller('ObjectDataCtrl', ['_', 'objectType', 'objectId', 'objectHelpers', 'assetHelpers', 'prospectHelpers', 'driverHelpers', 'carHelpers', '$q', '$state', '$scope', '$uibModal',
      function(_, objectType, objectId, objectHelpers, assetHelpers, prospectHelpers, driverHelpers, carHelpers, $q, $state, $scope, $uibModal) {

      var ctrl = this;
      // ctrl.assetType = { value: null };
      $scope.objectType = objectType;
      $scope.carIdentifier = null;

      $scope.valid = function (thing) {
          return thing !== null && typeof thing !== "undefined";
      };

      ctrl.getObjectById = function () {
          if($scope.objectType === 'car') {
              return carHelpers.getById;
          } else if($scope.objectType === 'driver') {
              // console.log($scope.stateRef);
              carHelpers.getIdentifier().then(function(identifier) {
                  $scope.carIdentifier = identifier;
              });

              return driverHelpers.getById;
          } else if($scope.objectType === 'prospect') {
              return prospectHelpers.getById;
          } else if($scope.objectType === 'asset') {
              return assetHelpers.getById;
          }
      };

      ctrl.getObjects = function (assetType) {
          if($scope.objectType === 'car') {
              return carHelpers.get;
          } else if($scope.objectType === 'driver') {
              return driverHelpers.get;
          } else if($scope.objectType === 'prospect') {
              return prospectHelpers.get;
          } else if($scope.objectType === 'asset') {
              return assetHelpers.getByType;
          }
      };

      ctrl.getObjectById()(objectId).then(function(result1) {
          // console.log(result1);
          if(typeof result1 !== 'undefined') { $scope.object = result1.data; }
          ctrl.assetType = $scope.object.assetType;
          $scope.identifierValue = $scope.object.data[$scope.object.identifier].value;

          $scope.tabs = [
              { title: 'Data', active: false, stateRef: objectHelpers.getStateRef($scope.objectType, $scope.object.id, 'Data') },
              { title: 'Logs', active: true, stateRef: objectHelpers.getStateRef($scope.objectType, $scope.object.id, 'Logs') }
          ];

          ctrl.getObjects()($scope.object.assetType).then(function(result2) {
              // console.log(result2);
              ctrl.objects = result2.data;
          });
      });

      // Add field
      $scope.addField = function() {
          var modalInstance = $uibModal.open({
              animation: true,
              templateUrl: 'views/addfieldmodal.html',
              controller: 'AddFieldModalInstanceCtrl',
              size: 'md',
              resolve: {
                  getObjects: function() {
                      return ctrl.objects
                  },
                  assetType: function() {
                      return $scope.objectType === 'asset' ? ctrl.assetType : null;
                  },
                  objectType: function() {
                      return $scope.objectType;
                  }
              }
          });

          modalInstance.result.then(function () {
              $state.forceReload();
          }, function() {
              $state.forceReload();
              console.log('Modal dismissed at: ' + new Date());
          });
      };

      /////////////////////////////
      // Driver Assignment UI /////
      /////////////////////////////

      $scope.assign = function(thing) {
          // console.log(`Assign ${thing} to ${$scope.objectType}`)
          var modalInstance = $uibModal.open({
              animation: true,
              templateUrl: 'views/assignmentmodal.html',
              controller: 'AssignmentModalCtrl',
              size: 'md',
              resolve: {
                  getDrivers: function() {
                      return $scope.objectType === 'car' ? driverHelpers.get : null;
                  },
                  getCars: function() {
                      return ($scope.objectType === 'driver' && thing === 'car') ? carHelpers.get : null;
                  },
                  subject: function() {
                      return $scope.object
                  },
                  subjectType: function() {
                      return $scope.objectType;
                  },
                  objectType: function() {
                      return thing;
                  },
                  getTypes: function() {
                      return ($scope.objectType === 'driver' && thing === 'asset') ? assetHelpers.getTypes : { data: null };
                  },
                  getAssets: function() {
                      return ($scope.objectType === 'driver' && thing === 'asset') ? assetHelpers.get : null;
                  },
                  asset: function() {
                      return $scope.objectType === 'asset' ? driverHelpers.get : null;
                  },
              }
          });

          modalInstance.result.then(function (input) {
              console.log('passed back from AssignmentModalCtrl:', input);
          }, function () {
              console.log('Modal dismissed at: ' + new Date());
          });
      };

      $scope.editField = function(object, field) {
          // console.log(object);
          // console.log(field);
          var modalInstance = $uibModal.open({
              animation: true,
              templateUrl: 'views/editFieldModal.html',
              controller: 'EditFieldModalCtrl',
              size: 'md',
              resolve: {
                  field: function() {
                      return field;
                  },
                  _object: function() {
                      return object;
                  },
                  objectType: function() {
                      return $scope.objectType;
                  },
                  getCars: function() {
                      // console.log(ctrl.objects);
                      return $scope.objectType === 'car' ? ctrl.objects : [];
                  },
                  getProspects: function() {
                      return $scope.objectType === 'prospect' ? ctrl.objects : [];
                  },
                  getDrivers: function() {
                      return $scope.objectType === 'driver' ? ctrl.objects : [];
                  },
                  getAssets: function() {
                      return $scope.objectType === 'asset' ? ctrl.objects : [];
                  }
              }
          });

          modalInstance.result.then(function () {
              // console.log('passed back from EditFieldModalCtrl:', input);
              $state.forceReload();
          }, function () {
              console.log('Modal dismissed at: ' + new Date());
              $state.forceReload();
          });
      };

      //
      // Prospect data stuff
      /////////////////////////////////////////////////
      $scope.notName = function(field) {
          // console.log(field);
          return ($scope.objectType === "prospect" || $scope.objectType === 'driver') && field === "Name" || field === 'assetType';
      };

      $scope.notStatus = function(field) {
          return (field.toLowerCase() !== "status");
      };

      String.prototype.capitalizeIfStatus = function() {
          return (this === 'status' && $scope.objectType === "prospect") ? (this.charAt(0).toUpperCase() + this.slice(1)) : this;
      };

      $scope.notNameOrStatus = function(field) {
          return ((field !== "First Name") && (field !== "Last Name") && (field !== "Name") && (field.toLowerCase() !== "status"));
      };

      // If field exists in fields, then append "~" to front of field until the conflict is resolved.
      ctrl.getUniqueFieldName = function(fields, field) {
          return (_.includes(fields, field)) ? ctrl.getUniqueFieldName(fields, "~" + field) : field;
      };

      ctrl.partitionFields = function(prospectData, driverData) {
          var prospectFields = Object.keys(prospectData)
          var driverFields = Object.keys(driverData)
          var inCommon = _.intersection(prospectFields, driverFields)
          var uniqueToProspect = _.difference(prospectFields, driverFields.concat('status'))      // We do not want drivers to have prospect's "status" field
          var uniqueToDriver = _.difference(driverFields, prospectFields)

          return {
            inCommon          : inCommon,
            uniqueToDriver    : uniqueToDriver,
            uniqueToProspect  : uniqueToProspect
          }
      };

      // used in convert?
      ctrl.splitProspectData = function (driverData, prospectData, fieldsInCommon) {
          var deferred = $q.defer();
          var prospectDataMinusFieldsInCommon = {};
          var prospectDataOnlyFieldsInCommon = {};
          angular.copy(prospectData, prospectDataMinusFieldsInCommon);

          var prospectFieldsToAddToAllDrivers = _.difference(Object.keys(prospectData), Object.keys(driverData));
          // console.log(Object.keys(driverData));
          // console.log(Object.keys(prospectData));
          // console.log(prospectFieldsToAddToAllDrivers);

          prospectFieldsToAddToAllDrivers = _.reject(prospectFieldsToAddToAllDrivers, function(field) {
              return _.includes(Object.keys(driverData), field);
          });

          _.each(fieldsInCommon, function(field) {
              delete prospectDataMinusFieldsInCommon[field];
              prospectDataOnlyFieldsInCommon[field] = prospectData[field];
              if(prospectHelpers.notName(field)) {
                  var renamedField = ctrl.getUniqueFieldName(Object.keys(driverData), field);
                  prospectFieldsToAddToAllDrivers.push(renamedField);
                  prospectDataOnlyFieldsInCommon[renamedField] = prospectDataOnlyFieldsInCommon[field];
                  delete prospectDataOnlyFieldsInCommon[field];
              }
          });

          deferred.resolve({
              // prospectDataFieldsUnCommon: prospectDataFieldsUnCommon,
              // prospectDataFieldsInCommon: prospectDataFieldsInCommon,
              prospectFieldsToAddToAllDrivers: _.without(prospectFieldsToAddToAllDrivers, "status")
          });

          deferred.reject(new Error('Error splitting prospect data via fields in common with driver data.'));
          return deferred.promise;
      };

      /*
          Changes the name of prospect fields if they conflict with names of driver fields
      */
      ctrl.resolveNameConflicts = function (_partedFields, _prospectData) {
          var deferred = $q.defer()
          var partedFields = _partedFields
          var prospectData = _prospectData

          _.each(partedFields.uniqueToProspect, function(field) {
              var temp = ctrl.getUniqueFieldName(partedFields.uniqueToDriver, field);

              if (temp !== field) {
                  partedFields.uniqueToProspect[_.indexOf(partedFields.uniqueToProspect, field)] = temp;
                  prospectData[temp] = prospectData[field];
                  delete prospectData[field];
                  objectHelpers.updateExpressionFieldsIfFieldNameChanged(field, temp, prospectData).then(function(prospectDataWithUpdatedExpressions) {
                      prospectData = prospectDataWithUpdatedExpressions;
                  });
              }
          });

          deferred.resolve({
              partedFields: partedFields,
              prospectData: prospectData,
          });
          deferred.reject(new Error("Error changing prospect field names"));
          return deferred.promise;
      };

      // Adds unique prospect fields to all drivers, renaming if necessary
      // Returns data of first updated driver
      ctrl.addProspectFieldsToExistingDrivers = function (fieldsUniqueToProspect, prospectData) {
          var deferred = $q.defer(),
              fields = fieldsUniqueToProspect;

          driverHelpers.get().then(function(result) {
              var drivers = result.data;
              // console.log(drivers);
              if(typeof drivers !== 'undefined' && drivers !== null) {
                  if(drivers.length > 0) {
                      _.each(drivers, function(driver, index, list) {
                          // console.log(driver);
                          // console.log(index);
                          // console.log(list);

                          _.each(fields, function(field) {
                              driver.data[field] = {
                                  value: null,
                                  log: false,
                                  type: prospectData[field].type,
                                  dataType: prospectData[field].dataType,
                                  expression: (prospectData[field].type === 'function') ? prospectData[field].expression : undefined,
                                  expressionItems: prospectData[field].type === 'function' ? prospectData[field].expressionItems : undefined,
                                  leftExpressionItems: prospectData[field].type === 'inequality' ? prospectData[field].leftExpressionItems : undefined,
                                  rightExpressionItems: prospectData[field].type === 'inequality' ? prospectData[field].rightExpressionItems : undefined,
                                  inequalitySignId: prospectData[field].type === 'inequality' ? prospectData[field].inequalitySignId : undefined,
                                  inequalitySign: prospectData[field].type === 'inequality' ? prospectData[field].inequalitySign : undefined,
                                  leftExpression: prospectData[field].type === 'inequality' ? prospectData[field].leftExpression : undefined,
                                  rightExpression: prospectData[field].type === 'inequality' ? prospectData[field].rightExpression : undefined,
                              };

                              if (driver.data.status) { delete driver.data.status; }
                              // console.log(driver);

                              // Runs regardless of whether fieldsUniqueToProspect >= 0
                              driverHelpers.update(driver).then(function(result) {
                                  if(index === 0) {
                                      // console.log(result.config.data.data);
                                      deferred.resolve(result.config.data.data);
                                      deferred.reject(new Error("Error getting updated driver data after adding prospect fields"));
                                  }
                              });
                          });
                      });
                  } else {
                      deferred.resolve(prospectData);
                      deferred.reject(new Error("Error getting updated driver data after adding prospect fields: there are no drivers"));
                  }
              } else {
                  deferred.resolve(prospectData);
                  deferred.reject(new Error("Error getting updated driver data after adding prospect fields: drivers is undefined or null"));
              }
          });

          return deferred.promise;
      };

      ctrl.buildNewDriverData = function(_prospectData, _partedFields) {
          // var deferred = $q.defer();
          var prospectData = _prospectData
          var partedFields = _partedFields

          _.each(prospectData, function(data, field) {
              // var temp = field.replace(/~/g, "");
              // console.log(temp);

              if(_.includes(partedFields.inCommon, field) || _.includes(partedFields.uniqueToProspect, field)) {
                  prospectData[field] = $scope.object.data[field];
                  // console.log(field);
                  // console.log($scope.object.data[field].value);
                  // console.log(data);
              } else {
                  prospectData[field].value = null;
              }
          });

          return prospectData

          // deferred.resolve(prospectData);
          // deferred.reject(new Error("Error creating new driver from prospect"));
          // return deferred.promise;
      };

      $scope.convert = function() {
        objectHelpers.getFormDataAndReference('driver').then(function(result) {
          // console.log(result);
          var fields = ctrl.partitionFields($scope.object.data, result.referenceObject.data)
          // console.log(fields);
          // console.log($scope.object.data);
          ctrl.resolveNameConflicts(fields, $scope.object.data).then(function(result) {
            // console.log(result);
            ctrl.addProspectFieldsToExistingDrivers(result.partedFields.uniqueToProspect, result.prospectData).then(function(prospectDataWithNoConflictingFields) {
              // console.log(prospectDataWithNoConflictingFields);
              var newDriverData = ctrl.buildNewDriverData(prospectDataWithNoConflictingFields, result.partedFields)
              // console.log(newDriverData);
              driverHelpers.createDriver(newDriverData).then(function(newDriver) {
                if(newDriver.data.status) { delete newDriver.data.status; }
                // console.log(newDriver);
                objectHelpers.evaluateExpressions(newDriver).then(function(newDriverWithEvaluatedExpressions) {
                // console.log(newDriverWithEvaluatedExpressions)
                  driverHelpers.saveDriver(newDriver).then(function() {
                    prospectHelpers.deleteProspect($scope.object.id);
                    $state.go('dashboard.prospects');
                  });
                })
              });
            });
          });
        });
      };

      // Delete modal
      $scope.openDeleteModal = function() {
        // console.log(objectId)
        var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: 'views/deleteobjmodal.html',
          controller: 'DeleteObjModalInstanceCtrl',
          size: 'md',
          resolve: {
            id: function() {
              return objectId;
            }
          }
        });
      };
    }]);
})();