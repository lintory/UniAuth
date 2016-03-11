define(['../../utils/constant', '../../utils/utils'], function (constant, utils) {

    var Controller = function ($rootScope, $scope, $location, PermService, dialogs, $state) {

        function getAllPermTypes() {
            PermService.getAllPermTypes().$promise.then(function (res) {
                var permTypes = res.data;
                var empty = {
                    type: '请选择'
                };
                permTypes.unshift(empty);
                utils.generatorDropdown($scope, 'permTypesDropdown', permTypes, empty);
                $rootScope.permTypesDropdown = $scope.permTypesDropdown;
            });
        }

        // bind the history search param to root
        if(!$rootScope.permTypesDropdown) {
            getAllPermTypes();
        }

        // always cache the query role input
        if($rootScope.permQuery) {
            $scope.permQuery = $rootScope.permQuery;
        }
        if($scope.permQuery) {
            $rootScope.permQuery = $scope.permQuery;
        } else {
            $scope.permQuery = {};
            $rootScope.permQuery = $scope.permQuery;
        }
        $scope.pagination = {
            pageSize: constant.pageSize,
            curPage: 1,
            totalCount: 0
        };

        $scope.queryPerm = function () {

            var params = $scope.permQuery;
            if (!params) {
                params = {};
            }
            params.pageNumber = $scope.pagination.curPage - 1;
            params.pageSize = $scope.pagination.pageSize;

            $scope.perms = [];
            $scope.permsLoading = constant.loading;
            if(!$rootScope.loginDomainsDropdown || !$rootScope.loginDomainsDropdown.option || !$rootScope.loginDomainsDropdown.option.id) {
                $location.url('/non-authorized');
            }
            params.domainId = $rootScope.loginDomainsDropdown.option.id;
            if($rootScope.permTypesDropdown && $rootScope.permTypesDropdown.option && $rootScope.permTypesDropdown.option.id) {
                params.permTypeId = $rootScope.permTypesDropdown.option.id;
            } else {
                params.permTypeId = undefined;
            }
            PermService.getPerms(params, function (res) {
                var result = res.data;
                if(res.info) {
                    $scope.permsLoading = constant.loadError;
                    return;
                }
                if(!result || !result.data || !result.data.length) {
                    $scope.permsLoading = constant.loadEmpty;
                    return;
                }

                $scope.permsLoading = '';
                $scope.perms = result.data;

                $scope.pagination.curPage = result.currentPage + 1;
                $scope.pagination.totalCount = result.totalCount;
                $scope.pagination.pageSize = result.pageSize;

            }, function () {
                $scope.perms = [];
                $scope.permsLoading = constant.loadError;
            });
        };

        $scope.queryPerm();
        $scope.navToPermRole = function(perm) {
            //TODO store or replace the selectedRole in role service.
            $state.go('rel.perm--role');
        };
        $scope.launch = function(which, param) {
            switch(which) {
                case 'status':
                    var dlg = dialogs.create('views/common/dialogs/enable-disable.html','EnableDisableController',
                        {
                            "header":param.status?'权限-启用':'权限-禁用',
                            "msg":"您确定要" + (param.status?'启用':'禁用') + "权限: " + param.value + "吗?"
                        }, {size:'md'}
                    );
                    dlg.result.then(function (yes) {
                        PermService.updatePerm(
                            {
                                'id':param.id,
                                'value': param.value,
                                'description': param.description,
                                'permTypeId':param.permTypeId,
                                'domainId':param.domainId,
                                'status':param.status?0:1
                            }
                            , function(res) {
                                // status change successed
                                $scope.queryPerm();
                            }, function(err) {
                                console.log(err);
                            }
                        );
                    }, function (no) {
                        // do nothing
                    });
                    break;
                case 'modify':
                    var dlg = dialogs.create('views/perm/dialogs/modify.html','ModifyPermController',
                        param, {size:'md'}
                    );
                    dlg.result.then(function (close) {
                        $scope.queryPerm();
                    }, function (dismiss) {
                        //
                    });
                    break;
                case 'add':
                    var dlg = dialogs.create('views/perm/dialogs/add.html','AddPermController',
                        {}, {size:'md'}
                    );
                    dlg.result.then(function (close) {
                        $scope.queryPerm();
                    }, function (dismiss) {
                        //
                    });
                    break;
            }
        };
        $scope.$on('selected-domain-changed', $scope.queryPerm);
    };

    return {
        name: "PermController",
        fn: ["$rootScope", "$scope", "$location", "PermService", "dialogs", "$state", Controller]
    };

});
