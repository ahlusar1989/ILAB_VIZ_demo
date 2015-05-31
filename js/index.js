'use strict';

/*
Android Address Book replica with AngularJs
===========================================

GitHub project: https://github.com/danielemoraschi/android-addressbook

Touch scrolling by iScroll: http://cubiq.org/iscroll-4
Fake contacts list by: http://www.generatedata.com/

DB reset every 2h

Best in Mobile / Chrome / Safari

Released under the MIT License:
http://www.opensource.org/licenses/mit-license.php
*/

var app = angular.module('myapp', ['ngRoute', 'jsonService']);
var AddressBook = (function() {

	var iscroll, current_route,

	_init = function($scope) {
		iscroll = null;
		current_route = '/contacts';
	},

	_iScroll = function() {
		iscroll && iscroll.destroy();
		iscroll = new iScroll('wrapper', { hScroll: false });
		setTimeout(function() {
			iscroll.refresh();
		}, 0);
	},

	_detail_ctrl = function($scope, $location, $routeParams, Utils, Contacts) {
		var self = this;
		$scope.selected = false;
		$scope.submenu = false;

		// $scope.isGroupShown = function(group) {
		// 	console.log(group)
		// 	$scope.contact = Contacts.get({"_id": $routeParams.id});
		// 	return $scope.contact;
		// };


		$scope._showImage = function() {
			$scope.selected = !$scope.selected;
		}

		$scope._submenu = function() {
			$scope.submenu = !$scope.submenu;
		}

		$scope.Back = function() {
			$location.path(current_route);
		}

		if($routeParams.id) {
			Contacts.query(function(contacts) {

				$scope.contact = contacts[$routeParams.id];
				$scope.slug = $scope.contact.Advancement_Level.split(' ').join('-');

				for(var t in $scope.contact.Tables){
					if($scope.contact.Tables[t]['title'] === "Laws and Regulations Related to Child Labor"){
						$scope.contact.t2 = $scope.contact.Tables[t];
					} else if ($scope.contact.Tables[t]['title'] === "Suggested Government Actions to Eliminate Child Labor, Including its Worst Forms"){
						$scope.contact.t7 = $scope.contact.Tables[t];
					}
					_iScroll();
				}
				console.log($scope.contact)

			})
		} else {
			_iScroll();
		}
	},

	_list_ctrl = function($scope, $location, $routeParams, Utils, Contacts) {
		var i, ch, self = this;
		$scope.orderProp = 'Country';
		$scope.groups = {};
		$scope.contacts = {};
		$scope.starred = {};
		$scope.searchterm = '';

		//we could put stats in this section since it's already right aligned.
		// $scope.ProfileImage = function(dim, contact) {
		// 	return contact.picture ? contact.picture.replace("480x480", dim) : "https://raw.github.com/danielemoraschi/android-addressbook/master/imgs/ic_contact_picture_"+dim+".png";
		// }

		$scope.Back = function() {
			$location.path(current_route);
		}

		switch($location.$$url) {

			case "/contacts/search":
				$scope.contacts = Contacts.query(function() {
					$scope.groups = [{
						label: 'All contacts',
						contacts: $scope.contacts
					}];
					_iScroll();
				});
				break;

			default:
				current_route = $location.$$url;
				$scope.contacts = Contacts.query(function() {
					Utils.groupify($scope.contacts, $scope.groups);
					_iScroll();
				});
				break;
		}
	};

	return {
		Init: _init,
		DetailCtrl: _detail_ctrl,
		ListCtrl: _list_ctrl
	}

})();

angular.module('jsonService', ['ngResource'])
.factory('Contacts', function($resource) {
	return $resource('data/countries2013.json');
});

angular.module('helpers', []).
factory('Utils', function() {
  return {
    groupify : function(source, into) {
      var i, ch;
      for (i = source.length - 1; i >= 0; i--) {
        ch = source[i].Country.charAt(0);
        into[ch] || (into[ch] = {
          label: ch,
          contacts: []
        });
        into[ch].contacts.unshift(source[i]);
      };
    }
  }
});


angular.module('android-addressbook', ['jsonService', 'helpers']).
config(['$routeProvider', function($routeProvider, $locationProvider) {
  $routeProvider.
  when('/contacts', {templateUrl: 'list.html', controller: AddressBook.ListCtrl}).
  when('/contacts/starred', {templateUrl: 'starred.html', controller: AddressBook.ListCtrl}).
  when('/contacts/search', {templateUrl: 'search.html', controller: AddressBook.ListCtrl}).
  when('/contact/view/:id', {templateUrl: 'view.html', controller: AddressBook.DetailCtrl}).
  otherwise({redirectTo: '/contacts'});
}]);
