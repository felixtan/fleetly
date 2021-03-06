(function() {
  'use strict';

  /**
   * @ngdoc service
   * @name clientApp.driverHelpers
   * @description
   * # driverHelpers
   * Service in the clientApp.
   */
  angular.module('clientApp')
    .factory('driverHelpers', ['$rootScope', '$q', 'dataService', 'ENV', '_', function($rootScope, $q, dataService, ENV, _) {

      //////////////////////////
      //  Data CRUD and Forms //
      //////////////////////////

      var get = dataService.getDrivers;
      var getById = dataService.getDriver;
      var saveDriver = dataService.createDriver;
      var update = dataService.updateDriver;

      return {

        // Data
        getOrganizationId: getOrganizationId,
        get: get,
        getById: getById,
        saveDriver: saveDriver,
        update: update,
        createDriver: createDriver,
        thereAreDrivers: thereAreDrivers,
        getFields: getFields,
        notName: notName,
        namesNotNull: namesNotNull,
        // namesNotNullOnFormdata: namesNotNullOnFormdata,
        getFullName: getFullName,
        updateFullName: updateFullName,
        getDefaultDriver: getDefaultDriver,
        getFormDataAndRepresentative: getFormDataAndRepresentative,

        // Logs
        getLogDates: getLogDates,                   // returns array of log dates in ms in present to past order; logDates[0] stores most recent log date
        getFieldsToBeLogged: getFieldsToBeLogged,
        createLogData: createLogData,               // relies on getFieldsToBeLogged
        createLog: createLog,                       // relies on createLogData and calcLogDates
        createLogs: createLogs,
        populateLogs: populateLogs

      };

      function getOrganizationId() {
        return (ENV.name === ('production' || 'staging')) ? $rootScope.user.customData.organizationId : ENV.organizationId;
      }

      function getFullName(driverData) {
        return driverData["First Name"].value + " " + driverData["Last Name"].value;
      }

      function thereAreDrivers() {
        var deferred = $q.defer();
        get().then(function(result) {
          deferred.resolve((typeof result.data[0] !== 'undefined'));
          deferred.reject(new Error('Error determining if there are drivers.'));
        });
        return deferred.promise;
      }

      function getFields() {
        var deferred = $q.defer();
        get().then(function(result) {
          deferred.resolve(Object.keys(result.data[0].data));
          deferred.reject(new Error('Failed to get fields'));
        });
        return deferred.promise;
      }

      function notName(field) {
        return ((field !== "First Name") && (field !== "Last Name") && (field !== "Name"));
      }

      function namesNotNull(driverData) {
        // console.log(driverData);
        return ((driverData["First Name"].value !== null) && (driverData["Last Name"].value !== null));
      }

      function updateFullName(driverData) {
        driverData.Name = {
          value: getFullName(driverData),
          log: false,
          dataType: 'text',
        };

        return driverData;
      }

      function createDriver(driverData, identifier) {
        var deferred = $q.defer();

        if(driverData.assetType) {
          delete driverData.assetType;
        }

        var data = updateFullName(driverData);

        createLogData().then(function(logData) {
          getLogDates().then(function(logDates) {
            var logs = createLogs(logDates, logData);

            deferred.resolve({
              identifier: "Name",
              data: data,
              logs: logs,
              carsAssigned: [],
              assetsAssigned: [],
              organizationId: getOrganizationId()
            });

            deferred.reject(new Error('Error creating driver'));
          });
        });

        return deferred.promise;
      }

      /**
       * This is promisified because of how objectHelpers calls getDefaultObject
       * in getFormDataAndReference.
       */
      function getDefaultDriver() {
        var deferred = $q.defer();

        deferred.resolve({
            identifier: "Name",
            data: {
              "First Name": {
                value: null,
                log: false,
                dataType: 'text',
              },
              "Last Name": {
                value: null,
                log: false,
                dataType: 'text',
              },
              "Name": {
                value: null,
                log: false,
                dataType: 'text',
              }
            },
            logs: [],
            carsAssigned: [],
            assetsAssigned: [],
            organizationId: getOrganizationId(),
        });
        deferred.reject(new Error("Error getting default driver."));
        return deferred.promise;
      }

      function getFormDataAndRepresentative() {
        var deferred = $q.defer();
        var formData = {};

        thereAreDrivers().then(function(ans) {
          if(ans) {
            // console.log('there are drivers');
            get().then(function(result) {
              var driverData = result.data[0].data;
              // console.log(driver);
              _.each(Object.keys(driverData), function(field) {
                formData[field] = {
                  value: null,
                  log: driverData[field].log,
                  dataType: driverData[field].dataType,
                };
              });

              // console.log('there are cars, driver data:', formData);
              deferred.resolve({
                formData: formData,
                representativeData: driverData
              });
              deferred.reject(new Error('Error initializing driver form data'));
            });
          } else {
            var defaultDriver = getDefaultDriver();
            deferred.resolve({
              formData: defaultDriver.data,
              representativeData: defaultDriver.data
            });
            // console.log('there are no drivers, default driver data:', defaultDriverData);
            deferred.reject(new Error('Error initializing driver form data'));
          }
        });

        return deferred.promise;
      }

      /////////////////
      /// Logs CRUD ///
      /////////////////

      function getLogDates() {
        var deferred = $q.defer();
        var logDates = [];

        get().then(function(result) {
          var drivers = result.data;
          if(drivers.length > 0) {
            _.each(drivers, function(driver) {
              _.each(driver.logs, function(log) {
                logDates.push(log.weekOf);
                logDates = _.uniq(logDates.sort(), true).reverse();
              });
            });
          }

          deferred.resolve(logDates);
          deferred.reject(new Error('Error getting log dates'));
        });

        return deferred.promise;
      }

      function createLog(data, weekOf) {
        return {
          data: data,
          weekOf: weekOf,
          createdAt: new Date(),
        };
      }

      function createLogs(logDates, blankLogData) {
        var logs = [];

        _.each(logDates, function(logDate) {
          logs.push({
            data: blankLogData,
            weekOf: logDate,
            createdAt: new Date()
          });
        });

        return logs;
      }

      function getFieldsToBeLogged() {
        var deferred = $q.defer();
        var fields = [];

        get().then(function(result) {
          var drivers = result.data;
          if(drivers.length > 0) {
            fields = _.filter(Object.keys(drivers[0].data), function(field) {
              return drivers[0].data[field].log;
            });
          }

          deferred.resolve(fields);
          deferred.reject(new Error('Error getting fields to be logged'));
        });

        return deferred.promise;
      }

      function createLogData() {
        var deferred = $q.defer();
        var logData = {};

        getFieldsToBeLogged().then(function(fields) {
          // console.log(fields);
          _.each(fields, function(field) {
            logData[field] = null;
          });

          deferred.resolve(logData);
          deferred.reject(new Error('Error creating log data'));
        });

        return deferred.promise;
      }

      function populateLogs(driver) {
        // promise groups
        // 1. getFieldsToBeLogged -> createLogData
        // 2. getDrivers -> getLogDates
        // 3. 1,2 -> createLogs (_.each combine with createLog)

        var deferred = $q.defer();
        var promise1 = getFieldsToBeLogged(driver).then(createLogData, errcb);
        var promise2 = get().then(getLogDates, errcb);

        $q.all([promise1, promise2]).then(function(values) {
          var logs = createLogs(values[1], values[0]);
          driver.logs = logs;
          deferred.resolve(driver);
          deferred.reject(new Error('Failed to populate logs for driver ' + driver.id));
        }, function(err) {
          console.error(err);
        });

        return deferred.promise;
      }
  }]);
})();
