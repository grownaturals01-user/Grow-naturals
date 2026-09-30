(function ($) {
    "use strict";

    $(window).on("load", function () {
        $("#loader-wrapper").fadeOut("slow");
    });
    $(document).ready(function () {

        $("body").attr("data-bs-theme", "light");

        /*========== Sidebar ===========*/
        // mobileAndTabletCheck       
        window.mobileAndTabletCheck = function () {
            let check = false;
            (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
            return check;
        };

        function winSizeWidth() {
            var width = $(window).width();
            width = isMobTab ? width : width + 17;
            return width;
        }

        var currentActiveTab = localStorage.getItem('currentActiveTab') ?? null;
        var currentActiveSubTab = localStorage.getItem('currentActiveSubTab') ?? null;
        var currentSubLink = localStorage.getItem('currentSubLink') ?? null;

        var isMobTab = mobileAndTabletCheck();
        var screenSize = winSizeWidth();

        var sSize = {
            min: 576,
            max: 992,
        }

        function hideShowSidebar(el, activeEl, className, type) {
            if (sSize.max > screenSize) {
                if (sSize.min >= screenSize) {
                    $(el).show();
                    $(activeEl).addClass(className);
                } else {
                    if ($(".wrapper").hasClass("sb-default")) {
                        if (type == "click") {
                            $(el).show();
                            $(activeEl).addClass(className);
                        } else {
                            $(el).hide();
                            $(activeEl).removeClass(className);
                        }
                    }

                    if ($(".wrapper").hasClass("sb-collapse")) {
                        if (type == "resize" || type == "click") {
                            $(el).hide();
                            $(activeEl).removeClass(className);
                        } else {
                            $(el).show();
                            $(activeEl).addClass(className);
                        }
                    }

                }

            } else {
                if ($(".wrapper").hasClass("sb-default")) {
                    $(el).show();
                    $(activeEl).addClass(className);
                }

                if ($(".wrapper").hasClass("sb-collapse")) {
                    if (type == "mouseenter") {
                        $(el).show();
                        $(activeEl).addClass(className);
                    } else {
                        $(el).hide();
                        $(activeEl).removeClass(className);
                    }

                }
            }
        }

        /*function sidebarActiveTabs(type = '') {
            screenSize = winSizeWidth();
            $(".sidebar-dropdown").hide();
            $(".gx-sb-subdrop.condense").hide();

            if (currentActiveTab != '') {
                var currentActiveEle = $(`span.condense:contains('${currentActiveTab}')`).filter(function () {
                    return $(this).text() === currentActiveTab;
                });
                var activeEl = $(currentActiveEle).parents('.menu-item');
                var dropEl = $(currentActiveEle).parents('.menu-item').find('.sidebar-dropdown');
                hideShowSidebar(dropEl, activeEl, 'load-active', type);
            }

            if (currentActiveSubTab != '') {
                var currentSubTabActiveEle = $(`span.condense:contains('${currentActiveSubTab}')`).filter(function () {
                    return $(this).text() === currentActiveSubTab;
                });
                $(currentSubTabActiveEle).parents('.sb-subdrop-item').find('.gx-sb-subdrop.condense').show();
                var activeEl = $(currentSubTabActiveEle).parents('.sb-subdrop-item');
                var dropEl = $(currentSubTabActiveEle).parents('.sb-subdrop-item').find('.gx-sb-subdrop');
                hideShowSidebar(dropEl, activeEl, 'load-sub-active', type);
            }

            if (currentSubLink != '') {
                var currentSubActiveEle = $(`a.page-link:contains('${currentSubLink}')`).filter(function () {
                    return $(this).text() === currentSubLink;
                });
                $(currentSubActiveEle).addClass('active-link');
                var activeEl = $(currentSubActiveEle).parents('.menu-item');
                var dropEl = $(currentSubActiveEle).parents('.sidebar-dropdown');
                hideShowSidebar(dropEl, activeEl, 'load-active', type);
            }
        }*/

        var newURL = window.location.pathname;
        var newURL = newURL.split("https://maraviyainfotech.com/").pop();
        $(".sidebar-dropdown").hide();

        if (sSize.max > screenSize) {
            if (sSize.min >= screenSize) {

                $(".condense:not(.sidebar-dropdown)").hide();
            } else {
                $(".wrapper").toggleClass("sb-collapse sb-default");

                $(".condense:not(.sidebar-dropdown)").hide();
            }
        }
        if ($(".wrapper").hasClass("sb-default")) {
            $('.sidebar-dropdown').hide();
            $("a.page-link").filter(`[href='${newURL}']`).parent().parent().show();
            $("a.page-link").filter(`[href='${newURL}']`).parent().parent().parent().addClass('load-active');
            $("a.page-link").filter(`[href='${newURL}']`).addClass('active-link');

            var currentActiveLnk = $("a.page-link").filter(`[href='${newURL}']`);

            if (currentActiveLnk.length > 0) {
                setgxPagelink($(currentActiveLnk));
            }

            var lastURL = localStorage.getItem('URL');

            //sidebarActiveTabs();

            localStorage.setItem('URL', newURL);
        }

        $(".menu-link").on("click", function (e) {
            var senderElement = e.target;

            if ($(senderElement).hasClass('file-sub-drop-toggle')) return;
            if ($(senderElement).hasClass('page-link')) return;
            if ($(senderElement).hasClass('condense') && $(senderElement).parents('.file-sub-drop-toggle').length > 0) return;

            var parent = $(this).parents('.submenu');
            currentActiveTab = $(parent).find('.menu-link span.condense').text();

            if ($(parent).hasClass('load-active')) {
                $(parent).find(".sidebar-dropdown").slideUp();
                $(parent).removeClass('load-active');
                currentSubLink = currentActiveSubTab = currentActiveTab = '';
                localStorage.setItem('currentActiveTab', '');
                localStorage.setItem('currentActiveSubTab', '');
                localStorage.setItem('currentSubLink', '');
            } else {
                $('.load-active').removeClass('load-active');
                $(".sidebar-dropdown").slideUp();
                $(parent).addClass('load-active');
                $(parent).find(".sidebar-dropdown").slideDown();
                localStorage.setItem('currentActiveTab', currentActiveTab);
                currentSubLink = '';
                localStorage.setItem('currentSubLink', '');
            }
        });

        $(".file-sub-drop-toggle").on("click", function (e) {
            var senderElement = e.target;

            var parent = $(this).parents('.sb-subdrop-item');
            currentActiveSubTab = $(parent).find('.file-sub-drop-toggle span.condense').text();

            if ($(parent).hasClass('load-sub-active')) {
                $(parent).find(".gx-sb-subdrop").slideUp();
                $(parent).removeClass('load-sub-active');
                currentActiveSubTab = currentSubLink = '';
                localStorage.setItem('currentActiveSubTab', '');
                localStorage.setItem('currentSubLink', '');
            } else {
                $('.load-sub-active').removeClass('load-sub-active');
                $(".gx-sb-subdrop").hide();
                $(parent).addClass('load-sub-active');
                $(parent).find(".gx-sb-subdrop").slideDown();
                localStorage.setItem('currentActiveSubTab', currentActiveSubTab);
            }
        });

        /*function setgxPagelink(_this) {
            $('.active-link').removeClass('active-link');

            currentSubLink = $(_this).text();

            if (currentSubLink != '') {
                localStorage.setItem('currentSubLink', currentSubLink);
            }

            $(_this).addClass('active-link');

            // submenu
            const mainParentHas = $(_this).parents('.submenu');

            if (mainParentHas) {
                currentActiveTab = $(mainParentHas).find('.menu-link span.condense').text();

                localStorage.setItem('currentActiveTab', currentActiveTab);
            }

            // Sub Parent Item
            const subParentHas = $(_this).parents('.sb-subdrop-item');
            if (subParentHas) {
                currentActiveSubTab = $(subParentHas).find('.file-sub-drop-toggle span.condense').text();

                localStorage.setItem('currentActiveSubTab', currentActiveSubTab);
            }
        }

        $(".page-link").on("click", function (e) {
            setgxPagelink($(this));
        });*/

        $(window).resize(function (e) {
            screenSize = winSizeWidth();
            if (sSize.max >= screenSize) {
                if ($(".wrapper").hasClass("sb-default")) {
                    $(".sidebar-overlay").fadeOut();

                    if (sSize.min <= screenSize) {
                        if ($(".sidebar-toggle").hasClass('active')) {
                            $(".sidebar-toggle").removeClass('active');
                        }
                    } else {
                        if (!$(".sidebar-toggle").hasClass('active')) {
                            $(".sidebar-toggle").addClass('active');
                        }
                    }

                    $(".wrapper").removeClass("sb-default").addClass('sb-collapse');

                    $(".condense:not(.sidebar-dropdown)").hide();
                    //sidebarActiveTabs(e.type);
                }
            }
            if (sSize.max < screenSize || sSize.min >= screenSize) {

                if ($(".wrapper").hasClass("sb-collapse")) {
                    $(".sidebar-overlay").fadeOut();
                    if (sSize.min >= screenSize) {
                        if ($(".sidebar-toggle").hasClass('active')) {
                            $(".sidebar-toggle").removeClass('active');
                        }
                    } else {
                        if (!$(".sidebar-toggle").hasClass('active')) {
                            $(".sidebar-toggle").addClass('active');
                        }
                    }

                    $(".wrapper").removeClass('sb-collapse').addClass("sb-default");
                    $(".condense:not(.sidebar-dropdown)").show();
                    //sidebarActiveTabs(e.type);
                }
            }


        });

        $(".sidebar-overlay").on('click', function (e) {
            $(".sidebar-overlay").fadeOut();

            $(".wrapper").toggleClass("sb-collapse sb-default");

            $(".condense:not(.sidebar-dropdown)").hide();

            $(".sidebar-toggle").removeClass('active');

            //sidebarActiveTabs(e.type);
        });

        // On click Toggle sidebar collapse
        $(".sidebar-toggle").on("click", function (e) {
            screenSize = winSizeWidth();
            if (sSize.max > screenSize) {
                $(".sidebar-overlay").fadeIn();
            }
            $(".wrapper").toggleClass("sb-collapse sb-default");
            $(this).toggleClass("active");
            if ($(".wrapper").hasClass("sb-default")) {
                $(".condense").show();
                $(".sidebar-dropdown").hide();

                //sidebarActiveTabs(e.type);

            } else {
                if (sSize.max < screenSize) {
                    $(".condense:not(.sidebar-dropdown)").hide();
                } else {
                    $(".condense:not(.sidebar-dropdown)").show();
                    $(".condense.sidebar-dropdown").hide();
                }
                //sidebarActiveTabs(e.type);
            }

        });
        $('.sidebar, .sb-collapse').on("mouseenter", function (e) {
            screenSize = winSizeWidth();
            if (sSize.max < screenSize) {
                if (!$(".wrapper").hasClass("sb-default")) {
                    $(".condense:not(.sidebar-dropdown)").show();
                }
                //sidebarActiveTabs(e.type);
            }
        });

        $('.sidebar').on("mouseleave", function (e) {
            screenSize = winSizeWidth();
            if (sSize.max < screenSize) {
                if (!$(".wrapper").hasClass("sb-default")) {
                    $(".condense:not(.sidebar-dropdown)").hide();

                }
                //sidebarActiveTabs(e.type);
            }
        });

        /*========== Header tools ===========*/
        /*$(".gx-screen.full").on("click", function () {
            $(this).css("display", "none");
            $(".gx-screen.reset").css("display", "flex");

            // current working methods
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen(
                    Element.ALLOW_KEYBOARD_INPUT
                );
            }
        });
        $(".gx-screen.reset").on("click", function () {
            $(this).css("display", "none");
            $(".gx-screen.full").css("display", "flex");
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        });*/
        var $addLink = $('<link>', {
            rel: 'stylesheet',
            href: 'assets/css/dark.css',
            id: 'dark'
        });

        /* $(".gx-mode.dark").on("click", function () {
            $(this).css("display", "none");
            $(".gx-mode.light").css("display", "flex");

            $("body").attr("data-bs-theme", "dark");
            $(".sidebar").attr("data-mode", "dark");
            $("#mainCss").after($addLink);
            var headerModes = $(".tools-item.header").attr("data-header-mode");
            if (headerModes == "light") {
                $(".tools-item.header[data-header-mode='dark']").addClass("active");
                $(".tools-item.header[data-header-mode='light']").removeClass("active");
                $(".header").attr("data-header-mode-tool", "dark");
            }
            $(".tools-item.mode[data-bs-theme-tool='light']").removeClass("active");
            $(".tools-item.mode[data-bs-theme-tool='dark']").addClass("active");
        });
        $(".gx-mode.light").on("click", function () {
            $(this).css("display", "none");
            $(".gx-mode.dark").css("display", "flex");
            $(".header").attr("data-header-mode-tool", "light");

            $("body").attr("data-bs-theme", "light");
			
            $(".sidebar").attr("data-mode", "light");
            $("#dark").remove();
            var headerModes = $(".tools-item.header").attr("data-header-mode");
            if (headerModes == "light") {
                $(".tools-item.header[data-header-mode='light']").addClass("active");
                $(".tools-item.header[data-header-mode='dark']").removeClass("active");
                $(".header").attr("data-header-mode-tool", "light");
            }
            $(".tools-item.mode[data-bs-theme-tool='dark']").removeClass("active");
            $(".tools-item.mode[data-bs-theme-tool='light']").addClass("active");
        });

        $(".gx-notify").on("click", function () {
            $(".gx-notify-bar").addClass("gx-notify-bar-open");
            $(".gx-notify-bar-overlay").fadeIn();
        });
        $(".gx-notify-bar-overlay, .close-notify").on("click", function () {
            $(".gx-notify-bar").removeClass("gx-notify-bar-open");
            $(".gx-notify-bar-overlay").fadeOut();
        });

        $(".open-search").on("click", function () {
            $(".gx-search").fadeIn();
        }); */

        /*========== Search Remix icon page ===========*/
        /* $('[data-search-icon]').on('keyup', function () {
            var searchVal = $(this).val().toLowerCase();
            var filterItems = $('[data-search-item]');
            var filterItemsText = $('[data-search-item]').text().toLowerCase();
            var a = $('[data-search-item]:contains(' + searchVal + ')');
            if (searchVal != '') {
                filterItems.closest(".remix-unicode-icon").addClass('hide');
                $('[data-search-item]:contains(' + searchVal + ')').closest(".remix-unicode-icon").removeClass('hide');
            } else {
                filterItems.closest(".remix-unicode-icon").removeClass('hide');
            }
        }); */

        /*========== Search Material icon page ===========*/
        /* $('[data-search-material]').on('keyup', function () {
            var searchVal = $(this).val().toLowerCase();
            var filterItems = $('.material-search-item');
            var filterItemsText = $('.material-search-item').text().toLowerCase();
            var a = $('.material-search-item:contains(' + searchVal + ')');
            if (searchVal != '') {
                filterItems.closest(".material-icon-item").addClass('hide');
                $('.material-search-item:contains(' + searchVal + ')').closest(".material-icon-item").removeClass('hide');
            } else {
                filterItems.closest(".material-icon-item").removeClass('hide');
            }
        }); */
		


  // Change active item
  function doActiveItem(elem, enableScroll = true) {

    var $this = elem,
      elementClicked = $this.attr("href"),
      destination = $(elementClicked).offset().top,
      latestActive = $('.sidebar-menu li a.active');

    if ($this.closest('.submenu').find('.active').attr('href') != elementClicked) {

      $('.sidebar-menu li a').removeClass('active');
      $this.addClass('active');

      if (enableScroll == true) {
        $("html, body").animate({
          scrollTop: destination - 30
        }, 0);
      }

      toggleCollapse($this);

    }

  }

  // Scroll bar progress
  function scrollProgress() {
    var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var scrolled = (winScroll / height) * 100;
    $("#scrollProgress").css({
      "width": scrolled + "%"
    });
  }

  // Track which Item we are currently on
  function trackActiveOnScroll() {
    var currentTop = $(window).scrollTop();
    var elems = $('section.hentry');
    elems.each(function(index) {
      var elemTop = $(this).offset().top;
      var elemBottom = elemTop + $(this).height();
      if (currentTop >= (elemTop - 98) && currentTop <= (elemBottom - 30)) {

        var id = $(this).attr('id'),
        navElem = $('.sidebar-menu li a[href="#' + id + '"]');

        $('.sidebar-menu li a').removeClass('active');
        navElem.addClass('active');

        toggleCollapse(navElem);

      }
    });
  }

  // Toggles the collapse on and off in the documentation menu
  function toggleCollapse(elem){

    var hasChildren = elem.parent().hasClass('submenu');

    if (hasChildren) {
      $('.sidebar-menu .sidebar-dropdown').not(elem.next()).slideUp();
      elem.next().slideDown();
    }

  }

  // Gallery
  $('.gallery-thumb').magnificPopup({
    type: 'image',
    gallery: {
      enabled: true
    }
  });

  // Scroll to Menu item section and set Active
  $('.sidebar-menu li a').click(function(e) {
    doActiveItem($(this));
    return false;
  });

  // On scroll events
  $(window).on('scroll', function() {
    scrollProgress();
    trackActiveOnScroll();
  });

  // Initialize Progress bar on load
  scrollProgress();
		
		
    });

    /*========== On ckick card zoom (full screen) ===========*/
    $(".card-maximize").on("click", function () {
        $(this).hide();
        $(this).parent(".header-tools").append('<a href="javascript:void(0)" class="ml-2 card-maximize-close"><i class="fa-solid fa-xmark"></i></a>');
        $(this).closest(".custom-card").parent().toggleClass("full-screen");
        $(this).closest(".custom-card").parent().parent().append('<div class="card-overlay"></div>');
    });
    $("body").on("click", ".card-overlay, .card-maximize-close", function () {
        $(".custom-card").find(".card-maximize-close").remove();
        $(".custom-card").find(".card-maximize").show();
        $(".custom-card").parent().removeClass("full-screen");
        $(".card-overlay").remove();
    });

    /*========== Structure dowpdown ===========*/
    $('.file-hide').slideUp();
    $('.file-drop').on("click", function () {
        $(this).parent("li").children("ul").slideToggle();
        $(this).parent().parent("ul").toggleClass("active");
    });

    /*========== Scroll Section to section ===========*/
    var sections = $('.page-block')
        , nav = $('nav')
        , nav_height = nav.outerHeight();

    $(window).on('scroll', function () {
        var cur_position = $(this).scrollTop();

        sections.each(function () {
            var top = $(this).offset().top - nav_height,
                bottom = top + $(this).outerHeight();

            if (cur_position >= top && cur_position <= bottom) {
                nav.find('a').removeClass('active');
                sections.removeClass('active');

                $(this).addClass('active');
                nav.find('a[href="#' + $(this).attr('id') + '"]').addClass('active');
            }
        });
    });

    nav.find('a').on('click', function () {
        var $el = $(this)
            , id = $el.attr('href');

        $('html, body').animate({
            scrollTop: $(id).offset().top - nav_height
        }, 50);

        return false;
    });

    /*========== Tools Sidebar ===========*/
    // Mode 
    var $link = $('<link>', {
        rel: 'stylesheet',
        href: 'assets/css/dark.css',
        id: 'dark'
    });
    /*$('.tools-item.mode').on("click", function () {
        var modes = $(this).attr("data-bs-theme-tool");
        if (modes == "light") {
            $("body").attr("data-bs-theme", "light");
			$('.sidebar').attr('data-mode', 'light');
            $("#dark").remove();
            $(".tools-item.header[data-header-mode='light']").remove();
            if (headerModes == "light") {
                $(".tools-item.header[data-header-mode='light']").addClass("active");
                $(".tools-item.header[data-header-mode='dark']").removeClass("active");
                $(".header").attr("data-header-mode-tool", "light");
            }
            $(".gx-mode.light").css("display", "none");
            $(".gx-mode.dark").css("display", "flex");

        } else if (modes == "dark") {
            $("body").attr("data-bs-theme", "dark");
				$('.sidebar').attr('data-mode', 'dark');
            $("#mainCss").after($link);
            var headerModes = $(".tools-item.header").attr("data-header-mode");
            if (headerModes == "light") {
                $(".tools-item.header[data-header-mode='dark']").addClass("active");
                $(".tools-item.header[data-header-mode='light']").removeClass("active");
                $(".header").attr("data-header-mode-tool", "dark");
            }
            $(".gx-mode.dark").css("display", "none");
            $(".gx-mode.light").css("display", "flex");
        }

        $(this).parents(".gx-tools-info").find('.tools-item.mode').removeClass("active")
        $(this).addClass("active");
    });*/
    $('.tools-item.mode').on("click", function () {
        var modes = $(this).attr("data-bs-theme-tool");
        if (modes == "light") {
            $("body").attr("data-bs-theme", "light");
			$('.sidebar').attr('data-mode', 'light');
            $("#dark").remove();
            var headerModes = $(".tools-item.header").attr("data-header-mode");
            if (headerModes == "light") {
                $(".tools-item.header[data-header-mode='light']").addClass("active");
                $(".tools-item.header[data-header-mode='dark']").removeClass("active");
                $(".header").attr("data-header-mode-tool", "light");
				$('.sidebar').attr('data-mode', 'light');
            }
            $(".gx-mode.light").css("display", "none");
            $(".gx-mode.dark").css("display", "flex");

        } else if (modes == "dark") {
            $("body").attr("data-bs-theme", "dark");
			$('.sidebar').attr('data-mode', 'dark');
            $("#mainCss").after($link);
            var headerModes = $(".tools-item.header").attr("data-header-mode");
            if (headerModes == "light") {
                $(".tools-item.header[data-header-mode='dark']").addClass("active");
                $(".tools-item.header[data-header-mode='light']").removeClass("active");
                $(".header").attr("data-header-mode-tool", "dark");
				$('.sidebar').attr('data-mode', 'dark');
            }
            $(".gx-mode.dark").css("display", "none");
            $(".gx-mode.light").css("display", "flex");
        }

        $(this).addClass("active");
    });

	
        /*-------------------------------
        NEW-PRODUCT SECTION ISOTOPE
        ---------------------------------*/
		if( $('.product-container').length > 0 ){
			$('.product-container').isotope({
				itemSelector: '.single-new',
				layoutMode: 'fitRows',
			});
		}
        /*-------------------------------
        PORTFOLIO ISOTOPE CLICK FUNC
        ---------------------------------*/
        $('.product-list li').on("click", function(event) {
            $(".product-list li").removeClass("active");
            $(this).addClass("active");
            var selector = $(this).attr('data-filter');
            $(".product-container").isotope({
                filter: selector,
                animationOptions: {
                    duration: 750,
                    easing: 'linear',
                    queue: false,
                }
            });
            return false;
        });
		
	    /* $('.light-dark-mode').on("click", function (e) {
            e.preventDefault();
            $('body').toggleClass('fullscreen-enable');
        }); */
		
		/* Feather Icon */
		if( $('.feather-icon').length > 0 ){
			feather.replace({width:"18px",height:"18px"});
		}
		
		/* File Structure Interactivity */
		$(document).on('click', '.folder-item', function(e) {
			e.preventDefault();
			e.stopPropagation();
			
			var $this = $(this);
			// Find all sub-structures that belong to this folder (until the next folder-item)
			var $nextFolderItem = $this.nextAll('.folder-item').first();
			var $subStructures;
			if ($nextFolderItem.length) {
				$subStructures = $this.nextAll('.sub-structure').not($nextFolderItem.nextAll('.sub-structure'));
			} else {
				$subStructures = $this.nextAll('.sub-structure');
			}
			
			console.log('Folder clicked:', $this.text().trim());
			console.log('Sub structures found:', $subStructures.length);
			
			// Toggle expanded state
			$this.toggleClass('expanded');
			
			// Toggle chevron icon
			var $chevron = $this.find('.fa-chevron-right, .fa-chevron-down');
			if ($chevron.hasClass('fa-chevron-right')) {
				$chevron.removeClass('fa-chevron-right').addClass('fa-chevron-down');
			} else {
				$chevron.removeClass('fa-chevron-down').addClass('fa-chevron-right');
			}
			
			// Toggle folder icon
			var $folderIcon = $this.find('.fa-folder, .fa-folder-open');
			if ($folderIcon.hasClass('fa-folder')) {
				$folderIcon.removeClass('fa-folder').addClass('fa-folder-open');
			} else {
				$folderIcon.removeClass('fa-folder-open').addClass('fa-folder');
			}
			
			// Animate sub-structures
			if ($subStructures.length) {
				if ($this.hasClass('expanded')) {
					console.log('Expanding folder');
					// Show all sub-structures that belong to this folder
					$subStructures.each(function() {
						$(this).slideDown(200).addClass('show');
					});
				} else {
					console.log('Collapsing folder');
					// When collapsing, recursively hide all nested sub-structures and reset their states
					function collapseAllNested($container) {
						$container.find('.sub-structure').each(function() {
							var $nestedSub = $(this);
							console.log('Collapsing nested structure');
							$nestedSub.slideUp(200, function() {
								// Ensure the show class is removed after animation completes
								$nestedSub.removeClass('show');
								// Force hide to ensure CSS rule is applied
								$nestedSub.hide();
							});
							
							// Reset all folder items within this nested structure
							$nestedSub.find('.folder-item').removeClass('expanded');
							$nestedSub.find('.fa-chevron-down').removeClass('fa-chevron-down').addClass('fa-chevron-right');
							$nestedSub.find('.fa-folder-open').removeClass('fa-folder-open').addClass('fa-folder');
							
							// Recursively collapse nested structures
							collapseAllNested($nestedSub);
						});
					}
					
					// Start the recursive collapse from all sub-structures
					$subStructures.each(function() {
						var $subStructure = $(this);
						collapseAllNested($subStructure);
						$subStructure.slideUp(200, function() {
							// Ensure the show class is removed after animation completes
							$subStructure.removeClass('show');
							// Force hide to ensure CSS rule is applied
							$subStructure.hide();
						});
					});
				}
			}
		});
		
		// Initialize file structure - expand root by default
		$('.root-item .folder-item').first().addClass('expanded');
		$('.root-item .sub-structure').first().show().addClass('show');
		
		// Ensure all other sub-structures are hidden by default
		$('.sub-structure').not('.root-item .sub-structure').hide().removeClass('show');
		console.log('File structure initialized');
		
		// Add hover effects for file items
		$(document).on('mouseenter', '.file-item', function() {
			$(this).addClass('hover');
		}).on('mouseleave', '.file-item', function() {
			$(this).removeClass('hover');
		});
		
		// Add click effects for folder items
		$(document).on('mousedown', '.folder-item', function() {
			$(this).addClass('clicked');
		}).on('mouseup mouseleave', '.folder-item', function() {
			$(this).removeClass('clicked');
		});

		// Function to detect and mark single-line code blocks
		function markSingleLineCodeBlocks() {
			// Find all code elements
			const codeElements = document.querySelectorAll('code');
			
			codeElements.forEach(code => {
				// Get the text content and trim whitespace
				const text = code.textContent.trim();
				
				// Check if it's a single line (no line breaks and reasonable length)
				if (text && !text.includes('\n') && text.length < 100) {
					// Add class for single-line code
					code.classList.add('single-line-code');
				}
			});
		}

		// Clipboard functionality for code blocks
		window.copyToClipboard = function(button) {
			console.log('Copy button clicked!');
			
			// Get the parent element (code or pre)
			const parentElement = button.parentElement;
			let codeText = '';
			
			// Handle both code and pre elements
			if (parentElement.tagName === 'CODE') {
				codeText = parentElement.textContent.trim();
			} else if (parentElement.tagName === 'PRE') {
				// For pre elements, get the text from the code element inside
				const codeElement = parentElement.querySelector('code');
				if (codeElement) {
					codeText = codeElement.textContent.trim();
				} else {
					codeText = parentElement.textContent.trim();
				}
			}
			
			console.log('Code text to copy:', codeText);

			// Create a temporary textarea to copy the text
			const textarea = document.createElement('textarea');
			textarea.value = codeText;
			document.body.appendChild(textarea);
			textarea.select();

			try {
				// Copy the text
				document.execCommand('copy');
				console.log('Copy successful!');

				// Show success feedback
				const originalText = button.innerHTML;
				button.innerHTML = '<i class="fas fa-check"></i>';
				button.style.background = '#28a745';
				button.style.color = 'white';
				button.style.borderColor = '#28a745';

				// Reset after 2 seconds
				setTimeout(() => {
					button.innerHTML = originalText;
					button.style.background = '';
					button.style.color = '';
					button.style.borderColor = '';
				}, 2000);

			} catch (err) {
				console.error('Failed to copy: ', err);

				// Show error feedback
				const originalText = button.innerHTML;
				button.innerHTML = '<i class="fas fa-times"></i>';
				button.style.background = '#dc3545';
				button.style.color = 'white';
				button.style.borderColor = '#dc3545';

				// Reset after 2 seconds
				setTimeout(() => {
					button.innerHTML = originalText;
					button.style.background = '';
					button.style.color = '';
					button.style.borderColor = '';
				}, 2000);
			}
			// Clean up
			document.body.removeChild(textarea);
		};

		// Modern clipboard API fallback
		if (navigator.clipboard) {
			window.copyToClipboard = function(button) {
				const parentElement = button.parentElement;
				let codeText = '';
				
				// Handle both code and pre elements
				if (parentElement.tagName === 'CODE') {
					codeText = parentElement.textContent.trim();
				} else if (parentElement.tagName === 'PRE') {
					// For pre elements, get the text from the code element inside
					const codeElement = parentElement.querySelector('code');
					if (codeElement) {
						codeText = codeElement.textContent.trim();
					} else {
						codeText = parentElement.textContent.trim();
					}
				}

				navigator.clipboard.writeText(codeText).then(() => {
					// Show success feedback
					const originalText = button.innerHTML;
					button.innerHTML = '<i class="fas fa-check"></i>';
					button.style.background = '#28a745';
					button.style.color = 'white';
					button.style.borderColor = '#28a745';

					// Reset after 2 seconds
					setTimeout(() => {
						button.innerHTML = originalText;
						button.style.background = '';
						button.style.color = '';
						button.style.borderColor = '';
					}, 2000);
				}).catch(err => {
					console.error('Failed to copy: ', err);

					// Show error feedback
					const originalText = button.innerHTML;
					button.innerHTML = '<i class="fas fa-times"></i>';
					button.style.background = '#dc3545';
					button.style.color = 'white';
					button.style.borderColor = '#dc3545';

					// Reset after 2 seconds
					setTimeout(() => {
						button.innerHTML = originalText;
						button.style.background = '';
						button.style.color = '';
						button.style.borderColor = '';
					}, 2000);
				});
			};
		}
		
	
})(jQuery);