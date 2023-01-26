'use strict';

(function (angular) {
	angular.module('BingewaveAngularJs')
		.controller('HealthCtrl', ['$sce', '$scope', 'APIService', 'RequestService',
			'SocialDataStore', 'Modals', 'Buildfire', '$rootScope', 'Location', 'EVENTS',
			'GROUP_STATUS', 'MORE_MENU_POPUP', 'FILE_UPLOAD', '$modal', 'SocialItems', '$q',
			'$anchorScroll', '$location', '$timeout', 'Util', 'SubscribedUsersData', '$window',
			function ($sce, $scope, APIService, RequestService, SocialDataStore,
				Modals, Buildfire, $rootScope, Location, EVENTS, GROUP_STATUS,
				MORE_MENU_POPUP, FILE_UPLOAD, $modal, SocialItems, $q, $anchorScroll,
				$location, $timeout, util, SubscribedUsersData, $window) {
				var WidgetBingewave = this;
				WidgetBingewave.SocialItems = SocialItems.getInstance();
				WidgetBingewave.appTheme = null;
				WidgetBingewave.loadedPlugin = false;
				WidgetBingewave.util = util;

				
				$scope.openHealth = function(){
					const dataTypes = [
						'steps', 'distance',     // Read and write permissions
						{
							read: ['calories'],    // Read only permission
							write: ['temperature'] // Write only permission
						}
					];
					buildfire.services.health.requestAuthorization(dataTypes, err => {
						if (err) console.log(err);
						$scope.loadData();
					});
				}
				$scope.loadData = function(){
					const options = {
						dataType: "steps",
						limit: 1000,
						startDate: new Date(new Date().getTime() - (3 * 864e5)),
						endDate: new Date()
					};
					
					buildfire.services.health.query(options, (err, data) => {
						if (err) return console.error(err);
						// buildfire.dialog.alert({ data });
						console.log(data);
					});
			    }
				$scope.requestAuthHealth = function () {
					const dataTypes = [
						'steps', 'distance',     // Read and write permissions
						{
							read: ['calories'],    // Read only permission
							write: ['temperature'] // Write only permission
						}
					];
					buildfire.services.health.requestAuthorization(dataTypes, (err, result) => {
						if (err) {
							console.log(`requestAuthorization error: ${err}`);
							buildfire.dialog.alert({ message: "requestAuthorization error " + JSON.stringify(err) });
						} else {
							buildfire.dialog.alert({ message: result });
						}
					});
				}
				
				$scope.requestAuthCamera = function () {
					buildfire.services.camera.requestAuthorization(null, (err, result) => {
						if (err) {
							console.log(`requestAuthorization error: ${err}`);
							buildfire.dialog.alert({ message: "requestAuthorization error " + JSON.stringify(err) });
						} else {
							buildfire.dialog.alert({ message: result });
						}
					});
				}


				WidgetBingewave.setAppTheme = function () {
					buildfire.appearance.getAppTheme((err, obj) => {
						var elements = document.getElementsByTagName('svg');
						for (var i = 0; i < elements.length; i++) {
							elements[i].style.setProperty("fill", obj.colors
								.icons, "important");
						}
						WidgetBingewave.appTheme = obj.colors;
						WidgetBingewave.loadedPlugin = true;
					});
				}

				Buildfire.datastore.onUpdate(function (response) {
					if (response.tag === "Social") {
						WidgetBingewave.setSettings(response);
						setTimeout(function () {
							if (!response.data.appSettings.disableHomeText) {
								// var wallSVG = document.getElementById("WidgetBingewaveSvg")
								// if (wallSVG) {
								// 	wallSVG.style.setProperty("fill", WidgetBingewave.appTheme.icons, "important");
								// }
							}
						}, 100);
					}
					else if (response.tag === "languages")
						WidgetBingewave.SocialItems.formatLanguages(response);
						$scope.languages = WidgetBingewave.SocialItems.languages;
						console.log($scope.languages, WidgetBingewave.SocialItems.languages)

					   $scope.$digest();
				});

				WidgetBingewave.setSettings = function (settings) {
					// console.log("Set setting")
					WidgetBingewave.SocialItems.appSettings = settings.data && settings.data.appSettings ? settings.data.appSettings : {};
					WidgetBingewave.homeTextPermission();
					if (WidgetBingewave.SocialItems.appSettings && typeof WidgetBingewave.SocialItems.appSettings.pinnedPost !== 'undefined') {
						WidgetBingewave.pinnedPost = WidgetBingewave.SocialItems.appSettings.pinnedPost;
						pinnedPost.innerHTML = WidgetBingewave.pinnedPost;
						$scope.pinnedPost = pinnedPost.innerHTML;
					}
				}

				WidgetBingewave.homeTextPermission = function () {
					buildfire.datastore.get('Social', function (err, result) {
						if (err) {
							console.error('App settings -- ', err);
						} else {
							if (result && result.data) {
								WidgetBingewave.SocialItems.appSettings = result.data.appSettings;
								// console.log(WidgetBingewave.SocialItems);
								if (WidgetBingewave.SocialItems && WidgetBingewave.SocialItems.appSettings && WidgetBingewave.SocialItems.appSettings.disableHomeText) {
									$scope.showHomeText = false;
								} else {
									$scope.showHomeText = true;
								}
							}	
						}
						$scope.loaded = true;
                        $scope.$digest();

					});
					
				}

				WidgetBingewave.init = function () {
					WidgetBingewave.SocialItems.getSettings((err, result) => {
						if (err) return console.error(
							"Fetching settings failed.", err);
						if (result) {
							WidgetBingewave.SocialItems.items = [];
							WidgetBingewave.setSettings(result);
							WidgetBingewave.setAppTheme();
					        WidgetBingewave.homeTextPermission();
							$scope.languages = WidgetBingewave.SocialItems.languages;
							WidgetBingewave.SocialItems.authenticateUser(null, (
								err, user) => {
								if (err) return console.error(
									"Getting user failed.", err);
								if (user) {} else {
									WidgetBingewave
										.groupFollowingStatus = false;
								}
							});
						}
					});
				};

				WidgetBingewave.init();
				WidgetBingewave.formatLanguages = function (strings) {
					Object.keys(strings).forEach(e => {
						strings[e].value ? WidgetBingewave.SocialItems.languages[e] =
							strings[e].value : WidgetBingewave.SocialItems.languages[
								e] = strings[e].defaultValue;
					});
				}



				$rootScope.$on('navigatedBack', function (event, error) {
					WidgetBingewave.SocialItems.items = [];
					WidgetBingewave.SocialItems.isPrivateChat = false;
					WidgetBingewave.SocialItems.pageSize = 5;
					WidgetBingewave.SocialItems.page = 0;
					WidgetBingewave.SocialItems.wid = WidgetBingewave.SocialItems
						.mainWallID;
					WidgetBingewave.SocialItems.pluginTitle = '';
					WidgetBingewave.init();
				});

				// On Login
				Buildfire.auth.onLogin(function (user) {
					console.log("NEW USER LOGGED IN", WidgetBingewave.SocialItems
						.forcedToLogin)
					if (!WidgetBingewave.SocialItems.forcedToLogin) {
						WidgetBingewave.SocialItems.authenticateUser(user, (err,
							userData) => {
							if (err) return console.error(
								"Getting user failed.", err);
							if (userData) {
								WidgetBingewave.checkFollowingStatus();
							}
						});
					} else WidgetBingewave.SocialItems.forcedToLogin = false;
					WidgetBingewave.showUserLikes();
					if ($scope.$$phase) $scope.$digest();
				});

				// On Logout
				Buildfire.auth.onLogout(function () {
					console.log('User loggedOut from Widget Wall Page');
					buildfire.appearance.titlebar.show();
					WidgetBingewave.SocialItems.userDetails = {};
					WidgetBingewave.groupFollowingStatus = false;
					buildfire.notifications.pushNotification.unsubscribe({
						groupName: WidgetBingewave.SocialItems.wid === '' ?
							WidgetBingewave.SocialItems.context.instanceId :
							WidgetBingewave.SocialItems.wid
					}, () => {});
					WidgetBingewave.privateChatSecurity();
					$scope.$digest();
				});

			}
		])
})(window.angular);
