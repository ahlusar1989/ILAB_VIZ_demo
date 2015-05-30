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

		$scope.StarUnStar = function () {
			$scope.contact.starred = !$scope.contact.starred;
			$scope.contact.update();
		}

		$scope.AddField = function(type) {
			$scope.contact[type] || ($scope.contact[type] = []);
			$scope.contact[type].push({
				type: '',
				value: ''
			});
		}

		$scope.DiscardField = function(type, index) {
			if($scope.contact[type] && $scope.contact[type][index]) {
				$scope.contact[type].splice(index,1);
			}
		}

		$scope.SaveContact = function () {
	   if($scope.contact.firstName && $scope.contact.firstName.trim()) {
		  var arrays = {'phones': [], 'emails': [], 'addresses': []};
		  angular.forEach(arrays, function(v, k) {
						angular.forEach($scope.contact[k], function(val, key) {
						  if(val.value.trim()) {
								arrays[k].push(val);
						   }
					  });
					$scope.contact[k] = arrays[k];
				});

		if($scope.contact._id) {
			$scope.contact.update(function() {
						$location.path('/contact/view/' + $scope.contact._id.$oid);
					});
				}
				else {
					Contacts.save($scope.contact, function(contact) {
						$location.path('/contact/edit/' + contact._id.$oid);
					});
				}
			}
		}

		$scope.DeleteContact = function () {
			if($scope.contact._id.$oid) {
				var c = confirm("Delete this contact?")
				if (c==true) {
					self.original.delete(function() {
						$location.path('/contacts');
					});
				}
			}
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

		$scope.orderProp = 'firstName';
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
      
			case "/contacts/starred": 
				current_route = $location.$$url;
				$scope.starred = Contacts.query({q: '{"starred":true}'}, function() {
					$scope.contacts = Contacts.query({q: '{"views":{"$gt":0}}', l: 10}, function() {
						_iScroll();
					});
				});
				break;

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



    
// angular.module('mongolab', ['ngResource']).
// factory('Contacts', function($resource) {
//   var Contacts = $resource(
//     'https://api.mongolab.com/api/1/databases/addressbook/collections/contacts/:id',
//     { apiKey: 'RO27EEbdFsJfycTn_JUiAnr3qIcsgyxS' },
//     { update: { method: 'PUT' } }
//   );
  
//   Contacts.prototype.update = function(cb) {
//     return Contacts.update({id: this._id.$oid},
//                            angular.extend({}, this, {_id:undefined}), cb);
//   };
  
//   Contacts.prototype.delete = function(cb) {
//     return Contacts.remove({id: this._id.$oid}, cb);
//   };
  
//   return Contacts;
});

angular.module('helpers', []).
factory('Utils', function() {
  return {
    groupify : function(source, into) {
      var i, ch;
      for (i = source.length - 1; i >= 0; i--) {
        ch = source[i].firstName.charAt(0);
        into[ch] || (into[ch] = {
          label: ch,
          contacts: []
        });
        into[ch].contacts.push(source[i]);
      };
    }
  }
});


angular.module('android-addressbook', ['mongolab', 'helpers']).
config(['$routeProvider', function($routeProvider, $locationProvider) {
  $routeProvider.
  when('/contacts', {templateUrl: 'list.html', controller: AddressBook.ListCtrl}).
  when('/contacts/starred', {templateUrl: 'starred.html', controller: AddressBook.ListCtrl}).
  when('/contacts/search', {templateUrl: 'search.html', controller: AddressBook.ListCtrl}).
  when('/contact/add', {templateUrl: 'edit.html', controller: AddressBook.DetailCtrl}).
  when('/contact/view/:id', {templateUrl: 'view.html', controller: AddressBook.DetailCtrl}).
  when('/contact/edit/:id', {templateUrl: 'edit.html', controller: AddressBook.DetailCtrl}).
  otherwise({redirectTo: '/contacts'});
}]);