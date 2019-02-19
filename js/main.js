"use strict";

/**
 * Golbal namespace for Fahim on Software.
 */
if (typeof FOS === "undefined") {
    var FOS = {};
}


/**
 * The navigation module.
 */
(function (_fos, _$) {

    var hideScrollFor = function ($element) {
            $element.data("overflow", $element.css("overflow"));
            $element.css("overflow", "hidden");
        },

        showScrollFor = function ($element) {
            $element.css("overflow", $element.data("overflow"));
        }

    var module = function () {
        this._$container = _$(".fos-container");
        this._$navigation = _$(".fos-navigation");
        this._$wrapper = _$(".fos-navigation__wrapper");
        this._$icon = _$(".fos-menu-icon");
        this._$window = _$(window);
        this._$body = _$("body");
        this._$html = _$("html");

        this._$icon.unbind("click").on("click", (function(context){
            return function() {
                context.click();
            }
        })(this));

        this._$window.unbind().on("resize", (function(context){
            return function() {
                context.init();
            }
        })(this));
    }

    module.prototype = {
        constructor: module,

        init: function () {
            this._$navigation.css("top", parseFloat(this._$container.css("margin-top")) + parseFloat($("body")
                             .css("border-top-width")) + "px")
                             .css("left", this._$container.css("margin-right"))
            this._$wrapper.height(this.calcHeight());
            this.delayTransition();
            return this;
        },

        delayTransition: function () {
            var delay = 0;
            this._$navigation.find("nav a").each(function() {
                _$(this).css("transition-delay", delay + "s");
                delay += 0.04;
            });
            return this;
        },

        click: function () {
            if (this._$icon.hasClass("fos-menu-open")) {
                this._$icon.removeClass("fos-menu-open");
                this._$container.removeClass("fos-menu-open");
                this._$navigation.removeClass("fos-menu-open");
                this.showScroll();
            } else {
                this._$wrapper.height(this.calcHeight());
                this._$icon.addClass("fos-menu-open");
                this._$container.addClass("fos-menu-open")
                this._$navigation.addClass("fos-menu-open");
                this.hideScroll();
            }

            return this;
        },

        calcHeight: function () {
            return this._$window.height() - this._$wrapper.offset().top + this._$window.scrollTop() - 7;
        },

        hideScroll: function () {
            hideScrollFor(this._$html);
            hideScrollFor(this._$body);
            return this;
        },
    
        showScroll: function () {
            showScrollFor(this._$html);
            showScrollFor(this._$body);
            return this;
        }
    }
 
    _fos.navigation = new module(); 
})(FOS, $);


/**
 * Console logger.
 */
(function(_fos){

    var message = 
            "______    _     _                           _____        __ _                          " +
            "\n|  ___|  | |   (_)                         /  ___|      / _| |                         " +
            "\n| |_ __ _| |__  _ _ __ ___     ___  _ __   \\ `--.  ___ | |_| |___      ____ _ _ __ ___ " +
            "\n|  _/ _` | '_ \\| | '_ ` _ \\   / _ \\| '_ \\   `--. \\/ _ \\|  _| __\\ \\ /\\ / / _` | '__/ _ \\" +
            "\n| || (_| | | | | | | | | | | | (_) | | | | /\\__/ / (_) | | | |_ \\ V  V / (_| | | |  __/" +
            "\n\\_| \\__,_|_| |_|_|_| |_| |_|  \\___/|_| |_| \\____/ \\___/|_|  \\__| \\_/\\_/ \\__,_|_|  \\___|" +
            "\n                                                                                       " +
            "\n\n\nA bug or a suggestion? fahim@fahimfarook.me please.";

    _fos.log = function () {
        if (!console || !console.info) {
            return;
        }
        console.info(message);
    }
})(FOS)

// jQuery document.ready
$(function () {
    FOS.navigation.init();
    FOS.log();
});


