'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:AssetProfileCtrl
 * @description
 * # AssetProfileCtrl
 * Controller of the clientApp
 */
angular.module('clientApp')
  .controller('AssetProfileCtrl', function (assetHelpers, $scope, getAsset, getAssets) {
    // $scope.assets = assetHelpers.mapObject(getAssets.data);
    $scope.asset = getAsset.data;
    $scope.identifier = $scope.asset.identifier;
  });