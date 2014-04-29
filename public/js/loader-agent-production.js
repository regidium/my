var env = 'production';

head.load(
    // Common
    "//cdnjs.cloudflare.com/ajax/libs/jquery/2.10.0/jquery.min.js",
    "//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min.js",
    "//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.1.1/js/bootstrap.min.js",
    "//ajax.googleapis.com/ajax/libs/angularjs/1.2.16/angular.min.js",
    "//ajax.googleapis.com/ajax/libs/angularjs/1.2.16/angular-route.min.js",
    "//ajax.googleapis.com/ajax/libs/angularjs/1.2.16/angular-resource.min.js",
    "//ajax.googleapis.com/ajax/libs/angularjs/1.2.16/angular-cookies.min.js",
    "//cdnjs.cloudflare.com/ajax/libs/angular-ui-bootstrap/0.10.0/ui-bootstrap.min.js",
    "//cdnjs.cloudflare.com/ajax/libs/angular-ui-bootstrap/0.10.0/ui-bootstrap-tpls.min.js",
    "/js/libs/angular/angular-translate/angular-translate.min.js",
    "/js/libs/angular/angular-translate/angular-translate-interpolation-messageformat/angular-translate-interpolation-messageformat.min.js",
    "/js/libs/angular/angular-translate/angular-translate-storage-cookie/angular-translate-storage-cookie.min.js",
    "/js/libs/angular/angular-translate/angular-translate-storage-local/angular-translate-storage-local.min.js",
    "/js/libs/angular/angular-translate/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js",
    "/js/libs/angular/angular-translate/angular-translate-handler-log/angular-translate-handler-log.min.js",
    "/js/libs/ua-parser/ua-parser.min.js",
    "/js/libs/angular/angular-loading-bar/loading-bar.min.js",
    "/js/libs/angular/angular-flash/angular-flash.min.js",
    "/js/libs/angular/angular-underscore/angular-underscore.js",
    "/js/libs/angular/angular-block-ui/angular-block-ui.min.js",
    // Agent
    "/js/app/agent/app.js",
    // Controllers
    "/js/app/agent/controllers/agents.js",
    "/js/app/agent/controllers/chats.js",
    "/js/app/agent/controllers/archives.js",
    "/js/app/agent/controllers/main.js",
    "/js/app/agent/controllers/settings.js",
    "/js/app/agent/controllers/statistics.js",
    "/js/app/agent/controllers/visitors.js",
    //
    "/js/app/main/controllers.js",
    "/js/app/main/directives.js",
    "/js/app/common/config/config.js",
    "/js/app/common/services.js",
    "/js/app/common/directives.js",
    function() {
        console.log("Done loading agent JS");
    }
);