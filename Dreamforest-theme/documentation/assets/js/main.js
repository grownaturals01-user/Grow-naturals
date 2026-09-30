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
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;

            // Much simpler regex that covers modern mobile/tablet devices
            return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent);
        };

        function winSizeWidth() {
            let width = $(window).width(); // use let instead of var
            width = isMobTab ? width : width + 17;
            return width;
        }

        let currentActiveTab = localStorage.getItem('currentActiveTab') ?? null;
        let currentActiveSubTab = localStorage.getItem('currentActiveSubTab') ?? null;

        let isMobTab = mobileAndTabletCheck();
        let screenSize = winSizeWidth();

        let sSize = {
            min: 576,
            max: 992,
        }

            let newPath = window.location.pathname;
            
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
            $("a.page-link").filter(`[href='${newPath}']`).parent().parent().show();
            $("a.page-link").filter(`[href='${newPath}']`).parent().parent().parent().addClass('load-active');
            $("a.page-link").filter(`[href='${newPath}']`).addClass('active-link');

            let currentActiveLnk = $("a.page-link").filter(`[href='${newPath}']`);

            if (currentActiveLnk.length > 0) {
                setgxPagelink($(currentActiveLnk));
            }

           

            //sidebarActiveTabs();

            localStorage.setItem('URL', newPath);
        }

        $(".menu-link").on("click", function (e) {
            let senderElement = e.target;

            if ($(senderElement).hasClass('file-sub-drop-toggle')) return;
            if ($(senderElement).hasClass('page-link')) return;
            if ($(senderElement).hasClass('condense') && $(senderElement).parents('.file-sub-drop-toggle').length > 0) return;

            let parent = $(this).parents('.submenu');
            currentActiveTab = $(parent).find('.menu-link span.condense').text();

            if ($(parent).hasClass('load-active')) {
                $(parent).find(".sidebar-dropdown").slideUp();
                $(parent).removeClass('load-active');
            
                currentActiveTab = '';
                currentActiveSubTab = '';
            
                localStorage.setItem('currentActiveTab', '');
                localStorage.setItem('currentActiveSubTab', '');
                localStorage.setItem('currentSubLink', '');
            } else {
                $('.load-active').removeClass('load-active');
                $(".sidebar-dropdown").slideUp();
                $(parent).addClass('load-active');
                $(parent).find(".sidebar-dropdown").slideDown();
            
                localStorage.setItem('currentActiveTab', currentActiveTab);
                localStorage.setItem('currentSubLink', '');
            }
        });

        $(".file-sub-drop-toggle").on("click", function (e) {

            let parent = $(this).parents('.sb-subdrop-item');
            currentActiveSubTab = $(parent).find('.file-sub-drop-toggle span.condense').text();

            if ($(parent).hasClass('load-sub-active')) {
                $(parent).find(".gx-sb-subdrop").slideUp();
                $(parent).removeClass('load-sub-active');
            
                currentActiveSubTab = '';
            
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

        

        // Change active item
        function doActiveItem(elem, enableScroll = true) {

            let $this = elem,
                elementClicked = $this.attr("href"),
                destination = $(elementClicked).offset().top;
             

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
            let winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            let scrolled = (winScroll / height) * 100;
            $("#scrollProgress").css({
                "width": scrolled + "%"
            });
        }

        // Track which Item we are currently on
        function trackActiveOnScroll() {
            let currentTop = $(window).scrollTop();
            let elems = $('section.hentry');
            elems.each(function (index) {
                let elemTop = $(this).offset().top;
                let elemBottom = elemTop + $(this).height();
                if (currentTop >= (elemTop - 98) && currentTop <= (elemBottom - 30)) {

                    let id = $(this).attr('id'),
                        navElem = $('.sidebar-menu li a[href="#' + id + '"]');

                    $('.sidebar-menu li a').removeClass('active');
                    navElem.addClass('active');

                    toggleCollapse(navElem);

                }
            });
        }

        // Toggles the collapse on and off in the documentation menu
        function toggleCollapse(elem) {

            let hasChildren = elem.parent().hasClass('submenu');

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
        $('.sidebar-menu li a').click(function (e) {
            doActiveItem($(this));
            return false;
        });

        // On scroll events
        $(window).on('scroll', function () {
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
    let sections = $('.page-block')
        , nav = $('nav')
        , nav_height = nav.outerHeight();

    $(window).on('scroll', function () {
        let cur_position = $(this).scrollTop();

        sections.each(function () {
            let top = $(this).offset().top - nav_height,
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
        let $el = $(this)
            , id = $el.attr('href');

        $('html, body').animate({
            scrollTop: $(id).offset().top - nav_height
        }, 50);

        return false;
    });

    /*========== Tools Sidebar ===========*/
    // Mode 
    let $link = $('<link>', {
        rel: 'stylesheet',
        href: 'assets/css/dark.css',
        id: 'dark'
    });
    $('.tools-item.mode').on("click", function () {
        let modes = $(this).attr("data-bs-theme-tool");
        if (modes == "light") {
            $("body").attr("data-bs-theme", "light");
            $('.sidebar').attr('data-mode', 'light');
            $("#dark").remove();
            let headerModes = $(".tools-item.header").attr("data-header-mode");
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
            let headerModes = $(".tools-item.header").attr("data-header-mode");
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
    if ($('.product-container').length > 0) {
        $('.product-container').isotope({
            itemSelector: '.single-new',
            layoutMode: 'fitRows',
        });
    }
    /*-------------------------------
    PORTFOLIO ISOTOPE CLICK FUNC
    ---------------------------------*/
    $('.product-list li').on("click", function (event) {
        $(".product-list li").removeClass("active");
        $(this).addClass("active");
        let selector = $(this).attr('data-filter');
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
    if ($('.feather-icon').length > 0) {
        feather.replace({ width: "18px", height: "18px" });
    }


    // Clipboard functionality for code blocks
    window.copyToClipboard = function (button) {
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
        window.copyToClipboard = function (button) {
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