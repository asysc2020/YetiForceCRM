/*+***********************************************************************************
 * The contents of this file are subject to the vtiger CRM Public License Version 1.0
 * ("License"); You may not use this file except in compliance with the License
 * The Original Code is:  vtiger CRM Open Source
 * The Initial Developer of the Original Code is vtiger.
 * Portions created by vtiger are Copyright (C) vtiger.
 * All Rights Reserved.
 *************************************************************************************/
jQuery.Class("Calendar_CalendarView_Js", {
	currentInstance: false,
	getInstanceByView: function () {
		var view = jQuery('#currentView').val();
		var jsFileName = view + 'View';
		var moduleClassName = view + "_" + jsFileName + "_Js";
		if (typeof window[moduleClassName] != 'undefined') {
			var instance = new window[moduleClassName]();
		} else {
			instance = new Calendar_CalendarView_Js();
		}
		return instance;
	},
	registerSwitches: function () {
		var widgetContainer = jQuery('#rightPanel .quickWidget');
		var switchesContainer = widgetContainer.find('.widgetContainer input.switchBtn');
		app.showBtnSwitch(switchesContainer);
		widgetContainer.find('.widgetContainer').each(function () {
			h = jQuery(this).height();
			if (h > 250) {
				jQuery(this).find('div:first').slimScroll({
					height: '250px'
				});
			}
			;
		});
	},
	registerWidget: function () {
		var thisInstance = this.getInstanceByView();
		var widgetContainer = jQuery('#rightPanel .quickWidget');
		widgetContainer.find('.switchsParent').on('switchChange.bootstrapSwitch', function (event, state) {
			element = jQuery(this).closest('.quickWidget');
			if (state) {
				element.find('.widgetContainer input.switchBtn').bootstrapSwitch('state', true);
			} else {
				element.find('.widgetContainer input.switchBtn').bootstrapSwitch('state', false);
			}
		});
		jQuery('#rightPanel .refreshCalendar').on('click', function () {
			$(this).closest('.refreshHeader').addClass('hide');
			thisInstance.loadCalendarData();
			return false;
		});
	},
	registerColorField: function (field, fieldClass) {
		var params = {};
		params.dropdownCss = {'z-index': 0};
		params.formatSelection = function (object, container) {
			var selectedId = object.id;
			var selectedOptionTag = field.find('option[value="' + selectedId + '"]');
			container.addClass(fieldClass + '_' + selectedId);
			var element = '<div>' + selectedOptionTag.text() + '</div>';
			return element;
		}
		app.changeSelectElementView(field, 'select2', params);
	},
}, {
	calendarView: false,
	calendarCreateView: false,
	weekDaysArray: {Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6},
	renderCalendar: function () {
		var thisInstance = this;

		var eventLimit = app.getMainParams('eventLimit');
		if (eventLimit == 'true') {
			eventLimit = true;
		} else if (eventLimit == 'false') {
			eventLimit = false;
		} else {
			eventLimit = parseInt(eventLimit) + 1;
		}
		var weekView = app.getMainParams('weekView');
		var dayView = app.getMainParams('dayView');

		//User preferred default view
		var userDefaultActivityView = app.getMainParams('activity_view');
		if (userDefaultActivityView == 'Today') {
			userDefaultActivityView = dayView;
		} else if (userDefaultActivityView == 'This Week') {
			userDefaultActivityView = weekView;
		} else {
			userDefaultActivityView = 'month';
		}

		//Default time format
		var userDefaultTimeFormat = app.getMainParams('time_format');
		var popoverTimeFormat;
		if (userDefaultTimeFormat == 24) {
			userDefaultTimeFormat = 'H:mm';
			popoverTimeFormat = 'HH:mm';
		} else {
			userDefaultTimeFormat = 'h:mmt';
			popoverTimeFormat = 'hh:mm A';
		}

		//Default first day of the week
		var defaultFirstDay = app.getMainParams('start_day');
		var convertedFirstDay = thisInstance.weekDaysArray[defaultFirstDay];

		//Default first hour of the day
		var defaultFirstHour = app.getMainParams('start_hour') + ':00';
		if (app.getMainParams('switchingDays') == 'workDays') {
			var hiddenDays = app.getMainParams('hiddenDays', true);
		} else {
			var hiddenDays = [];
		}
		thisInstance.getCalendarView().fullCalendar('destroy');
		thisInstance.getCalendarView().fullCalendar({
			header: {
				left: 'month,' + weekView + ',' + dayView,
				center: 'title today',
				right: 'prev,next'
			},
			timeFormat: userDefaultTimeFormat,
			axisFormat: userDefaultTimeFormat,
			scrollTime: defaultFirstHour,
			firstDay: convertedFirstDay,
			defaultView: userDefaultActivityView,
			editable: true,
			slotMinutes: 15,
			defaultEventMinutes: 0,
			forceEventDuration: true,
			defaultTimedEventDuration: '01:00:00',
			eventLimit: eventLimit,
			selectable: true,
			selectHelper: true,
			hiddenDays: hiddenDays,
			views: {
				basic: {
					eventLimit: false,
				}
			},
			select: function (start, end) {
				thisInstance.selectDays(start, end);
				thisInstance.getCalendarView().fullCalendar('unselect');
			},
			eventDrop: function (event, delta, revertFunc) {
				thisInstance.updateEvent(event, delta, revertFunc);
			},
			eventResize: function (event, delta, revertFunc) {
				thisInstance.updateEvent(event, delta, revertFunc);
			},
			eventRender: function (event, element) {
				element.find('.fc-content').popover({
					trigger: 'hover',
					delay: 500,
					title: event.title,
					container: 'body',
					html: true,
					template: '<div class="popover calendarPopover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>',
					content: '<div><span class="glyphicon glyphicon-time" aria-hidden="true"></span> <label>' + app.vtranslate('JS_START_DATE') + '</label>: ' + event.start.format('YYYY-MM-DD ' + popoverTimeFormat) + '</div>' +
							'<div><span class="glyphicon glyphicon-time" aria-hidden="true"></span> <label>' + app.vtranslate('JS_END_DATE') + '</label>: ' + event.end.format('YYYY-MM-DD ' + popoverTimeFormat) + '</div>' +
							(event.lok ? '<div><span class="glyphicon glyphicon-globe" aria-hidden="true"></span> <label>' + app.vtranslate('JS_LOCATION') + '</label>: ' + event.lok + '</div>' : '') +
							(event.pri ? '<div><span class="glyphicon glyphicon-warning-sign" aria-hidden="true"></span> <label>' + app.vtranslate('JS_PRIORITY') + '</label>: ' + app.vtranslate('JS_' + event.pri) + '</div>' : '') +
							'<div><span class="glyphicon glyphicon-question-sign" aria-hidden="true"></span> <label>' + app.vtranslate('JS_STATUS') + '</label>: ' + app.vtranslate('JS_' + event.sta) + '</div>' +
							(event.accname ? '<div><span class="calIcon modIcon_Accounts" aria-hidden="true"></span> <label>' + app.vtranslate('JS_ACCOUNTS') + '</label>: ' + event.accname + '</div>' : '') +
							(event.linkl ? '<div><span class="userIcon-' + event.linkm + '" aria-hidden="true"></span> <label>' + app.vtranslate('JS_RELATION') + '</label>: ' + event.linkl + '</div>' : '') +
							(event.procl ? '<div><span class="userIcon-' + event.procm + '" aria-hidden="true"></span> <label>' + app.vtranslate('JS_PROCESS') + '</label>: ' + event.procl + '</div>' : '') +
							(event.subprocl ? '<div><span class="userIcon-' + event.subprocm + '" aria-hidden="true"></span> <label>' + app.vtranslate('JS_SUB_PROCESS') + '</label>: ' + event.subprocl + '</div>' : '') +
							(event.state ? '<div><span class="glyphicon glyphicon-star-empty" aria-hidden="true"></span> <label>' + app.vtranslate('JS_STATE') + '</label>: ' + app.vtranslate(event.state) + '</div>' : '') +
							'<div><span class="glyphicon glyphicon-eye-open" aria-hidden="true"></span> <label>' + app.vtranslate('JS_VISIBILITY') + '</label>: ' + app.vtranslate('JS_' + event.vis) + '</div>' +
							(event.smownerid ? '<div><span class="glyphicon glyphicon-user" aria-hidden="true"></span> <label>' + app.vtranslate('JS_ASSIGNED_TO') + '</label>: ' + event.smownerid + '</div>' : '')
				});
				element.find('.fc-content, .fc-info').click(function () {
					var progressIndicatorElement = jQuery.progressIndicator({
						position: 'html',
						blockInfo: {
							'enabled': true
						}
					});
					var event = $(this).closest('.fc-event');
					var url = 'index.php?module=Calendar&view=ActivityStateModal&record=' + event.data('id');
					var callbackFunction = function (data) {
						progressIndicatorElement.progressIndicator({
							'mode': 'hide'
						})
					}
					var modalWindowParams = {
						url: url,
						cb: callbackFunction,
					}
					app.showModalWindow(modalWindowParams);
				});
			},
			monthNames: [app.vtranslate('JS_JANUARY'), app.vtranslate('JS_FEBRUARY'), app.vtranslate('JS_MARCH'),
				app.vtranslate('JS_APRIL'), app.vtranslate('JS_MAY'), app.vtranslate('JS_JUNE'), app.vtranslate('JS_JULY'),
				app.vtranslate('JS_AUGUST'), app.vtranslate('JS_SEPTEMBER'), app.vtranslate('JS_OCTOBER'),
				app.vtranslate('JS_NOVEMBER'), app.vtranslate('JS_DECEMBER')],
			monthNamesShort: [app.vtranslate('JS_JAN'), app.vtranslate('JS_FEB'), app.vtranslate('JS_MAR'),
				app.vtranslate('JS_APR'), app.vtranslate('JS_MAY'), app.vtranslate('JS_JUN'), app.vtranslate('JS_JUL'),
				app.vtranslate('JS_AUG'), app.vtranslate('JS_SEP'), app.vtranslate('JS_OCT'), app.vtranslate('JS_NOV'),
				app.vtranslate('JS_DEC')],
			dayNames: [app.vtranslate('JS_SUNDAY'), app.vtranslate('JS_MONDAY'), app.vtranslate('JS_TUESDAY'),
				app.vtranslate('JS_WEDNESDAY'), app.vtranslate('JS_THURSDAY'), app.vtranslate('JS_FRIDAY'),
				app.vtranslate('JS_SATURDAY')],
			dayNamesShort: [app.vtranslate('JS_SUN'), app.vtranslate('JS_MON'), app.vtranslate('JS_TUE'),
				app.vtranslate('JS_WED'), app.vtranslate('JS_THU'), app.vtranslate('JS_FRI'),
				app.vtranslate('JS_SAT')],
			buttonText: {
				today: app.vtranslate('JS_TODAY'),
				month: app.vtranslate('JS_MONTH'),
				week: app.vtranslate('JS_WEEK'),
				day: app.vtranslate('JS_DAY')
			},
			allDayText: app.vtranslate('JS_ALL_DAY'),
			eventLimitText: app.vtranslate('JS_MORE')
		});
		thisInstance.createAddSwitch();
		thisInstance.registerListViewButton();
	},
	getValuesFromSelect2: function (element, data, text) {
		if (element.hasClass('select2-hidden-accessible')) {
			var types = (element.select2('data'));
			for (var i = 0; i < types.length; i++) {
				if (text) {
					data.push(types[i].text);
				} else {
					data.push(types[i].id);
				}
			}
		}
		return data;
	},
	registerButtonSelectAll: function () {
		var selectBtn = $('.selectAllBtn');

		selectBtn.click(function (e) {
			var selectAllLabel = $(this).find('.selectAll');
			var deselectAllLabel = $(this).find('.deselectAll');

			if (selectAllLabel.hasClass('hide')) {
				selectAllLabel.removeClass('hide');
				deselectAllLabel.addClass('hide');
				$(this).closest('.quickWidget').find('select option').prop("selected", false);
			} else {
				$(this).closest('.quickWidget').find('select option').prop("selected", true);
				deselectAllLabel.removeClass('hide');
				selectAllLabel.addClass('hide');
			}
			$(this).closest('.quickWidget').find('select').trigger("change");
		});
	},
	loadCalendarData: function (allEvents) {
		var progressInstance = jQuery.progressIndicator();
		var thisInstance = this;
		thisInstance.getCalendarView().fullCalendar('removeEvents');
		var view = thisInstance.getCalendarView().fullCalendar('getView');
		var start_date = view.start.format();
		var end_date = view.end.format();
		var types = [];
		types = thisInstance.getValuesFromSelect2($("#calendarActivityTypeList"), types);
		if (types.length == 0) {
			allEvents = true;
		}
		var user = [];
		user = thisInstance.getValuesFromSelect2($("#calendarUserList"), user);
		if (user.length == 0) {
			user = [app.getMainParams('current_user_id')];
		}
		user = thisInstance.getValuesFromSelect2($("#calendarGroupList"), user);
		var filters = [];
		$(".calendarFilters .filterField").each(function (index) {
			var element = $(this);
			if (element.attr('type') == 'checkbox') {
				var name = element.val();
				var value = element.prop('checked') ? 1 : 0;
			} else {
				var name = element.attr('name');
				var value = element.val();
			}
			filters.push({name: name, value: value});
		});
		if (allEvents == true || types.length > 0) {
			var params = {
				module: 'Calendar',
				action: 'Calendar',
				mode: 'getEvents',
				start: start_date,
				end: end_date,
				user: user,
				time: app.getMainParams('showType'),
				types: types,
				filters: filters
			}
			AppConnector.request(params).then(function (events) {
				thisInstance.getCalendarView().fullCalendar('addEventSource', events.result);
				progressInstance.hide();
			});
		} else {
			thisInstance.getCalendarView().fullCalendar('removeEvents');
			progressInstance.hide();
		}
	},
	updateEvent: function (event, delta, revertFunc) {
		var progressInstance = jQuery.progressIndicator();
		var start = event.start.format();
		var params = {
			module: 'Calendar',
			action: 'Calendar',
			mode: 'updateEvent',
			id: event.id,
			start: start,
			delta: delta._data,
			allDay: event.allDay
		}
		AppConnector.request(params).then(function (response) {
			progressInstance.hide();
			if (!response['result']) {
				Vtiger_Helper_Js.showPnotify(app.vtranslate('JS_NO_EDIT_PERMISSION'));
				revertFunc();
			}
		},
				function (error) {
					progressInstance.hide();
					Vtiger_Helper_Js.showPnotify(app.vtranslate('JS_NO_EDIT_PERMISSION'));
					revertFunc();
				});
	},
	selectDays: function (start, end) {
		var thisInstance = this;
		if (end.hasTime() == false) {
			end.add(-1, 'days');
		}
		start = start.format();
		end = end.format();
		var view = thisInstance.getCalendarView().fullCalendar('getView');
		if (view.name == "month") {
			var start_hour = $('#start_hour').val();
			var end_hour = $('#end_hour').val();

			if (start_hour == '') {
				start_hour = '00';
			}
			if (end_hour == '') {
				end_hour = '00';
			}

			start = start + 'T' + start_hour + ':00';
			end = end + 'T' + end_hour + ':00';
		}
		this.getCalendarCreateView().then(function (data) {
			if (data.length <= 0) {
				return;
			}

			var dateFormat = data.find('[name="date_start"]').data('dateFormat');
			var timeFormat = data.find('[name="time_start"]').data('format');
			if (timeFormat == 24) {
				var defaultTimeFormat = 'HH:mm';
			} else {
				defaultTimeFormat = 'hh:mm tt';
			}

			var startDateInstance = Date.parse(start);
			var startDateString = app.getDateInVtigerFormat(dateFormat, startDateInstance);
			var startTimeString = startDateInstance.toString(defaultTimeFormat);
			var endDateInstance = Date.parse(end);
			var endDateString = app.getDateInVtigerFormat(dateFormat, endDateInstance);
			var endTimeString = endDateInstance.toString(defaultTimeFormat);

			data.find('[name="date_start"]').val(startDateString);
			data.find('[name="due_date"]').val(endDateString);
			data.find('[name="time_start"]').val(startTimeString);
			data.find('[name="time_end"]').val(endTimeString);

			var headerInstance = new Vtiger_Header_Js();
			headerInstance.handleQuickCreateData(data, {callbackFunction: function (data) {
					thisInstance.addCalendarEvent(data.result);
				}});
			jQuery('.modal-body').css({'max-height': '500px', 'overflow-y': 'auto'});
		});
	},
	addCalendarEvent: function (calendarDetails) {
		var state = $('.fc-toolbar input.switchBtn').bootstrapSwitch('state');
		var eventObject = {};

		var taskstatus = $.inArray(calendarDetails.activitystatus.value, ['PLL_POSTPONED', 'PLL_CANCELLED', 'PLL_COMPLETED']);
		if (state == true && taskstatus >= 0 || state != true && taskstatus == -1) {
			return false;
		}
		eventObject.id = calendarDetails._recordId;
		eventObject.title = calendarDetails.subject.display_value;
		var startDate = Date.parse(calendarDetails.date_start.display_value + 'T' + calendarDetails.time_start.display_value);
		eventObject.start = startDate.toString();
		var endDate = Date.parse(calendarDetails.due_date.display_value + 'T' + calendarDetails.time_end.display_value);
		var assignedUserId = calendarDetails.assigned_user_id.value;
		eventObject.end = endDate.toString();
		eventObject.url = 'index.php?module=Calendar&view=Detail&record=' + calendarDetails._recordId;
		eventObject.activitytype = calendarDetails.activitytype.value;

		if ('on' == calendarDetails.allday.value)
			eventObject.allDay = true;
		else
			eventObject.allDay = false;
		eventObject.state = calendarDetails.state.value;
		eventObject.vis = calendarDetails.visibility.value;
		eventObject.sta = calendarDetails.activitystatus.value;
		eventObject.className = 'userCol_' + calendarDetails.assigned_user_id.value + ' calCol_' + calendarDetails.activitytype.value;
		this.getCalendarView().fullCalendar('renderEvent', eventObject);
	},
	getCalendarCreateView: function () {
		var thisInstance = this;
		var aDeferred = jQuery.Deferred();

		if (this.calendarCreateView !== false) {
			aDeferred.resolve(this.calendarCreateView.clone(true, true));
			return aDeferred.promise();
		}
		var progressInstance = jQuery.progressIndicator();
		this.loadCalendarCreateView().then(
				function (data) {
					progressInstance.hide();
					thisInstance.calendarCreateView = data;
					aDeferred.resolve(data.clone(true, true));
				},
				function () {
					progressInstance.hide();
				}
		);
		return aDeferred.promise();
	},
	loadCalendarCreateView: function () {
		var aDeferred = jQuery.Deferred();
		var moduleName = app.getModuleName();
		var url = 'index.php?module=' + moduleName + '&view=QuickCreateAjax';
		var headerInstance = Vtiger_Header_Js.getInstance();
		headerInstance.getQuickCreateForm(url, moduleName).then(
				function (data) {
					aDeferred.resolve(jQuery(data));
				},
				function () {
					aDeferred.reject();
				}
		);
		return aDeferred.promise();
	},
	getCalendarView: function () {
		if (this.calendarView == false) {
			this.calendarView = jQuery('#calendarview');
		}
		return this.calendarView;
	},
	registerChangeView: function () {
		var thisInstance = this;
		thisInstance.getCalendarView().find("button.fc-button:not(.listViewButton)").click(function () {
			thisInstance.loadCalendarData();
		});
	},
	getSearchParams: function () {
		var thisInstance = this;
		var types = thisInstance.getValuesFromSelect2($("#calendarActivityTypeList"), []);
		var user = thisInstance.getValuesFromSelect2($("#calendarUserList"), [], true);
		user = thisInstance.getValuesFromSelect2($("#calendarGroupList"), user, true);
		var searchParams = '';
		if (types.length) {
			searchParams += '["activitytype","e","' + types + '"]';
		}
		if (user.length) {
			searchParams += (searchParams != '' ? ',' : '') + '["assigned_user_id","c","' + user + '"]';
		}
		$(".calendarFilters .filterField").each(function () {
			var type = $(this).attr('type');
			if (type == 'checkbox' && $(this).prop('checked')) {
				searchParams += (searchParams != '' ? ',[' : '[') + $(this).data('search')+']';
			}
			
		});
		var url = 'index.php?module=Calendar&view=List&viewname=All&search_params=[[' + searchParams + ']]';
		return url;
	},
	registerAddButton: function () {
		var thisInstance = this;
		jQuery('.calendarViewContainer .widget_header .addButton').on('click', function (e) {
			thisInstance.getCalendarCreateView().then(function (data) {
				var headerInstance = new Vtiger_Header_Js();
				headerInstance.handleQuickCreateData(data, {callbackFunction: function (data) {
						thisInstance.addCalendarEvent(data.result);
					}});
			});
		})
	},
	registerListViewButton: function () {
		var thisInstance = this;
		if (app.getMainParams('showListButtonInCalendar')) {
			var calendarview = this.getCalendarView();
			jQuery('<button class="btn btn-default fc-button fc-state-default listViewButton" type="button"><span class="glyphicon glyphicon-list"></span></button>')
					.prependTo(calendarview.find('.fc-toolbar .fc-right')).on('click', function (e) {
				var url = thisInstance.getSearchParams();
				window.location.href = url;
			})
		}
	},
	createAddSwitch: function () {
		var thisInstance = this;
		var calendarview = this.getCalendarView();
		var switchBtn = jQuery('<span class=""><input class="switchBtn showType" type="checkbox" title="' + app.vtranslate('JS_CHANGE_ACTIVITY_TIME') + '" checked data-size="small" data-handle-width="90" data-label-width="5" data-on-text="' + app.vtranslate('JS_TO_REALIZE') + '" data-off-text="' + app.vtranslate('JS_HISTORY') + '"></span>')
				.prependTo(calendarview.find('.fc-toolbar .fc-right'))
				.on('switchChange.bootstrapSwitch', function (e, state) {
					if (state) {
						app.setMainParams('showType', 'current');
					} else {
						app.setMainParams('showType', 'history');
					}
					thisInstance.loadCalendarData();
				})
		app.showBtnSwitch(switchBtn.find('.switchBtn'));
		var checked = '';
		if (app.getMainParams('switchingDays') == 'workDays') {
			checked = ' checked ';
		}
		var switchBtn = jQuery('<span class=""><input class="switchBtn switchingDays" type="checkbox" title="' + app.vtranslate('JS_SWITCHING_DAYS') + '" ' + checked + ' data-size="small" data-handle-width="90" data-label-width="5" data-on-text="' + app.vtranslate('JS_WORK_DAYS') + '" data-off-text="' + app.vtranslate('JS_ALL') + '"></span>')
				.prependTo(calendarview.find('.fc-toolbar .fc-right'))
				.on('switchChange.bootstrapSwitch', function (e, state) {
					if (state) {
						app.setMainParams('switchingDays', 'workDays');
					} else {
						app.setMainParams('switchingDays', 'all');
					}
					thisInstance.renderCalendar();
					thisInstance.loadCalendarData();
				})
		app.showBtnSwitch(switchBtn.find('.switchBtn'));
	},
	registerSelect2Event: function () {
		app.showSelect2ElementView($('#calendarUserList'));
		app.showSelect2ElementView($('#calendarActivityTypeList'));
		app.showSelect2ElementView($('#calendarGroupList'));
		$('.select2,.filterField').on('change', function () {
			$(this).closest('.siteBarContent').find('.refreshHeader').removeClass('hide');
		});
	},
	registerEvents: function () {
		this.renderCalendar();
		this.registerAddButton();
		this.loadCalendarData(true);
		this.registerButtonSelectAll();
		this.registerChangeView();
	}
});
jQuery(document).ready(function () {
	var instance = Calendar_CalendarView_Js.getInstanceByView();
	instance.registerEvents()
	Calendar_CalendarView_Js.currentInstance = instance;
	Calendar_CalendarView_Js.registerWidget();
})
