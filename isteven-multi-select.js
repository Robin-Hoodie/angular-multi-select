/*
 * Angular JS Multi Select
 * Creates a dropdown-like button with checkboxes.
 *
 * Project started on: Tue, 14 Jan 2014 - 5:18:02 PM
 * Current version: 4.0.0
 *
 * Released under the MIT License
 * --------------------------------------------------------------------------------
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Ignatius Steven (https://github.com/isteven)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * --------------------------------------------------------------------------------
 */
'use strict'

angular.module('isteven-multi-select', ['ng']).directive('istevenMultiSelect', ['$sce', '$timeout', '$templateCache', function ($sce, $timeout, $templateCache) {
    return {
        restrict: 'AE',

        scope: {
            // models
            inputModel: '=',
            outputModel: '=',

            // settings based on attribute
            isDisabled: '=',

            // callbacks
            onClear: '&',
            onClose: '&',
            onSearchChange: '&',
            onItemClick: '&',
            onOpen: '&',
            onReset: '&',
            onSelectAll: '&',
            onSelectNone: '&',

            // i18n
            translation: '='
        },

        /*
         * The rest are attributes. They don't need to be parsed / binded, so we can safely access them by value.
         * - buttonLabel, directiveId, helperElements, itemLabel, maxLabels, orientation, selectionMode, minSearchLength,
         *   tickProperty, disableProperty, groupProperty, searchProperty, maxHeight, outputProperties
         */

        templateUrl: 'isteven-multi-select.htm',

        link: function ($scope, element, attrs) {
            $scope.backUp = [];
            $scope.varButtonLabel = '';
            $scope.spacingProperty = '';
            $scope.indexProperty = '';
            $scope.orientationH = false;
            $scope.orientationV = true;
            $scope.filteredModel = [];
            $scope.inputLabel = {
                labelFilter: ''
            };
            $scope.tabIndex = 0;
            $scope.lang = {};
            $scope.helperStatus = {
                all: true,
                none: true,
                reset: true,
                filter: true
            };

            var prevTabIndex = 0,
                helperItems = [],
                helperItemsLength = 0,
                checkBoxLayer = '',
                scrolled = false,
                selectedItems = [],
                formElements = [],
                vMinSearchLength = 0,
                clickedItem = null;

            // v3.0.0
            // clear button clicked
            $scope.clearClicked = function (e) {
                $scope.inputLabel.labelFilter = '';
                $scope.updateFilter();
                $scope.select('clear', e);
            }

            // A little hack so that AngularJS ng-repeat can loop using start and end index like a normal loop
            // http://stackoverflow.com/questions/16824853/way-to-ng-repeat-defined-number-of-times-instead-of-repeating-over-array
            $scope.numberToArray = function (num) {
                return new Array(num);
            }

            // Call this function when user type on the filter field
            $scope.searchChanged = function () {
                if ($scope.inputLabel.labelFilter.length < vMinSearchLength && $scope.inputLabel.labelFilter.length > 0) {
                    return false;
                }
                $scope.updateFilter();
            }

            $scope.updateFilter = function () {
                // we check by looping from end of input-model
                $scope.filteredModel = [];
                var i = 0;

                if ($scope.inputModel === undefined) {
                    return false;
                }

                for (i = $scope.inputModel.length - 1; i >= 0; i--) {

                    // if it's group end, we push it to filteredModel[];
                    if ($scope.helpers.isGroupEnd($scope.inputModel[i])) {
                        $scope.filteredModel.push($scope.inputModel[i]);
                    }

                    // if it's data
                    var gotData = false;
                    if ($scope.helpers.isData($scope.inputModel[i])) {

                        // If we set the search-key attribute, we use this loop.
                        if (attrs.searchProperty !== undefined && attrs.searchProperty !== '') {

                            for (var key in $scope.inputModel[i]) {
                                if (
                                    typeof $scope.inputModel[i][key] !== 'boolean' &&
                                    String($scope.inputModel[i][key]).toUpperCase().indexOf($scope.inputLabel.labelFilter.toUpperCase()) >= 0 &&
                                    attrs.searchProperty.indexOf(key) > -1
                                ) {
                                    gotData = true;
                                    break;
                                }
                            }
                        }
                        // if there's no search-key attribute, we use this one. Much better on performance.
                        else {
                            for (var key in $scope.inputModel[i]) {
                                if (
                                    typeof $scope.inputModel[i][key] !== 'boolean' &&
                                    String($scope.inputModel[i][key]).toUpperCase().indexOf($scope.inputLabel.labelFilter.toUpperCase()) >= 0
                                ) {
                                    gotData = true;
                                    break;
                                }
                            }
                        }

                        if (gotData === true) {
                            // push
                            $scope.filteredModel.push($scope.inputModel[i]);
                        }
                    }

                    // if it's group start
                    if ($scope.helpers.isGroupStart($scope.inputModel[i])) {

                        if ($scope.helpers.isGroupEnd($scope.filteredModel[$scope.filteredModel.length - 1])) {
                            $scope.filteredModel.pop();
                        } else {
                            $scope.filteredModel.push($scope.inputModel[i]);
                        }
                    }
                }

                $scope.filteredModel.reverse();

                $timeout(function () {

                    $scope.getFormElements();

                    // Callback: on filter change
                    if ($scope.inputLabel.labelFilter.length > vMinSearchLength) {

                        var filterObj = [];

                        angular.forEach($scope.filteredModel, function (value, key) {
                            if (value !== undefined) {
                                if (value[attrs.groupProperty] === undefined) {
                                    var tempObj = angular.copy(value);
                                    var index = filterObj.push(tempObj);
                                    delete filterObj[index - 1][$scope.indexProperty];
                                    delete filterObj[index - 1][$scope.spacingProperty];
                                }
                            }
                        });

                        $scope.onSearchChange({
                            data: {
                                keyword: $scope.inputLabel.labelFilter,
                                result: filterObj
                            }
                        });
                    }
                }, 0);
            };

            // List all the input elements. We need this for our keyboard navigation.
            // This function will be called everytime the filter is updated.
            // Depending on the size of filtered mode, might not good for performance, but oh well..
            $scope.getFormElements = function () {
                formElements = [];

                var
                    selectButtons = [],
                    inputField = [],
                    checkboxes = [],
                    clearButton = [];

                // If available, then get select all, select none, and reset buttons
                if ($scope.helperStatus.all || $scope.helperStatus.none || $scope.helperStatus.reset) {
                    selectButtons = element.children().children().next().children().children()[0].getElementsByTagName('button');
                    // If available, then get the search box and the clear button
                    if ($scope.helperStatus.filter) {
                        // Get helper - search and clear button.
                        inputField = element.children().children().next().children().children().next()[0].getElementsByTagName('input');
                        clearButton = element.children().children().next().children().children().next()[0].getElementsByTagName('button');
                    }
                } else {
                    if ($scope.helperStatus.filter) {
                        // Get helper - search and clear button.
                        inputField = element.children().children().next().children().children()[0].getElementsByTagName('input');
                        clearButton = element.children().children().next().children().children()[0].getElementsByTagName('button');
                    }
                }

                // Get checkboxes
                if (!$scope.helperStatus.all && !$scope.helperStatus.none && !$scope.helperStatus.reset && !$scope.helperStatus.filter) {
                    checkboxes = element.children().children().next()[0].getElementsByTagName('input');
                } else {
                    checkboxes = element.children().children().next().children().next()[0].getElementsByTagName('input');
                }

                // Push them into global array formElements[]
                for (var i = 0; i < selectButtons.length; i++) {
                    formElements.push(selectButtons[i]);
                }
                for (var i = 0; i < inputField.length; i++) {
                    formElements.push(inputField[i]);
                }
                for (var i = 0; i < clearButton.length; i++) {
                    formElements.push(clearButton[i]);
                }
                for (var i = 0; i < checkboxes.length; i++) {
                    formElements.push(checkboxes[i]);
                }
            }

            // check if an item has attrs.groupProperty (be it true or false)
            $scope.isGroupMarker = function (item, type) {
                if (item[attrs.groupProperty] !== undefined && item[attrs.groupProperty] === type) return true;
                return false;
            }

            $scope.removeGroupEndMarker = function (item) {
                if ($scope.helpers.isGroupEnd(item)) return false;
                return true;
            }

            // call this function when an item is clicked
            $scope.syncItems = function (item, e, ng_repeat_index) {
                e.preventDefault();
                e.stopPropagation();

                // if the directive is globaly disabled, do nothing
                if (attrs.isDisabled !== undefined && $scope.isDisabled === true) {
                    return false;
                }

                // if item is disabled, do nothing
                if ($scope.helpers.isDisabled(item)) {
                    return false;
                }

                // if end group marker is clicked, do nothing
                if ($scope.helpers.isGroupEnd(item)) {
                    return false;
                }

                var index = $scope.filteredModel.indexOf(item);

                // if the start of group marker is clicked ( only for multiple selection! )
                // how it works:
                // - if the group itself is not selected, then the group and all sub-items will be selected
                // - if the group itself is selected, then the group, all parent groups and all sub-items will be de-selected
                if ($scope.helpers.isGroupStart(item)) {
                    // this is only for multiple selection, so if selection mode is single, do nothing
                    if ($scope.helpers.isSingleSelectionModel()) {
                        return false;
                    }

                    // if it's ticked, untick it and continue
                    if ($scope.helpers.isTicked(item)) {
                        $scope.helpers.setTicked(item, false);

                        let parentGroups = $scope.helpers.getParentGroupsOfItem(item);
                        //for (let parent of parentGroups) {
                        //    $scope.helpers.setTicked(parent, false);
                        //}
						// IE fix
						for(let element_idx in parentGroups) {
							let parent = parentGroups[element_idx];
							$scope.helpers.setTicked(parent, false);
						}
                    } else {
                        $scope.helpers.tickTree(item);
                    }
                } else {
                    // if an item (not group marker) is clicked
                    // If it's single selection mode
                    if ($scope.helpers.isSingleSelectionModel()) {
                        // first, set everything to false
                       // $scope.filteredModel.forEach(item => $scope.helpers.setTicked(item, false));
						$scope.filteredModel.forEach(function(item) { $scope.helpers.setTicked(item, false) });
                        // then set the clicked item to true
                        $scope.helpers.setTicked(item, true);
                    } else {
                        // Multiple
                        $scope.helpers.setTicked(item);
                        // freshly unticked, untick all parent groups as well
                        if ($scope.helpers.isNotTicked(item)) {
                            let parentGroups = $scope.helpers.getParentGroupsOfItem(item);
                            //for (let parent of parentGroups) {
                           //     $scope.helpers.setTicked(parent, false);
                            //}
							// IE fix
							for(let element_idx in parentGroups) {
								let parent = parentGroups[element_idx];
								$scope.helpers.setTicked(parent, false);
							}
                        }
                    }
                }

                // we execute the callback function here
                clickedItem = angular.copy(item);
                if (clickedItem !== null) {
                    $timeout(function () {
                        delete clickedItem[$scope.indexProperty];
                        delete clickedItem[$scope.spacingProperty];
                        $scope.onItemClick({
                            data: clickedItem
                        });
                        clickedItem = null;
                    }, 0);
                }

                $scope.refreshOutputModel();
                $scope.refreshButton();

                // We update the index here
                prevTabIndex = $scope.tabIndex;
                $scope.tabIndex = ng_repeat_index + helperItemsLength;

                // Set focus on the hidden checkbox
                e.target.focus();

                // set & remove CSS style
                $scope.removeFocusStyle(prevTabIndex);
                $scope.setFocusStyle($scope.tabIndex);

                if (attrs.selectionMode !== undefined && attrs.selectionMode.toUpperCase() === 'SINGLE') {
                    // on single selection mode, we then hide the checkbox layer
                    $scope.toggleCheckboxes(e);
                }
            };

            // update $scope.outputModel
            $scope.refreshOutputModel = function () {
                $scope.outputModel = [];
                let outputProps = [],
                    tempObj = {},
                    index = 0;

                // v4.0.0
                if (attrs.outputProperties !== undefined) {
                    outputProps = attrs.outputProperties.split(' ');
                }

                for (let i = 0; i < $scope.inputModel.length; i++) {
                    let child = $scope.inputModel[i];

                    if (!$scope.helpers.isGroupEnd(child)) {
                        if ($scope.helpers.isTicked(child)) {
                            if (attrs.outputProperties !== undefined) {
                                tempObj = {};
                                angular.forEach(child, function (value, key) {
                                    if (outputProps.indexOf(key) > -1) {
                                        tempObj[key] = value;
                                    }
                                });
                            } else {
                                tempObj = angular.copy(child);
                            }

                            delete tempObj[$scope.indexProperty];
                            delete tempObj[$scope.spacingProperty];
                            index = $scope.outputModel.push(tempObj);

                            // we need to skip the contents of the group if it was checked
                            if ($scope.helpers.isGroupStart(child)) {
                                let childArray = $scope.helpers.getGroupForStartItem(child);
                                i += childArray.length + 1;
                            }
                        }
                    }
                }
            };

            // refresh button label
            $scope.refreshButton = function () {

                $scope.varButtonLabel = '';
                var ctr = 0;

                // refresh button label...
                if ($scope.outputModel.length === 0) {
                    // https://github.com/isteven/angular-multi-select/pull/19
                    $scope.varButtonLabel = $scope.lang.nothingSelected;
                } else {
                    var tempMaxLabels = $scope.outputModel.length;
                    if (attrs.maxLabels !== undefined && attrs.maxLabels !== '') {
                        tempMaxLabels = attrs.maxLabels;
                    }

                    // if max amount of labels displayed..
                    if ($scope.outputModel.length > tempMaxLabels) {
                        $scope.more = true;
                    } else {
                        $scope.more = false;
                    }

                    angular.forEach($scope.outputModel, function (value, key) {
                        if (value !== undefined && value[attrs.tickProperty] === true) {
                            if (ctr < tempMaxLabels) {
                                $scope.varButtonLabel += ($scope.varButtonLabel.length > 0 ? '</div>, <div class="buttonLabel">' : '<div class="buttonLabel">') + $scope.writeLabel(value, 'buttonLabel');
                            }
                            ctr++;
                        }
                    });

                    if ($scope.more === true) {
                        // https://github.com/isteven/angular-multi-select/pull/16
                        if (tempMaxLabels > 0) {
                            $scope.varButtonLabel += ', ... ';
                        }
                        $scope.varButtonLabel += '(' + $scope.outputModel.length + ')';
                    }
                }
                $scope.varButtonLabel = $sce.trustAsHtml($scope.varButtonLabel + '<span class="caret"></span>');
            }

            // Check if a checkbox is disabled or enabled. It will check the granular control (disableProperty) and global control (isDisabled)
            // Take note that the granular control has higher priority.
            $scope.itemIsDisabled = function (item) {

                if (attrs.disableProperty !== undefined && item[attrs.disableProperty] === true) {
                    return true;
                } else {
                    if ($scope.isDisabled === true) {
                        return true;
                    } else {
                        return false;
                    }
                }

            }

            // A simple function to parse the item label settings. Used on the buttons and checkbox labels.
            $scope.writeLabel = function (item, type) {

                // type is either 'itemLabel' or 'buttonLabel'
                var temp = attrs[type].split(' ');
                var label = '';

                angular.forEach(temp, function (value, key) {
                    item[value] && (label += '&nbsp;' + value.split('.').reduce(function (prev, current) {
                        return prev[current];
                    }, item));
                });

                if (type.toUpperCase() === 'BUTTONLABEL') {
                    return label;
                }
                return $sce.trustAsHtml(label);
            }

            // UI operations to show/hide checkboxes based on click event..
            $scope.toggleCheckboxes = function (e) {

                // We grab the button
                var clickedEl = element.children()[0];

                // Just to make sure.. had a bug where key events were recorded twice
                angular.element(document).off('click', $scope.externalClickListener);
                angular.element(document).off('keydown', $scope.keyboardListener);

                // The idea below was taken from another multi-select directive - https://github.com/amitava82/angular-multiselect
                // His version is awesome if you need a more simple multi-select approach.

                // close
                if (angular.element(checkBoxLayer).hasClass('show')) {

                    angular.element(checkBoxLayer).removeClass('show');
                    angular.element(clickedEl).removeClass('buttonClicked');
                    angular.element(document).off('click', $scope.externalClickListener);
                    angular.element(document).off('keydown', $scope.keyboardListener);

                    // clear the focused element;
                    $scope.removeFocusStyle($scope.tabIndex);
                    if (formElements[$scope.tabIndex] !== undefined) {
                        formElements[$scope.tabIndex].blur();
                    }

                    // close callback
                    $timeout(function () {
                        $scope.onClose();
                    }, 0);

                    // set focus on button again
                    element.children().children()[0].focus();
                }
                // open
                else {
                    // clear filter
                    $scope.inputLabel.labelFilter = '';
                    $scope.updateFilter();

                    helperItems = [];
                    helperItemsLength = 0;

                    angular.element(checkBoxLayer).addClass('show');
                    angular.element(clickedEl).addClass('buttonClicked');

                    // Attach change event listener on the input filter.
                    // We need this because ng-change is apparently not an event listener.
                    angular.element(document).on('click', $scope.externalClickListener);
                    angular.element(document).on('keydown', $scope.keyboardListener);

                    // to get the initial tab index, depending on how many helper elements we have.
                    // priority is to always focus it on the input filter
                    $scope.getFormElements();
                    $scope.tabIndex = 0;

                    var helperContainer = angular.element(element[0].querySelector('.helperContainer'))[0];

                    if (helperContainer !== undefined) {
                        for (var i = 0; i < helperContainer.getElementsByTagName('BUTTON').length; i++) {
                            helperItems[i] = helperContainer.getElementsByTagName('BUTTON')[i];
                        }
                        helperItemsLength = helperItems.length + helperContainer.getElementsByTagName('INPUT').length;
                    }

                    // focus on the filter element on open.
                    if (element[0].querySelector('.inputFilter')) {
                        element[0].querySelector('.inputFilter').focus();
                        $scope.tabIndex = $scope.tabIndex + helperItemsLength - 2;
                        // blur button in vain
                        angular.element(element).children()[0].blur();
                    }
                    // if there's no filter then just focus on the first checkbox item
                    else {
                        if (!$scope.isDisabled) {
                            $scope.tabIndex = $scope.tabIndex + helperItemsLength;
                            if ($scope.inputModel.length > 0) {
                                formElements[$scope.tabIndex].focus();
                                $scope.setFocusStyle($scope.tabIndex);
                                // blur button in vain
                                angular.element(element).children()[0].blur();
                            }
                        }
                    }

                    // open callback
                    $scope.onOpen();
                }
            }

            // handle clicks outside the button / multi select layer
            $scope.externalClickListener = function (e) {

                var targetsArr = element.find(e.target.tagName);
                for (var i = 0; i < targetsArr.length; i++) {
                    if (e.target == targetsArr[i]) {
                        return;
                    }
                }

                angular.element(checkBoxLayer.previousSibling).removeClass('buttonClicked');
                angular.element(checkBoxLayer).removeClass('show');
                angular.element(document).off('click', $scope.externalClickListener);
                angular.element(document).off('keydown', $scope.keyboardListener);

                // close callback
                $timeout(function () {
                    $scope.onClose();
                }, 0);

                // set focus on button again
                element.children().children()[0].focus();
            }

            // select All / select None / reset buttons
            $scope.select = function (type, e) {

                var helperIndex = helperItems.indexOf(e.target);
                $scope.tabIndex = helperIndex;

                switch (type.toUpperCase()) {
                    case 'ALL':
                        angular.forEach($scope.filteredModel, function (value, key) {
                            if (value !== undefined && !$scope.helpers.isDisabled(value)) {
                                if (!$scope.helpers.isGroupEnd(value)) {
                                    $scope.helpers.setTicked(value, true);
                                }
                            }
                        });
                        $scope.refreshOutputModel();
                        $scope.refreshButton();
                        $scope.onSelectAll();
                        break;
                    case 'NONE':
                        angular.forEach($scope.filteredModel, function (value, key) {
                            if (value !== undefined && !$scope.helpers.isDisabled(value)) {
                                if (!$scope.helpers.isGroupEnd(value)) {
                                    $scope.helpers.setTicked(value, false);
                                }
                            }
                        });
                        $scope.refreshOutputModel();
                        $scope.refreshButton();
                        $scope.onSelectNone();
                        break;
                    case 'RESET':
                        angular.forEach($scope.filteredModel, function (value, key) {
                            if (value !== undefined && !$scope.helpers.isGroupEnd(value) && !$scope.helpers.isDisabled(value)) {
                                var temp = value[$scope.indexProperty];
                                $scope.helpers.setTicked(value, $scope.backUp[temp][$scope.tickProperty]);
                            }
                        });
                        $scope.refreshOutputModel();
                        $scope.refreshButton();
                        $scope.onReset();
                        break;
                    case 'CLEAR':
                        $scope.tabIndex = $scope.tabIndex + 1;
                        $scope.onClear();
                        break;
                    case 'FILTER':
                        $scope.tabIndex = helperItems.length - 1;
                        break;
                    default:
                }
            }

            // just to create a random variable name
            function genRandomString(length) {
                var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
                var temp = '';
                for (var i = 0; i < length; i++) {
                    temp += possible.charAt(Math.floor(Math.random() * possible.length));
                }
                return temp;
            }

            // count leading spaces
            $scope.prepareGrouping = function () {
                var spacing = 0;
                angular.forEach($scope.filteredModel, function (value, key) {
                    value[$scope.spacingProperty] = spacing;
                    if (value[attrs.groupProperty] === true) {
                        spacing += 2;
                    } else if (value[attrs.groupProperty] === false) {
                        spacing -= 2;
                    }
                });
            }

            // prepare original index
            $scope.prepareIndex = function () {
                var ctr = 0;
                angular.forEach($scope.filteredModel, function (value, key) {
                    value[$scope.indexProperty] = ctr;
                    ctr++;
                });
            }

            // navigate using up and down arrow
            $scope.keyboardListener = function (e) {

                var key = e.keyCode ? e.keyCode : e.which;
                var isNavigationKey = false;

                // ESC key (close)
                if (key === 27) {
                    e.preventDefault();
                    e.stopPropagation();
                    $scope.toggleCheckboxes(e);
                }


                // next element ( tab, down & right key )
                else if (key === 40 || key === 39 || (!e.shiftKey && key == 9)) {

                    isNavigationKey = true;
                    prevTabIndex = $scope.tabIndex;
                    $scope.tabIndex++;
                    if ($scope.tabIndex > formElements.length - 1) {
                        $scope.tabIndex = 0;
                        prevTabIndex = formElements.length - 1;
                    }
                    while (formElements[$scope.tabIndex].disabled === true) {
                        $scope.tabIndex++;
                        if ($scope.tabIndex > formElements.length - 1) {
                            $scope.tabIndex = 0;
                        }
                        if ($scope.tabIndex === prevTabIndex) {
                            break;
                        }
                    }
                }

                // prev element ( shift+tab, up & left key )
                else if (key === 38 || key === 37 || (e.shiftKey && key == 9)) {
                    isNavigationKey = true;
                    prevTabIndex = $scope.tabIndex;
                    $scope.tabIndex--;
                    if ($scope.tabIndex < 0) {
                        $scope.tabIndex = formElements.length - 1;
                        prevTabIndex = 0;
                    }
                    while (formElements[$scope.tabIndex].disabled === true) {
                        $scope.tabIndex--;
                        if ($scope.tabIndex === prevTabIndex) {
                            break;
                        }
                        if ($scope.tabIndex < 0) {
                            $scope.tabIndex = formElements.length - 1;
                        }
                    }
                }

                if (isNavigationKey === true) {

                    e.preventDefault();

                    // set focus on the checkbox
                    formElements[$scope.tabIndex].focus();
                    var actEl = document.activeElement;

                    if (actEl.type.toUpperCase() === 'CHECKBOX') {
                        $scope.setFocusStyle($scope.tabIndex);
                        $scope.removeFocusStyle(prevTabIndex);
                    } else {
                        $scope.removeFocusStyle(prevTabIndex);
                        $scope.removeFocusStyle(helperItemsLength);
                        $scope.removeFocusStyle(formElements.length - 1);
                    }
                }

                isNavigationKey = false;
            }

            // set (add) CSS style on selected row
            $scope.setFocusStyle = function (tabIndex) {
                angular.element(formElements[tabIndex]).parent().parent().parent().addClass('multiSelectFocus');
            }

            // remove CSS style on selected row
            $scope.removeFocusStyle = function (tabIndex) {
                angular.element(formElements[tabIndex]).parent().parent().parent().removeClass('multiSelectFocus');
            }

            /*********************
             *********************
            *
            * 1) Initializations
            *
            *********************
            *********************/

            // attrs to $scope - attrs-$scope - attrs - $scope
            // Copy some properties that will be used on the template. They need to be in the $scope.
            $scope.groupProperty = attrs.groupProperty;
            $scope.tickProperty = attrs.tickProperty;
            $scope.directiveId = attrs.directiveId;

            // Unfortunately I need to add these grouping properties into the input model
            var tempStr = genRandomString(5);
            $scope.indexProperty = 'idx_' + tempStr;
            $scope.spacingProperty = 'spc_' + tempStr;

            // set orientation css
            if (attrs.orientation !== undefined) {

                if (attrs.orientation.toUpperCase() === 'HORIZONTAL') {
                    $scope.orientationH = true;
                    $scope.orientationV = false;
                } else {
                    $scope.orientationH = false;
                    $scope.orientationV = true;
                }
            }

            // get elements required for DOM operation
            checkBoxLayer = element.children().children().next()[0];

            // set max-height property if provided
            if (attrs.maxHeight !== undefined) {
                var layer = element.children().children().children()[0];
                angular.element(layer).attr("style", "height:" + attrs.maxHeight + "; overflow-y:scroll;");
            }

            // some flags for easier checking
            for (var property in $scope.helperStatus) {
                if ($scope.helperStatus.hasOwnProperty(property)) {
                    if (
                        attrs.helperElements !== undefined &&
                        attrs.helperElements.toUpperCase().indexOf(property.toUpperCase()) === -1
                    ) {
                        $scope.helperStatus[property] = false;
                    }
                }
            }
            if (attrs.selectionMode !== undefined && attrs.selectionMode.toUpperCase() === 'SINGLE') {
                $scope.helperStatus['all'] = false;
                $scope.helperStatus['none'] = false;
            }

            // helper button icons.. I guess you can use html tag here if you want to.
            $scope.icon = {};
            $scope.icon.selectAll = '&#10003;'; // a tick icon
            $scope.icon.selectNone = '&times;'; // x icon
            $scope.icon.reset = '&#8630;'; // undo icon
            // this one is for the selected items
            $scope.icon.tickMark = '&#10003;'; // a tick icon

            // configurable button labels
            if (attrs.translation !== undefined) {
                $scope.lang.selectAll = $sce.trustAsHtml($scope.icon.selectAll + '&nbsp;&nbsp;' + $scope.translation.selectAll);
                $scope.lang.selectNone = $sce.trustAsHtml($scope.icon.selectNone + '&nbsp;&nbsp;' + $scope.translation.selectNone);
                $scope.lang.reset = $sce.trustAsHtml($scope.icon.reset + '&nbsp;&nbsp;' + $scope.translation.reset);
                $scope.lang.search = $scope.translation.search;
                $scope.lang.nothingSelected = $sce.trustAsHtml($scope.translation.nothingSelected);
            } else {
                $scope.lang.selectAll = $sce.trustAsHtml($scope.icon.selectAll + '&nbsp;&nbsp;Select All');
                $scope.lang.selectNone = $sce.trustAsHtml($scope.icon.selectNone + '&nbsp;&nbsp;Select None');
                $scope.lang.reset = $sce.trustAsHtml($scope.icon.reset + '&nbsp;&nbsp;Reset');
                $scope.lang.search = 'Search...';
                $scope.lang.nothingSelected = 'None Selected';
            }
            $scope.icon.tickMark = $sce.trustAsHtml($scope.icon.tickMark);

            // min length of keyword to trigger the filter function
            if (attrs.MinSearchLength !== undefined && parseInt(attrs.MinSearchLength) > 0) {
                vMinSearchLength = Math.floor(parseInt(attrs.MinSearchLength));
            }

            /*******************************************************
             *******************************************************
            *
            * 2) Logic starts here, initiated by watch 1 & watch 2
            *
            *******************************************************
            *******************************************************/

            // watch1, for changes in input model property
            // updates multi-select when user select/deselect a single checkbox programatically
            // https://github.com/isteven/angular-multi-select/issues/8
            $scope.$watch('inputModel', function (newVal) {
                if (newVal) {
                    $scope.refreshOutputModel();
                    $scope.refreshButton();
                }
            }, true);

            // watch2 for changes in input model as a whole
            // this on updates the multi-select when a user load a whole new input-model. We also update the $scope.backUp variable
            $scope.$watch('inputModel', function (newVal) {
                if (newVal) {
                    $scope.backUp = angular.copy($scope.inputModel);
                    $scope.updateFilter();
                    $scope.prepareGrouping();
                    $scope.prepareIndex();
                    $scope.refreshOutputModel();
                    $scope.refreshButton();
                }
            });

            // watch for changes in directive state (disabled or enabled)
            $scope.$watch('isDisabled', function (newVal) {
                $scope.isDisabled = newVal;
            });

            // this is for touch enabled devices. We don't want to hide checkboxes on scroll.
            var onTouchStart = function (e) {
                $scope.$apply(function () {
                    $scope.scrolled = false;
                });
            };
            angular.element(document).bind('touchstart', onTouchStart);
            var onTouchMove = function (e) {
                $scope.$apply(function () {
                    $scope.scrolled = true;
                });
            };
            angular.element(document).bind('touchmove', onTouchMove);

            // unbind document events to prevent memory leaks
            $scope.$on('$destroy', function () {
                angular.element(document).unbind('touchstart', onTouchStart);
                angular.element(document).unbind('touchmove', onTouchMove);
            });

            $scope.helpers = {
                isGroupStart: function (item) {
                    return item[attrs.groupProperty] === true;
                },

                isGroupEnd: function (item) {
                    return item[attrs.groupProperty] === false;
                },

                isData: function (item) {
                    return item[attrs.groupProperty] === undefined;
                },

                isTicked: function (item) {
                    return item[attrs.tickProperty] === true;
                },

                isNotTicked: function (item) {
                    return item[attrs.tickProperty] !== true;
                },

                setTicked: function (item, ticked) {
                    if (ticked === undefined) {
                        // if missing, flip it
                        ticked = $scope.helpers.isNotTicked(item);
                    }
                    if ($scope.helpers.isNotDisabled(item) && !$scope.helpers.isGroupEnd(item)) {
                        item[$scope.tickProperty] = ticked;
                        // we refresh input model as well
                        let inputModelIndex = item[$scope.indexProperty];
                        $scope.inputModel[inputModelIndex][$scope.tickProperty] = ticked;
                        return true;
                    }
                    return false;
                },

                /**
                 * This method should be used only for group starts, and only for ticking all sub-items.
                 */
                tickTree: function (item, groupArray) {
                    if ($scope.helpers.isTicked(item)) {
                        return true;
                    }

                    groupArray = groupArray || $scope.helpers.getGroupForStartItem(item);

                    let allChildrenTicked = true;

                    for (let i = 0; i < groupArray.length; i++) {
                        let child = groupArray[i];
                        if ($scope.helpers.isGroupStart(child)) {
                            let childArray = $scope.helpers.getGroupForStartItem(child);
                            allChildrenTicked = $scope.helpers.tickTree(child, childArray) && allChildrenTicked;
                            i += childArray.length + 1;
                        } else if (!$scope.helpers.isGroupEnd(child)) {
                            allChildrenTicked = $scope.helpers.setTicked(child, true) && allChildrenTicked;
                        }
                    }

                    if (allChildrenTicked) {
                        $scope.helpers.setTicked(item, true);
                    }

                    return allChildrenTicked;
                },

                isDisabled: function (item) {
                    return attrs.disableProperty !== undefined && item[attrs.disableProperty] === true;
                },

                isNotDisabled: function (item) {
                    return attrs.disableProperty === undefined || item[attrs.disableProperty] !== true;
                },

                isSingleSelectionModel: function () {
                    return attrs.selectionMode !== undefined && attrs.selectionMode.toUpperCase() === 'SINGLE';
                },

                getParentGroupsOfItem: function (item) {
                    var index = $scope.filteredModel.indexOf(item);
                    var result = [];
                    var endNumber = 0;
                    var copy = $scope.filteredModel.slice(0, index).reverse();





					// IE fix
					for(let element_idx in copy) {
						let maybeParent = copy[element_idx];
                    //for (let maybeParent of copy) {
                        if ($scope.helpers.isGroupEnd(maybeParent)) {
                            endNumber++;
                        } else if ($scope.helpers.isGroupStart(maybeParent)) {
                            if (endNumber > 0) { endNumber--; }
                            else {
                                result.push(maybeParent);
                            }
                        }
                    }
                    return result;
                },

                /**
                 * Returns an array containing all elements of the group. The group start/end is not included.
                 */
                getGroupForStartItem: function (item) {
                    var index = $scope.filteredModel.indexOf(item);
                    if (!$scope.helpers.isGroupStart(item) || index === -1) {
                        return item;
                    }

                    let nestLevel = 0;

					// IE fix
						for(let element_idx in $scope.filteredModel.slice(index)) {
							let maybeEnd = $scope.filteredModel.slice(index)[element_idx];
                    //for (let maybeEnd of $scope.filteredModel.slice(index)) {
                        if ($scope.helpers.isGroupStart(maybeEnd)) {
                            nestLevel++;
                        } else if ($scope.helpers.isGroupEnd(maybeEnd)) {
                            nestLevel--;
                            if (nestLevel === 0) {
                                return $scope.filteredModel.slice(index + 1, $scope.filteredModel.indexOf(maybeEnd));
                            }
                        }
                    }
                }
            };

        },
    }
}]).run(['$templateCache', function ($templateCache) {
    var template =
        '<span class="multiSelect inlineBlock">' +
        // main button
        '<button id="{{directiveId}}" type="button"' +
        'ng-click="toggleCheckboxes( $event ); refreshOutputModel(); refreshButton(); prepareGrouping(); prepareIndex();"' +
        'ng-bind-html="varButtonLabel"' +
        'ng-disabled="disable-button"' +
        '>' +
        '</button>' +
        // overlay layer
        '<div class="checkboxLayer">' +
        // container of the helper elements
        '<div class="helperContainer" ng-if="helperStatus.filter || helperStatus.all || helperStatus.none || helperStatus.reset ">' +
        // container of the first 3 buttons, select all, none and reset
        '<div class="line" ng-if="helperStatus.all || helperStatus.none || helperStatus.reset ">' +
        // select all
        '<button type="button" class="helperButton"' +
        'ng-disabled="isDisabled"' +
        'ng-if="helperStatus.all"' +
        'ng-click="select( \'all\', $event );"' +
        'ng-bind-html="lang.selectAll">' +
        '</button>' +
        // select none
        '<button type="button" class="helperButton"' +
        'ng-disabled="isDisabled"' +
        'ng-if="helperStatus.none"' +
        'ng-click="select( \'none\', $event );"' +
        'ng-bind-html="lang.selectNone">' +
        '</button>' +
        // reset
        '<button type="button" class="helperButton reset"' +
        'ng-disabled="isDisabled"' +
        'ng-if="helperStatus.reset"' +
        'ng-click="select( \'reset\', $event );"' +
        'ng-bind-html="lang.reset">' +
        '</button>' +
        '</div>' +
        // the search box
        '<div class="line" style="position:relative" ng-if="helperStatus.filter">' +
        // textfield
        '<input placeholder="{{lang.search}}" type="text"' +
        'ng-click="select( \'filter\', $event )" ' +
        'ng-model="inputLabel.labelFilter" ' +
        'ng-change="searchChanged()" class="inputFilter"' +
        '/>' +
        // clear button
        '<button type="button" class="clearButton" ng-click="clearClicked( $event )" >×</button> ' +
        '</div> ' +
        '</div> ' +
        // selection items
        '<div class="checkBoxContainer">' +
        '<div ' +
        'ng-repeat="item in filteredModel | filter:removeGroupEndMarker" class="multiSelectItem"' +
        'ng-class="{selected: item[ tickProperty ], horizontal: orientationH, vertical: orientationV, multiSelectGroup:item[ groupProperty ], disabled:itemIsDisabled( item )}"' +
        'ng-click="syncItems( item, $event, $index );" ' +
        'ng-mouseleave="removeFocusStyle( tabIndex );"> ' +
        // this is the spacing for grouped items
        '<div class="acol" ng-if="item[ spacingProperty ] > 0" ng-repeat="i in numberToArray( item[ spacingProperty ] ) track by $index">' +
        '</div>  ' +
        '<div class="acol">' +
        '<label>' +
        // input, so that it can accept focus on keyboard click
        '<input class="checkbox focusable" type="checkbox" ' +
        'ng-disabled="itemIsDisabled( item )" ' +
        'ng-checked="item[ tickProperty ]" ' +
        'ng-click="syncItems( item, $event, $index )" />' +
        // item label using ng-bind-hteml
        '<span ' +
        'ng-class="{disabled:itemIsDisabled( item )}" ' +
        'ng-bind-html="writeLabel( item, \'itemLabel\' )">' +
        '</span>' +
        '</label>' +
        '</div>' +
        // the tick/check mark
        '<span class="tickMark" ng-if="item[ tickProperty ] === true" ng-bind-html="icon.tickMark"></span>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</span>';
    $templateCache.put('isteven-multi-select.htm', template);
}]);
