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

    var module = function () {
        this._$navigation = _$(".fos-navigation");
        this._$iconNav = this._$navigation.find(".fos-menu-icon");
        this._$icon = _$(".fos-menu-icon");
        this._$window = _$(window);

        this._$icon.unbind("click").on("click", (function(context){
            return function(event) {
                context.click(event);
            }
        })(this));
    }

    module.prototype = {
        constructor: module,

        init: function () {
            this.delayTransition();
            return this;
        },

        delayTransition: function () {
            var delay = 0.2;
            this._$navigation.find("nav a").each(function() {
                _$(this).css("transition-delay", delay + "s");
                delay += 0.04;
            });
            return this;
        },

        click: function (event) {
            if (this._$icon.hasClass("fos-menu-open")) {
                this._$icon.removeClass("fos-menu-open");
                this._$iconNav.removeClass("fos-menu-open");
                this._$navigation.removeClass("fos-menu-open");
            } else {
                this.positionIconNav(_$(event.target));
                this._$icon.addClass("fos-menu-open");
                this._$iconNav.addClass("fos-menu-open");
                this._$navigation.addClass("fos-menu-open");
            }
            return this;
        },

        positionIconNav: function ($target) {
            this._$iconNav.css("top", $target.offset().top - this._$window.scrollTop() + "px");
            this._$iconNav.css("left", $target.offset().left - this._$window.scrollLeft() + "px");
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


