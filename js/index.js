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
		$scope.contact = {
			starred: false,
			firstName: "",
			lastName: "",
			birthday: "",
			picture: "",
			phones: [],
			emails: [],
			addresses: [],
			websites: [],
			notes: ""
		};

		$scope._showImage = function() {
			$scope.selected = !$scope.selected;
		}

		$scope._submenu = function() {
			$scope.submenu = !$scope.submenu;
		}

		$scope.Back = function() {
			$location.path(current_route);
		}

		$scope.ProfileImage = function(dim) {
			return ($scope.contact && $scope.contact.picture) || "https://raw.github.com/danielemoraschi/android-addressbook/master/imgs/ic_contact_picture_"+dim+".png";
		}

		$scope.FullName = function(dim) {
			return ($scope.contact.firstName && $scope.contact.firstName.trim())
				? $scope.contact.firstName + ' ' + $scope.contact.lastName
				: ($scope.contact._id ? 'No name' : 'New contact');
		}

		if($routeParams.id) {
			Contacts.get({id: $routeParams.id}, function(contact) {
				self.original = contact;
				if(!self.original.views) {
					self.original.views = 0;
				}
				self.original.views++;
				$scope.contact = new Contacts(self.original);
				$scope.contact.update();
				_iScroll();
			});
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

		$scope.ProfileImage = function(dim, contact) {
			return contact.picture ? contact.picture.replace("480x480", dim) : "https://raw.github.com/danielemoraschi/android-addressbook/master/imgs/ic_contact_picture_"+dim+".png";
		}

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
	return $resource('clipped.json');
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
        into[ch].contacts.push(source[i]);
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
