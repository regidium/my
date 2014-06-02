'use strict';

/**
 * @todo Внедрить пагинацию
 * @url "/agent/chats"
 */
function AgentChatsCtrl($rootScope, $scope, $log, $translate, flash, socket, sound, blockUI) {
    var soundChat = sound.init('chat');
    // Определяем блоки блокировки
    var chatsBlockUI = blockUI.instances.get('chatsBlockUI');
    var currentChatBlockUI = blockUI.instances.get('currentChatBlockUI');

    var timeouts = {};

    // Резервируем $scope переменную для списка онлайн чатов
    $scope.chats = {};

    // Запрашиваем список чатов онлайн
    socket.emit('chat:online', { widget_uid: $rootScope.widget.uid });
    // Блокируем ожидающие блоки
    chatsBlockUI.start();

    // Получаем список чатов онлайн
    socket.on('chat:online:list', function(data) {
        $log.debug('Socket chat:online:list', data);

        // Наполняем список чатов онлайн
        angular.forEach(data.chats, function(chat) {
            try {
                chat.current_url = decodeURIComponent(chat.current_url);
                chat.referrer = decodeURIComponent(chat.referrer);
            } catch(e) {
                $log.debug(chat);
            }

            $scope.chats[chat.uid] = chat;
        });

        // Разблокировка ожидающих блоков
        chatsBlockUI.stop(); 
    });

    // Event сервер оповестил о необходимости обновить список пользователей
    socket.on('service:update:users:list', function (data) {
        $log.debug('Socket service:update:users:list');

        // Если агент не ведет беседу
        if (!$scope.current_chat) {
            // Запрашиваем список чатов онлайн
            socket.emit('chat:online', { widget_uid: $rootScope.widget.uid });
            // Блокируем ожидающие блоки
            chatsBlockUI.start();
        }
    });

    // Чат подключен
    /** @todo Фильтруются ли по статусу? */
    socket.on('chat:connected', function (data) {
        $log.debug('Socket chat:connected', data);

        var message = {
            sender_type: $rootScope.c.MESSAGE_SENDER_TYPE_ROBOT,
            readed: true,
            created_at: (+new Date) / 1000,
            text: $translate('User back to site')
        };

        if (data.chat.status == $rootScope.c.CHAT_STATUS_CHATTING) {
            // Добавляем чат в список чатов онлайн
            $scope.chats[data.chat.uid] = data.chat;
        }

        if ($scope.current_chat && $scope.current_chat.uid == data.chat.uid) {
            $scope.current_chat.messages.push(message);
        }

        flash.warn = $translate('Chat connected');
    });

    // Чат отключен
    socket.on('chat:disconnected', function (data) {
        $log.debug('Socket chat:disconnected', data);

        // if ($scope.current_chat && $scope.current_chat.uid == data.chat_uid) {
        //     delete $scope.current_chat.uid;
        // }

        // Удаляем чат из списка чатов онлайн
        //delete $scope.chats[data.chat_uid];

        var message = {
            sender_type: $rootScope.c.MESSAGE_SENDER_TYPE_ROBOT,
            readed: true,
            created_at: (+new Date) / 1000,
            text: $translate('User leave site')
        };

        if ($scope.chats[data.chat_uid]) {
            $scope.chats[data.chat_uid].messages.push(message);
        }

        if ($scope.current_chat && $scope.current_chat.uid == data.chat_uid) {
            // Добавляем сообщение в список сообщений
            $scope.current_chat.messages.push(message);
        }

        flash.warn = $translate('Chat disconnected');
    });

    // Пользователь закрыл чат
    /** @todo */
    socket.on('chat:ended', function (data) {
        $log.debug('Socket chat:ended');
    });

    $scope.selectChat = function(chat) {
        $scope.text = '';
        $scope.current_chat = chat;

        if ($scope.current_chat.current_url) {
            try {
                $scope.current_chat.current_url = decodeURIComponent($scope.current_chat.current_url);
                $scope.current_chat.referrer = decodeURIComponent($scope.current_chat.referrer);
            } catch(e) {
                $log.debug($scope.current_chat);
            }
        }

        // Подключаем агента к чату
        socket.emit('chat:agent:enter', {
            agent: $rootScope.agent,
            chat: $scope.current_chat,
            widget_uid: $rootScope.widget.uid
        });

        // Блокируем ожидающие блоки
        currentChatBlockUI.start();
    };

    $scope.closeChat = function(chat) {
        if ($scope.current_chat && $scope.current_chat.uid == chat.uid) {
            delete $scope.current_chat;
        }

        // Закрываем чат
        socket.emit('chat:close', {
            chat_uid: chat.uid,
            widget_uid: $rootScope.widget.uid
        });

        delete $scope.chats[chat.uid];
    };

    // Чат закрыт
    socket.on('chat:closed', function (data) {
        $log.debug('Socket chat:closed', data);

        if ($scope.chats[data.chat_uid]) {
            delete $scope.chats[data.chat_uid];
        }

        flash.success = $translate('Chat closed');
    });

    // Агент подключен к чату
    socket.on('chat:message:readed:agent', function (data) {
        $log.debug('Socket chat:message:readed:agent', data);

        // Обновляем количество не прочтенных сообщений в кружках
        if ($scope.chats[data.chat_uid]) {
            if ($scope.chats[data.chat_uid].messages[data.message_uid]) {
                $scope.chats[data.chat_uid].messages[data.message_uid].readed = true;
            }
        }
    });

    // Агент подключен к чату
    socket.on('chat:agent:entered', function (data) {
        $log.debug('Socket chat:agent:entered', data);

        if(!$scope.chats[data.chat.uid]) {
            $scope.chats[data.chat.uid] = data.chat;
        }

        // Обновляем количество не прочтенных сообщений в кружках
        if ($scope.chats[data.chat.uid]) {
            angular.forEach($scope.chats[data.chat.uid].messages, function(message, key) {
                if (!message.readed) {
                    message.readed = true;
                }
            });
        }

        // Отсеиваем чужие оповещения
        if (data.agent.uid == $rootScope.agent.uid) {
            try {
                data.chat.current_url = decodeURIComponent(data.chat.current_url);
                data.chat.referrer = decodeURIComponent(data.chat.referrer);
            } catch(e) {
                $log.debug(data.chat);
            }
            $scope.current_chat = data.chat;
            if ($scope.current_chat.messages) {
                angular.forEach($scope.current_chat.messages, function(message, key) {
                    //if (!message.readed) {
                        socket.emit('chat:message:read:agent', {
                            message_uid: message.uid,
                            chat_uid: $scope.current_chat.uid,
                            widget_uid: $rootScope.widget.uid
                        });
                    //}
                });
            }
            // Разблокировка ожидающих блоков
            currentChatBlockUI.stop();
        }
    });

    // Пользователь написал сообщение
    socket.on('chat:message:sended:user', function (data) {
        $log.debug('Chat', 'Socket chat:message:sended:user');

        // Обновляем количество не прочтенных сообщений в кружках
        if ($scope.chats[data.chat_uid]) {
            $scope.chats[data.chat_uid].messages.push(data.message);
        }

        // Отсеиваем чужие оповещения
        if ($scope.current_chat && data.chat_uid == $scope.current_chat.uid) {
            // Проигрываем звуковое уводомление
            soundChat.play();

            if(!$scope.current_chat.messages) {
                $scope.current_chat.messages = [];
            }

            data.message.readed = true;

            // Добавляем сообщение в список сообщений
            $scope.current_chat.messages.push(data.message);

            // Оповещаем слушаталей о прочтении сообщения агентом
            socket.emit('chat:message:read:agent', {
                event_send: true,
                message_uid: data.message.uid,
                chat_uid: data.chat_uid,
                widget_uid: $rootScope.widget.uid
            });

            flash.warn = $translate('User send message');
        }
    });

    socket.on('chat:message:readed:user', function (data) {
        $log.debug('Socket chat:message:readed:user');

        angular.forEach($scope.current_chat.messages, function(message) {
            if (message.uid == data.message_uid) {
                message.readed = true;
            }
        });
    });

    // Изменен URL чата
    socket.on('chat:url:change', function (data) {
        $log.debug('Socket chat:url:change', data);

        if ($scope.chats[data.chat_uid]) {
            $scope.chats[data.chat_uid].current_url = data.new_url;
        }

        if ($scope.current_chat && $scope.current_chat.uid == data.chat_uid) {
            $scope.current_chat.current_url = data.new_url;
        }
    });

    // Изменен Referrer чата
    socket.on('chat:referrer:changed', function (data) {
        $log.debug('Socket chat:referrer:changed', data);

        if ($scope.chats[data.chat_uid]) {
            $scope.chats[data.chat_uid].referrer = data.referrer;
            $scope.chats[data.chat_uid].keywords = data.keywords;
        }

        if ($scope.current_chat && $scope.current_chat.uid == data.chat_uid) {
            $scope.current_chat.referrer = data.referrer;
            $scope.current_chat.keywords = data.keywords;
        }
    });


    $scope.leaveChat = function () {
        if ($scope.current_chat && $scope.current_chat.uid) {
            // Оповещаем слушаталей о выходе агента из чата
            socket.emit('chat:agent:leave', {
                agent: $rootScope.agent,
                chat_uid: $scope.current_chat.uid,
                widget_uid: $rootScope.widget.uid
            });

            delete $scope.current_chat;
        }
    };

    $scope.sendMessage = function () {
        // Блокируем отправку пустых сообщений
        if ($scope.text.length == 0) {
            return false;
        }

        var message = {
            sender_type: $rootScope.c.MESSAGE_SENDER_TYPE_AGENT,
            created_at: (+new Date) / 1000,
            text: $scope.text
        };

        // Оповещаем об отпраке сообщения
        socket.emit('chat:message:send:agent', {
            widget_uid: $rootScope.widget.uid,
            chat_uid: $scope.current_chat.uid,
            message: message
        });

        if (!$scope.current_chat.messages) {
            $scope.current_chat.messages = [];
        }

        // Добавляем сообщение в список сообщений
        $scope.current_chat.messages.push(message);

        // clear message box
        $scope.text = '';
    };

    $scope.getReferrer = function(chat) {
        var referrer = chat.referrer;
        if (referrer.indexOf('google.') != -1) {
            return 'Google';
        } else if (referrer.indexOf('yandex.') != -1) {
            return 'Яндекс';
        } else if (referrer.indexOf('bing.') != -1) {
            return 'Bing';
        } else if (referrer.indexOf('mail.ru') != -1) {
            return 'Mail.ru';
        } else if (referrer.indexOf('rambler.') != -1) {
            return 'Rambler';
        } else {
            return referrer;
        }
    };
}
