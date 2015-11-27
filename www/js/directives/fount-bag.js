'use strict';

angular.module('sywStyleXApp')
.directive('fountBag', ['$state', function($state) {
  return {
    restrict: 'A',
    replace: true,
    templateUrl: 'views/templates/fount-bag.html',
    scope: {},
    link: function(scope, element, attrs) {
      scope.goToCart = function() {
        $state.go('cart');
      };

      scope.toggleSearchBar = function() {
        if (scope.searchObj.showSearchBar == false) {
          scope.searchObj.showSearchBar = true;
          // element.find('ul.sub-menu').css('opacity', 1);
        } else {
          scope.searchObj.showSearchBar = false;
          // element.find('ul.sub-menu').css('opacity', 0);
        }
      };
    }
  };
}]);