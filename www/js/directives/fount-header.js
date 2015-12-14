'use strict';

angular.module('sywStyleXApp')
.directive('fountHeader', ['$rootScope', '$state', 'localStorageService', 'CartService', 'ProductSearchService', 'UtilityService', function($rootScope, $state, localStorageService, CartService, ProductSearchService, UtilityService) {
  return {
    restrict: 'A',
    replace: true,
    templateUrl: 'views/templates/fount-header.html',
    scope: {},
    link: function(scope, element, attrs) {
      var shoppingCartDict = {};
      scope.isLoggedIn = false;

      var filterParams = {
        sellerIds: [],
        brandIds: [],
        categoryIds: [],
        minPrice: '',
        maxPrice: '',
        sale: '',
        selectedSortby: 'relevancy'
      };

      var searchTimer = false;
      var goToSearchResults = function(){
        $state.go('search', {keyword: scope.searchObj.keyword});

        scope.searchObj = {
          keyword: '',
          showSearchBar: false,
          results: {}
        };
      };

      scope.searchObj = {
        keyword: '',
        showSearchBar: false
      };

      scope.searchProducts = function() {
        clearTimeout(searchTimer);
        if (scope.searchObj.keyword.trim().length >= 3) {
          searchTimer = setTimeout(function() {
            ProductSearchService.searchProducts(1, scope.searchObj.keyword, filterParams).then(function(result) {
              if (UtilityService.validateResult(result)) {
                scope.searchObj.results = result.data.payload;
                goToSearchResults();
              }
            });
          }, 400);
        }
      };

      scope.goToShop = function() {
        $state.go('shop');
      };

      if (!!localStorageService.get('shoppingCartInfo')) {
        scope.shoppingCartInfo = localStorageService.get('shoppingCartInfo');
      } else {
        scope.shoppingCartInfo = {
          count: 0,
          subtotal: 0
        };
      }

      var getProductsFromCart = function() {
        CartService.getProductsFromCart(localStorageService.get('userId'), false).success(function(response) {
          scope.username = response.payload.SHOPPING_CART.user.displayName;
          scope.shoppingCartInfo.count = response.payload.SHOPPING_CART.cartProducts.length;
          scope.shoppingCartInfo.subtotal = 0;
          for (var i=0,j=scope.shoppingCartInfo.count; i<j; i++) {
            scope.shoppingCartInfo.subtotal += response.payload.SHOPPING_CART.cartProducts[i].product.finalPrice;
          }
          localStorageService.set('shoppingCartInfo', scope.shoppingCartInfo);
          localStorageService.set('isInstagramLinked', response.payload.SHOPPING_CART.user.isInstagramLinked);
          localStorageService.set('isFacebookLinked', response.payload.SHOPPING_CART.user.isFacebookLinked);
        });
      };

      var collateShoppingCartItems = function(cartProducts) {
        var shoppingBagObj = {
          id:cartProducts.id,
          availability: (cartProducts.productMetadata.availability == 'AVAILABLE') ? true : false,
          productId: cartProducts.product.id ,
          sellerName: cartProducts.product.seller.name,
          name: cartProducts.product.name,
          imageURL: cartProducts.product.imageURL,
          price: cartProducts.productMetadata.price,
          fit: (cartProducts.productMetadata.fit !== 'NA')? cartProducts.productMetadata.fit : null,
          color: (cartProducts.productMetadata.color !== 'NA')? cartProducts.productMetadata.color : null,
          size: (cartProducts.productMetadata.size !== 'NA')? cartProducts.productMetadata.size : null,
          option: (cartProducts.productMetadata.option !== 'NA')? cartProducts.productMetadata.option : null,
          shippingOptions: cartProducts.shippingMethod,
          buyURL: cartProducts.product.buyURL,
          originalUrl: cartProducts.originalUrl,
          mediaId: !!cartProducts.media ? cartProducts.media.id : null,
          visualTagId: !!cartProducts.visualTag ? cartProducts.visualTag.id : null,
          qty: cartProducts.quantity,
          prices: {subtotal: "$0.00"},
          itemSelected: false
        };

        if (shoppingBagObj.sellerName in shoppingCartDict) {
          shoppingCartDict[shoppingBagObj.sellerName].push(shoppingBagObj);
        } else {
          shoppingCartDict[shoppingBagObj.sellerName] = [];
          shoppingCartDict[shoppingBagObj.sellerName].push(shoppingBagObj);
        }

      };

      var updateProductsFromCart = function() {
        shoppingCartDict = {};
        var userId = localStorageService.get('userId');
        CartService.getProductsFromCart(userId, true).success(function(response) {
          var userCartProducts = response.payload.SHOPPING_CART.cartProducts;
          var userCartLength = userCartProducts.length;
          if (userCartLength > 0) {
            var shoppingCartId = response.payload.SHOPPING_CART.id;
            for (var i=0; i< userCartLength; i++) {
              collateShoppingCartItems(userCartProducts[i]);
            };
            console.log(shoppingCartDict);
            localStorageService.set('shoppingCart', shoppingCartDict);
            localStorageService.set('shoppingCartId', shoppingCartId);

            var shoppingBagDetail = {
              twotap: response,
              source: 'shoppingBagDetail'
            };
            localStorageService.set('shoppingBagDetail', shoppingBagDetail);
            $state.go('cart');
          } else {
            $state.go('cart');
          }
        });
      };

      scope.goToCart = function() {
        // $state.go('cart');
        updateProductsFromCart();
      };

      scope.searchObj = {
        keyword: '',
        showSearchBar: false
      };

      if (!localStorageService.get('userId')) {
        scope.isLoggedIn = false;
        $state.go('login');
      } else {
        scope.isLoggedIn = true;
        getProductsFromCart();
      }

      $rootScope.$on('event.updateShoppingCart', function(event, data) {
        scope.shoppingCartInfo = {
          count: data.shoppingCartInfo.count,
          subtotal: data.shoppingCartInfo.subtotal
        };
      });

      $rootScope.$on('event.updateFountLogin', function(event, data) {
        scope.isLoggedIn = data.isLoggedIn;
        getProductsFromCart();
      });

      $rootScope.$on('event.updateFountLogout', function(event, data) {
        scope.isLoggedIn = data.isLoggedIn;
        scope.shoppingCartInfo.subtotal = 0;
        // getProductsFromCart();
      });
    }
  };
}]);
