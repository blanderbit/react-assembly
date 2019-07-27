/*!
 * Soundsuit
 */

(function($) {

  'use strict';

  var App = {

    /**
     * Init
     */
    init: function() {
      App.headerScrolling();
      App.feature();
      App.carousel();
      App.toggle();
      App.cookie();
    },

    /**
     * Settings
     */
    WIN: $(window),
    PAGE: $('html, body'),
    BODY: $('body'),
    header: $('.header'),
    slideshow: $('#slideshow'),
    navSubpage: $('.nav-subpage'),
    scrollItem: $('.scroll-item'),
    isScrolling: false,

    /**
     * Cookie
     */
    cookie: function() {
      var $cookie = $('#cookie'), $cookieBtn = $cookie.find('.cookie-button'), isCookied = Cookies.get('soundsuit-cookie');
      if (typeof isCookied === 'undefined') {
        $cookie.fadeIn(300);
      }
      if ($cookie.length) {
        $cookieBtn.click(function(e) {
          Cookies.set('soundsuit-cookie', 'cookied', { expires: 7 });
          $cookie.fadeOut(300, function() {
            $cookie.remove();
          });
          e.preventDefault();
        });
      }
    },

    /**
     * Header
     */
    headerScrolling: function() {
      App.WIN.on('load scroll', function () {
        var scroll = App.WIN.scrollTop();
        if (scroll >= 50) {
          App.header.addClass('header-scrolling');
          App.navSubpage.addClass('nav-subpage-scrolling');
          App.isScrolling = true;
        } else {
          App.header.removeClass('header-scrolling');
          App.navSubpage.removeClass('nav-subpage-scrolling');
          App.isScrolling = false;
        }
      });
    },

    /**
     * Feature
     */
    feature: function() {

      //scrollToMe
      $.fn.scrollToMe = function (duration) {
        var $element = $(this), headerH = App.header.outerHeight();
        if ($element.length) {
          App.PAGE.stop().animate({scrollTop: $element.offset().top - headerH + 2}, duration, function () {
            var newHeaderH = App.header.outerHeight();
            if (newHeaderH !== headerH) {
              $element.scrollToMe(80);
            }
          });
        }
      };

      /* sectionController */
      $.fn.sectionController = function () {
        var section = $.getURLParam('section'), accordion = $.getURLParam('accordion');
        if (typeof section !== 'undefined'){
          $('#' + section).scrollToMe(800);
        }
        if (typeof accordion !== 'undefined'){
          var cPanelBody = $('#' + accordion), cPanelHeading = cPanelBody.prev(), cPanel = cPanelBody.parent();
          cPanelBody.addClass('in');
          cPanelHeading.find('.panel-title a').removeClass('collapsed');
          cPanel.scrollToMe(800);
        }
      };
      $.fn.sectionController();

      //scrollItem
      if (App.scrollItem.length) {
        App.scrollItem.click(function (e) {
          var elementID = $(this).attr('href');
          if ($(elementID).length) {
            $(elementID).scrollToMe(800);
            App.header.find('.header-menu').removeClass('active');
            e.preventDefault();
          }
        });
      }

      //accordion
      var collapseItem = $('[data-toggle="collapse"]');
      if (collapseItem.length) {
        $('[data-toggle="collapse"]').click(function () {
          var accordionID = $(this).closest('.panel-group').attr('id');
          $('#' + accordionID).on('shown.bs.collapse', function(e) {
            var targetElementT = $(e.target).offset().top, accordionHeaderH = $(e.target).siblings('.panel-heading').height(),
                headerH = App.header.outerHeight(), destination = targetElementT - (accordionHeaderH + headerH);
            if (App.WIN.scrollTop() > destination) {
              App.PAGE.stop().animate({scrollTop: destination}, 600);
            }
          });
        });
      }
    },

    /**
     * Carousel
     */
    carousel: function() {
      //carousel
      var $testimonialCarousel = $('#testimonialCarousel');
      if ($testimonialCarousel.length) {
        $testimonialCarousel.owlCarousel({
          items: 1,
          loop: true,
          smartSpeed: 500
        });
      }

      //control
      var $carouselControl = $('.owl-carousel-control');
      if ($carouselControl.length) {
        $carouselControl.find('a').click(function (e) {
          var $carousel = $($(this).attr('href'));
          if ($carousel.length) {
            if ($(this).attr('class').search('next') >= 0) {
              $carousel.trigger('next.owl.carousel');
            } else {
              $carousel.trigger('prev.owl.carousel');
            }
          }
          e.preventDefault();
        });
      }
    },

    /**
     * Toggle
     */
    toggle: function() {
      var toggle = $('.header-toggle');
      if(toggle.length) {
        toggle.click(function(e) {
          var menu = $('.header-menu');
          menu.toggleClass('active');
          e.preventDefault();
        });
      }
    }

  };

  $(function() {
    App.init();
  });

})(jQuery);
