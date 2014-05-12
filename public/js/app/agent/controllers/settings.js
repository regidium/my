'use strict';

/**
 * @url "/agent/settings"
 */
function AgentSettingsCtrl($scope) {
}

/**
 * @url "/agent/settings/widget"
 */
function AgentSettingsWidgetCtrl($scope) {
}

/**
 * @url "/agent/widget/style"
 */
function AgentSettingsWidgetStyleCtrl($rootScope, $scope, $http, $fileUploader, socket, blockUI) {
    $scope.settings = {};
    $scope.current_menu = 'style';
    // Определяем блоки блокировки
    var styleBlockUI = blockUI.instances.get('styleBlockUI');
    var menuBlockUI = blockUI.instances.get('menuBlockUI');

    // Делаем запрос информации о виджете
    socket.emit('widget:info:get', { widget_uid: $rootScope.widget.uid });

    // Блокируем ожидающие блоки
    styleBlockUI.start();
    menuBlockUI.start();

    // Event сервер прислала информацию о виджете
    socket.on('widget:info:sended', function(data) {
        $scope.settings = data.settings;

        // Разблокировка ожидающих блоков
        styleBlockUI.stop(); 
        menuBlockUI.stop(); 
    });

    // Настройки стялей виджета изменены
    socket.on('widget:setting:style:edited', function(data) {
        $scope.settings = data.settings;
    });

    // Определяем загрузчик файлов
    var uploader = $scope.uploader = $fileUploader.create({
        queueLimit: 1,
        autoUpload: true,
        removeAfterUpload: true,
        scope: $scope,
        url: $rootScope.config.fsUrl + 'upload/' + $rootScope.widget.uid + '/widget/logo',
        filters: [
            function(item) {
                var type = uploader.isHTML5 ? item.type : '/' + item.value.slice(item.value.lastIndexOf('.') + 1);
                type = '|' + type.toLowerCase().slice(type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        ]
    });

    // Добавляем обрабочик загрузки файла
    uploader.bind('success', function (event, xhr, item, response) {
        if (response && response.url) {
            $scope.settings.company_logo = response.url;
        }
    });

    $scope.removeLogo = function() {
        $http.delete($rootScope.config.fsUrl + $rootScope.widget.uid)
            .success(function(data, status, headers, config) {
                if (data && data.success) {
                    $scope.settings.company_logo = '';
                } else if (data && data.errors) {
                    $log.debug(data.errors);
                    flash.error = data.errors;
                } else {
                    $log.debug(data);
                    flash.error = 'System error!';
                }
            }).error(function(data, status, headers, config) {
                if (data && data.errors) {
                    $log.debug(data.errors);
                    flash.error = data.errors;
                } else {
                    $log.debug('System error!');
                    flash.error = 'System error!';
                }
        });
    }

    $scope.submit = function() {
        // Сохраняем настройки
        socket.emit('widget:setting:style:edit', { settings: $scope.settings, widget_uid: $rootScope.widget.uid });
    };
}

/**
 * @url "/agent/widget/code"
 */
function AgentSettingsWidgetCodeCtrl($rootScope, $scope) {
    $scope.widget_uid = $rootScope.widget.uid;
    $scope.current_menu = 'code';
}

/**
 * @todo Делать запрос в платежную систему, по возврату зачислять оплату и выводить страницу выбора плана
 * @url "/agent/widget/pay"
 */
function AgentSettingsWidgetPayCtrl($rootScope, $scope, $location, socket) {
    $scope.pay = {};
    $scope.current_menu = 'pay';

    $scope.submit = function() {
        alert('В этом месте будет редирект на систему online оплаты. При положительном ответе, оплаченная сумма будет внесена на счет клиента');

        socket.emit('widget:payment:made', { pay: $scope.pay, widget_uid: $rootScope.widget.uid });

        $location.path('/agent/settings/widget');
    }
}

/**
 * @url "/agent/widget/plan"
 */
function AgentSettingsWidgetPlanCtrl($rootScope, $scope, $location, socket) {
    $scope.plan = $rootScope.widget.plan;
    $scope.current_menu = 'plan';

    $scope.submit = function() {
        socket.emit('widget:plan:change', { plan: $scope.plan, widget_uid: $rootScope.widget.uid });

        $location.path('/agent/settings/widget');
    }
}

/**
 * @url "/agent/widget/triggers"
 */
function AgentSettingsWidgetTriggersCtrl($rootScope, $scope, socket, blockUI) {
    // Определяем блоки блокировки
    var triggerBlockUI = blockUI.instances.get('triggerBlockUI');
    var menuBlockUI = blockUI.instances.get('menuBlockUI');

    // Делаем запрос информации о виджете
    socket.emit('widget:info:get', { widget_uid: $rootScope.widget.uid });

    // Блокируем ожидающие блоки
    triggerBlockUI.start();
    menuBlockUI.start();

    // Event сервер прислала информацию о виджете
    socket.on('widget:info:sended', function(data) {
        $scope.triggers = data.triggers;

        // Разблокировка ожидающих блоков
        triggerBlockUI.stop(); 
        menuBlockUI.stop(); 
    })

    // Настройки триггеров виджета изменены
    socket.on('widget:setting:triggers:edited', function(data) {
        var exists = false;
        var triggers = [];

        angular.forEach($scope.triggers, function(trigger) {
            if (trigger.uid == data.trigger.uid) {
                trigger = data.trigger;
                this.push(trigger)
                exists = true;
            }
        }, triggers);
        $scope.triggers = triggers;

        if (exists == false) {
            $scope.triggers.push(data.trigger);
        }
    })

    // Триггер удален
    socket.on('widget:setting:triggers:removed', function(data) {
        angular.forEach($scope.triggers, function(trigger) {
            if (trigger.uid == data.trigger_uid) {
                $scope.triggers.splice($scope.triggers.indexOf(trigger), 1);
            }
        });

        if ($scope.current_trigger && $scope.current_trigger.uid == data.trigger_uid) {
            delete $scope.current_trigger;
        }
    })

    /** @todo Избавится от new */
    $scope.submit = function() {
        var uid = $scope.current_trigger.uid;
        if (!uid) {
            uid = 'new';
        }

        var trigger = {
            uid: uid,
            name: $scope.current_trigger.name,
            priority: $scope.current_trigger.priority,
            event: $scope.current_trigger.event,
            event_params: $scope.current_trigger.event_params,
            result: $scope.current_trigger.result,
            result_params: $scope.current_trigger.result_params
        }
        
        // Сохраняем триггер
        socket.emit('widget:setting:triggers:edit', { trigger: trigger, widget_uid: $rootScope.widget.uid });

        // Добавляем новый триггер в список триггеров
        // if (trigger_uid == 'new') {
        //     $scope.triggers.push(trigger);
        // }

        delete $scope.current_trigger;
    }

    $scope.remove = function() {
        // Удаляем триггер
        socket.emit('widget:setting:triggers:remove', { trigger_uid: $scope.current_trigger.uid, widget_uid: $rootScope.widget.uid });

        $scope.triggers.splice($scope.triggers.indexOf($scope.current_trigger), 1);
        delete $scope.current_trigger;
    }

    $scope.events = {
        1: {name: 'WIDGET CREATED', param: false },
        2: {name: 'WORD SEND', param: true },
        3: {name: 'TIME ONE PAGE', param: true },
        4: {name: 'VISIT PAGE', param: true },
        5: {name: 'VISIT FROM URL', param: true },
        6: {name: 'VISIT FROM KEYWORD', param: true },
        7: {name: 'WIDGET OPENED', param: false },
        8: {name: 'WIDGET CLOSED', param: false },
        9: {name: 'MESSAGE START', param: false },
        10: {name: 'MESSAGE SEND', param: false }
    };

    $scope.results = {
        1: {name: 'SEND MESSAGE', param: true },
        2: {name: 'ALERT OPERATORS', param: false },
        3: {name: 'OPEN WIDGET', param: false },
        4: {name: 'BELL WIDGET', param: false }
    };
    // $scope.events = {
    //     $rootScope.c.TRIGGER_EVENT_WIDGET_CREATED: {name: 'WIDGET CREATED', param: false },
    //     $rootScope.c.TRIGGER_EVENT_WORD_SEND: {name: 'WORD SEND', param: true },
    //     $rootScope.c.TRIGGER_EVENT_TIME_ONE_PAGE: {name: 'TIME ONE PAGE', param: true },
    //     $rootScope.c.TRIGGER_EVENT_VISIT_PAGE: {name: 'VISIT PAGE', param: true },
    //     $rootScope.c.TRIGGER_EVENT_VISIT_FROM_URL: {name: 'VISIT FROM URL', param: true },
    //     $rootScope.c.TRIGGER_EVENT_VISIT_FROM_KEY_WORD: {name: 'VISIT FROM KEYWORD', param: true },
    //     $rootScope.c.TRIGGER_EVENT_CHAT_OPENED: {name: 'WIDGET OPENED', param: false },
    //     $rootScope.c.TRIGGER_EVENT_CHAT_CLOSED: {name: 'WIDGET CLOSED', param: false },
    //     $rootScope.c.TRIGGER_EVENT_MESSAGE_START: {name: 'MESSAGE START', param: false },
    //     $rootScope.c.TRIGGER_EVENT_MESSAGE_SEND: {name: 'MESSAGE SEND', param: false }
    // };

    // $scope.results = {
    //     $rootScope.c.TRIGGER_RESULT_MESSAGE_SEND: {name: 'SEND MESSAGE', param: true },
    //     $rootScope.c.TRIGGER_RESULT_AGENTS_ALERT: {name: 'ALERT OPERATORS', param: false },
    //     $rootScope.c.TRIGGER_RESULT_WIDGET_OPEN: {name: 'OPEN WIDGET', param: false },
    //     $rootScope.c.TRIGGER_RESULT_WIDGET_BELL: {name: 'BELL WIDGET', param: false }
    // };

    $scope.new = function() {
        $scope.current_trigger = {};
    }

    $scope.select = function(trigger) {
        $scope.current_trigger = trigger;
    }

    $scope.close = function() {
        delete $scope.current_trigger;
    }
}

/**
 * @todo
 * @url "/agent/settings/productivity"
 */
function AgentSettingsProductivityCtrl($scope) {
}