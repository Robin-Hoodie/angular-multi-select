describe('MultiSelectDirective', function () {
    var compile, $scope, directiveElem, testData, scope;

    function getCompiledElement() {
        var element = angular.element(`<div isteven-multi-select group-property="msGroup" tick-property="tick" disable-property="disabled"
            input-model="inputModel" output-model="outputModel" item-label="data"></div>`);
        var compiledElement = compile(element)($scope);
        $scope.$digest();
        return compiledElement;
    }

    beforeEach(function () {
        angular.mock.module('isteven-multi-select');

        inject(function ($compile, $rootScope) {
            compile = $compile;
            $scope = $rootScope.$new();

            /** testData hierarchy:
             * Group 1
             *   Group 1.1
             *     Item 1.1.1
             *     Item 1.1.2 (disabled)
             *   Group 1.2
             *     Item 1.2.1
             *     Item 1.2.2
             *   Item 1.1
             * Group 2
             *   Group 2.1
             *     Item 2.1.1
             *     Item 2.1.2
             *   Group 2.2
             *     Item 2.2.1
             *     Item 2.2.2
             *   Item 2.1
             * Item 1
             * Item 2
             */
            testData = [
                { data: 'Group 1', msGroup: true },
                { data: 'Group 1.1', msGroup: true },
                { data: 'Item 1.1.1' },
                { data: 'Item 1.1.2', disabled: true },
                // close Group 1.1
                { msGroup: false },
                { data: 'Group 1.2', msGroup: true },
                { data: 'Item 1.2.1' },
                { data: 'Item 1.2.2' },
                // close Group 1.2
                { msGroup: false },
                { data: 'Item 1.1' },
                // close Group 1
                { msGroup: false },
                { data: 'Group 2', msGroup: true },
                { data: 'Group 2.1', msGroup: true },
                { data: 'Item 2.1.1' },
                { data: 'Item 2.1.2' },
                // close Group 2.1
                { msGroup: false },
                { data: 'Group 2.2', msGroup: true },
                { data: 'Item 2.2.1' },
                { data: 'Item 2.2.2' },
                // close Group 2.2
                { msGroup: false },
                { data: 'Item 2.1' },
                // close Group 2
                { msGroup: false },
                { data: 'Item 1' },
                { data: 'Item 2' }
            ];

            $scope.inputModel = testData;
        });

        directiveElem = getCompiledElement();
        scope = directiveElem.isolateScope();
    });

    describe('scope should have', () => {
        it('bound values', function () {
            expect(scope.groupProperty).toEqual('msGroup');
            expect(scope.tickProperty).toEqual('tick');
        });

        it('isGroupStart method', function () {
            expect(scope.helpers.isGroupStart).toBeDefined();
            expect(typeof scope.helpers.isGroupStart).toEqual('function');
        });

        it('isGroupEnd method', function () {
            expect(scope.helpers.isGroupEnd).toBeDefined();
            expect(typeof scope.helpers.isGroupEnd).toEqual('function');
        });

        it('isData method', function () {
            expect(scope.helpers.isData).toBeDefined();
            expect(typeof scope.helpers.isData).toEqual('function');
        });

        it('isTicked method', function () {
            expect(scope.helpers.isTicked).toBeDefined();
            expect(typeof scope.helpers.isTicked).toEqual('function');
        });

        it('isNotTicked method', function () {
            expect(scope.helpers.isNotTicked).toBeDefined();
            expect(typeof scope.helpers.isNotTicked).toEqual('function');
        });
    });

    var find = function (data) {
        return testData[testData.findIndex(item => item.data === data)];
    }

    describe('getParentGroupsOfItem', function () {
        it('method should exist', function () {
            expect(scope.helpers.getParentGroupsOfItem).toBeDefined();
            expect(typeof scope.helpers.getParentGroupsOfItem).toEqual('function');
        });

        it('should return all groups the item is in (two deep)', function () {
            var clickedItem = find('Item 2.1.1');
            var parentGroups = scope.helpers.getParentGroupsOfItem(clickedItem);
            var expectedGroups = [find('Group 2.1'), find('Group 2')];
            expect(parentGroups).toEqual(expectedGroups);
        });

        it('should return all groups the item is in (one deep)', function () {
            var clickedItem = find('Item 1.1');
            var parentGroups = scope.helpers.getParentGroupsOfItem(clickedItem);
            var expectedGroups = [find('Group 1')];
            expect(parentGroups).toEqual(expectedGroups);
        });

        it('should return all groups the item is in (for groups)', function () {
            var clickedItem = find('Group 1.2');
            var parentGroups = scope.helpers.getParentGroupsOfItem(clickedItem);
            var expectedGroups = [find('Group 1')];
            expect(parentGroups).toEqual(expectedGroups);
        });

        it('should return all groups the item is in (root item)', function () {
            var clickedItem = find('Item 1');
            var parentGroups = scope.helpers.getParentGroupsOfItem(clickedItem);
            expect(parentGroups).toEqual([]);
        });
    });

    describe('getGroupForStartItem', function () {
        it('method should exist', function () {
            expect(scope.helpers.getGroupForStartItem).toBeDefined();
            expect(typeof scope.helpers.getGroupForStartItem).toEqual('function');
        });

        it('should return an array containing all sub-items of the group', function () {
            var clickedItem = find('Group 1');
            var groupArray = scope.helpers.getGroupForStartItem(clickedItem);
            var itemAfterLastIncludedElement = find('Group 2');
            var expectedArray = testData.slice(testData.indexOf(clickedItem) + 1, testData.indexOf(itemAfterLastIncludedElement) - 1);
            expect(groupArray).toEqual(expectedArray);
        });

        it('should return an array containing all sub-items of the group', function () {
            var clickedItem = find('Group 2.2');
            var groupArray = scope.helpers.getGroupForStartItem(clickedItem);
            var itemAfterLastIncludedElement = find('Item 2.1');
            var expectedArray = testData.slice(testData.indexOf(clickedItem) + 1, testData.indexOf(itemAfterLastIncludedElement) - 1);
            expect(groupArray).toEqual(expectedArray);
        });
    });

    describe('setTicked', function () {
        it('method should exist', function () {
            expect(scope.helpers.setTicked).toBeDefined();
            expect(typeof scope.helpers.setTicked).toEqual('function');
        });

        it('should flip if one parameter', function () {
            var clickedItem = find('Item 1');
            var result = scope.helpers.setTicked(clickedItem);
            expect(result).toEqual(true);
            expect(clickedItem.tick).toEqual(true);

            result = scope.helpers.setTicked(clickedItem);
            expect(result).toEqual(true);
            expect(clickedItem.tick).toEqual(false);
        });

        it('should not change if set the same', function () {
            var clickedItem = find('Item 1');
            var result = scope.helpers.setTicked(clickedItem);
            expect(result).toEqual(true);
            expect(clickedItem.tick).toEqual(true);

            result = scope.helpers.setTicked(clickedItem, true);
            expect(result).toEqual(true);
            expect(clickedItem.tick).toEqual(true);
        });

        it('should not change if item is disabled', function () {
            var clickedItem = find('Item 1.1.2');
            var result = scope.helpers.setTicked(clickedItem);
            expect(result).toEqual(false);
            expect(clickedItem.tick).not.toEqual(true);
        });
    });

    describe('tickTree', function () {
        it('method should exist', function () {
            expect(scope.helpers.tickTree).toBeDefined();
            expect(typeof scope.helpers.tickTree).toEqual('function');
        });

        it('should tick all items for a viable group', function () {
            var clickedItem = find('Group 2.1');
            var result = scope.helpers.tickTree(clickedItem);
            expect(result).toEqual(true);
            expect(find('Group 2.1').tick).toEqual(true);
            expect(find('Item 2.1.1').tick).toEqual(true);
            expect(find('Item 2.1.2').tick).toEqual(true);
        });

        it('should tick all items for a viable group recursively', function () {
            var clickedItem = find('Group 2');
            var result = scope.helpers.tickTree(clickedItem);
            expect(result).toEqual(true);
            expect(find('Group 2').tick).toEqual(true);
            expect(find('Group 2.1').tick).toEqual(true);
            expect(find('Item 2.1.1').tick).toEqual(true);
            expect(find('Item 2.1.2').tick).toEqual(true);
            expect(find('Group 2.2').tick).toEqual(true);
            expect(find('Item 2.2.1').tick).toEqual(true);
            expect(find('Item 2.2.2').tick).toEqual(true);
            expect(find('Item 2.1').tick).toEqual(true);
        });

        it('should not tick all items for a non-viable group', function () {
            var clickedItem = find('Group 1.1');
            var result = scope.helpers.tickTree(clickedItem);
            expect(result).toEqual(false);
            expect(find('Group 1.1').tick).not.toEqual(true);
            expect(find('Item 1.1.1').tick).toEqual(true);
            expect(find('Item 1.1.2').tick).not.toEqual(true);
        });

        it('should not tick all items for a non-viable group recursively', function () {
            var clickedItem = find('Group 1');
            var result = scope.helpers.tickTree(clickedItem);
            expect(result).toEqual(false);

            expect(find('Group 1').tick).not.toEqual(true);
            expect(find('Group 1.1').tick).not.toEqual(true);
            expect(find('Item 1.1.1').tick).toEqual(true);
            expect(find('Item 1.1.2').tick).not.toEqual(true);
            expect(find('Group 1.2').tick).toEqual(true);
            expect(find('Item 1.2.1').tick).toEqual(true);
            expect(find('Item 1.2.2').tick).toEqual(true);
            expect(find('Item 1.1').tick).toEqual(true);
        });
    });

    describe('selecting a group and then deselecting', () => {
        it('a value should work', () => {

        });
    });

    describe('outputModel', function () {
        it('should contain group if it is checked', function () {
            var clickedItem = find('Group 2');
            var result = scope.helpers.tickTree(clickedItem);
            scope.refreshOutputModel();

            expect(scope.outputModel.length).toEqual(1);
            expect(scope.outputModel[0].data).toEqual('Group 2');
        });

        it('should not contain group if it is not checked', function () {
            var clickedItem = find('Group 1');
            var result = scope.helpers.tickTree(clickedItem);
            scope.refreshOutputModel();

            expect(scope.outputModel.length).toEqual(3);
            expect(scope.outputModel[0].data).toEqual('Item 1.1.1');
            expect(scope.outputModel[1].data).toEqual('Group 1.2');
            expect(scope.outputModel[2].data).toEqual('Item 1.1');
        });
    });
})
