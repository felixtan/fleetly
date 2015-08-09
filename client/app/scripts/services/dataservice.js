'use strict';

/**
 * @ngdoc service
 * @name clientApp.carService
 * @description
 * # carService
 * Factory in the clientApp.
 */
angular.module('clientApp')
  .factory('dataService', function ($http) {

    // Public API here
    return {
      getAss: function () {
        return $http.get('/api/assignments')
                  .success(function(data) {
                    return data;
                  })
                  .error(function(err) {    // Need to handle error better
                    console.error(err);
                  });
      },

      getDrivers: function () {
       return $http.get('/api/assignments/drivers')
                  .success(function(data) {
                    return data;
                  })
                  .error(function(err) {
                    console.error(err);
                  });
      },

      getCars: function () {
        return $http.get('/api/assignments/cars')
                  .success(function(data) {
                    return data;
                  })
                  .error(function(err) {
                    console.error(err);
                  });
      },

      getPtgLogs: function () {
        return $http.get('/api/logs/ptg')
                  .success(function(data) {
                    return data;
                  })
                  .error(function(err) {
                    console.error(err);
                  });
      },

      getGasCards: function() {
        return $http.get('/api/assets/gas-cards')
                  .success(function(data) {
                    return data;
                  })
                  .error(function(err) {
                    console.error(err);
                  });
      },

      getProspects: function() {
        return $http.get('/api/prospects')
                  .success(function(data) {
                    return data;
                  })
                  .error(function(err) {
                    console.error(err);
                  });
      }
    };
  });
