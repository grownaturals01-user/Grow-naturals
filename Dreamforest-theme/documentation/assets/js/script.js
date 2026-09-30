(function () {
    "use strict";

    // Helper functions for jQuery-like behavior
    function fadeOut(element, duration = 400) {
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    }

    function fadeIn(element, duration = 400) {
        element.style.display = 'block';
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease`;
        setTimeout(() => {
            element.style.opacity = '1';
        }, 10);
    }

    function slideUp(element, duration = 400, callback) {
        // Skip if already hidden
        if (window.getComputedStyle(element).display === 'none') {
            if (callback) callback();
            return;
        }
        // Reset any ongoing animations
        element.style.transition = '';
        element.style.height = element.scrollHeight + 'px';
        element.style.overflow = 'hidden';
        element.style.opacity = '1';
        // Force reflow
        void element.offsetHeight;
        element.style.transition = `height ${duration}ms ease, opacity ${duration}ms ease`;
        element.style.height = '0';
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.display = 'none';
            element.style.height = '';
            element.style.opacity = '';
            element.style.overflow = '';
            element.style.transition = '';
            if (callback) callback();
        }, duration);
    }

    function slideDown(element, duration = 400, callback) {
        // Skip if already visible
        if (window.getComputedStyle(element).display !== 'none') {
            if (callback) callback();
            return;
        }
        // Reset any ongoing animations and show element
        element.style.transition = '';
        element.style.display = 'block';
        element.style.height = '0';
        element.style.overflow = 'hidden';
        element.style.opacity = '0';
        // Force reflow
        var targetHeight = element.scrollHeight;
        void element.offsetHeight;
        element.style.transition = `height ${duration}ms ease, opacity ${duration}ms ease`;
        element.style.height = targetHeight + 'px';
        element.style.opacity = '1';
        setTimeout(() => {
            element.style.height = '';
            element.style.opacity = '';
            element.style.overflow = '';
            element.style.transition = '';
            if (callback) callback();
        }, duration);
    }

    function slideToggle(element, duration = 400) {
        const isHidden = window.getComputedStyle(element).display === 'none';
        if (isHidden) {
            slideDown(element, duration);
        } else {
            slideUp(element, duration);
        }
    }

    function show(element) {
        element.style.display = 'block';
    }

    function hide(element) {
        element.style.display = 'none';
    }

    // Window load handler
    window.addEventListener("load", function () {
        const loader = document.getElementById("loader-wrapper");
        if (loader) fadeOut(loader, 600);
    });

    // Document ready handler
    document.addEventListener("DOMContentLoaded", function () {


        /*========== Sidebar ===========*/
        // mobileAndTabletCheck       
        window.mobileAndTabletCheck = function () {
            return window.matchMedia("(max-width: 992px)").matches || 
                   navigator.maxTouchPoints > 0;
        };

        function winSizeWidth() {
            var width = window.innerWidth;
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

        var newURL = window.location.pathname;
        document.querySelectorAll(".sidebar-dropdown").forEach(el => hide(el));

        if (sSize.max > screenSize) {
            if (sSize.min >= screenSize) {
                document.querySelectorAll(".menu-text:not(.sidebar-dropdown)").forEach(el => hide(el));
            } else {
                document.querySelectorAll(".wrapper").forEach(el => {
                    el.classList.toggle("mini-sidebar");
                    el.classList.toggle("default-sidebar");
                });
                document.querySelectorAll(".menu-text:not(.sidebar-dropdown)").forEach(el => hide(el));
            }
        }
        
        document.querySelectorAll(".wrapper").forEach(wrapper => {
            if (wrapper.classList.contains("default-sidebar")) {
                document.querySelectorAll('.sidebar-dropdown').forEach(el => hide(el));
                document.querySelectorAll("a.page-link").forEach(link => {
                    if (link.getAttribute('href') === newURL) {
                        const parent = link.parentElement.parentElement;
                        if (parent) {
                            show(parent);
                            const grandparent = parent.parentElement;
                            if (grandparent) grandparent.classList.add('load-active');
                        }
                        link.classList.add('active-link');
                    }
                });

                localStorage.setItem('URL', newURL);
            }
        });

        document.querySelectorAll(".menu-link").forEach(link => {
            link.addEventListener("click", function (e) {
                var senderElement = e.target;
                // Ensure we have an Element node
                if (senderElement.nodeType !== 1) senderElement = senderElement.parentElement;
                if (!senderElement) return;

                // Check if clicked on specific elements that should not trigger toggle
                if (senderElement.classList && senderElement.classList.contains('page-link')) return;

                var parent = this.closest('.submenu');
                if (!parent) return;
                
                var menutextSpan = parent.querySelector('.menu-link span.menu-text');
                currentActiveTab = menutextSpan ? menutextSpan.textContent : '';

                if (parent.classList.contains('load-active')) {
                    // Closing current menu - animate close
                    parent.querySelectorAll(".sidebar-dropdown").forEach(el => slideUp(el));
                    parent.classList.remove('load-active');
                    currentSubLink = currentActiveSubTab = currentActiveTab = '';
                    localStorage.setItem('currentActiveTab', '');
                    localStorage.setItem('currentActiveSubTab', '');
                    localStorage.setItem('currentSubLink', '');
                } else {
                    // Opening new menu - instantly hide others, then animate open target
                    document.querySelectorAll('.load-active').forEach(el => el.classList.remove('load-active'));
                    document.querySelectorAll(".sidebar-dropdown").forEach(el => {
                        hide(el);
                        el.classList.remove('show');
                    });
                    parent.classList.add('load-active');
                    parent.querySelectorAll(".sidebar-dropdown").forEach(el => slideDown(el));
                    localStorage.setItem('currentActiveTab', currentActiveTab);
                    currentSubLink = '';
                    localStorage.setItem('currentSubLink', '');
                }
            });
        });

         window.addEventListener("resize", function (e) {
            screenSize = winSizeWidth();
            if (sSize.max >= screenSize) {
                document.querySelectorAll(".wrapper").forEach(wrapper => {
                    if (wrapper.classList.contains("default-sidebar")) {
                        document.querySelectorAll(".sidebar-overlay").forEach(el => fadeOut(el));

                        if (sSize.min <= screenSize) {
                            document.querySelectorAll(".sidebar-toggle").forEach(el => {
                                if (el.classList.contains('active')) el.classList.remove('active');
                            });
                        } else {
                            document.querySelectorAll(".sidebar-toggle").forEach(el => {
                                if (!el.classList.contains('active')) el.classList.add('active');
                            });
                        }

                        wrapper.classList.remove("default-sidebar");
                        wrapper.classList.add('mini-sidebar');

                        document.querySelectorAll(".menu-text:not(.sidebar-dropdown)").forEach(el => hide(el));
                    }
                });
            }
            if (sSize.max < screenSize || sSize.min >= screenSize) {
                document.querySelectorAll(".wrapper").forEach(wrapper => {
                    if (wrapper.classList.contains("mini-sidebar")) {
                        document.querySelectorAll(".sidebar-overlay").forEach(el => fadeOut(el));
                        if (sSize.min >= screenSize) {
                            document.querySelectorAll(".sidebar-toggle").forEach(el => {
                                if (el.classList.contains('active')) el.classList.remove('active');
                            });
                        } else {
                            document.querySelectorAll(".sidebar-toggle").forEach(el => {
                                if (!el.classList.contains('active')) el.classList.add('active');
                            });
                        }

                        wrapper.classList.remove('mini-sidebar');
                        wrapper.classList.add("default-sidebar");
                        document.querySelectorAll(".menu-text:not(.sidebar-dropdown)").forEach(el => show(el));
                    }
                });
            }
        });

        // On click Toggle sidebar collapse
        document.querySelectorAll(".sidebar-toggle").forEach(el => {
            el.addEventListener("click", function (e) {
                screenSize = winSizeWidth();
                if (sSize.max > screenSize) {
                    document.querySelectorAll(".sidebar-overlay").forEach(el2 => fadeIn(el2));
                }
                document.querySelectorAll(".wrapper").forEach(wrapper => {
                    wrapper.classList.toggle("mini-sidebar");
                    wrapper.classList.toggle("default-sidebar");
                });
                this.classList.toggle("active");
                
                const hasDefault = document.querySelector(".wrapper.default-sidebar");
                if (hasDefault) {
                    document.querySelectorAll(".menu-text").forEach(el2 => show(el2));
                    document.querySelectorAll(".sidebar-dropdown").forEach(el2 => hide(el2));
                } else {
                    if (sSize.max < screenSize) {
                        document.querySelectorAll(".menu-text:not(.sidebar-dropdown)").forEach(el2 => hide(el2));
                    } else {
                        document.querySelectorAll(".menu-text:not(.sidebar-dropdown)").forEach(el2 => show(el2));
                        document.querySelectorAll(".menu-text.sidebar-dropdown").forEach(el2 => hide(el2));
                    }
                }
            });
        });

        document.querySelectorAll('.sidebar, .mini-sidebar').forEach(el => {
            el.addEventListener("mouseenter", function (e) {
                screenSize = winSizeWidth();
                if (sSize.max < screenSize) {
                    const wrapper = document.querySelector(".wrapper");
                    if (wrapper && !wrapper.classList.contains("default-sidebar")) {
                        document.querySelectorAll(".menu-text:not(.sidebar-dropdown)").forEach(el2 => show(el2));
                    }
                }
            });
        });


        document.querySelectorAll(".sidebar-overlay").forEach(el => {
            el.addEventListener('click', function (e) {
                document.querySelectorAll(".sidebar-overlay").forEach(el2 => fadeOut(el2));

                document.querySelectorAll(".wrapper").forEach(wrapper => {
                    wrapper.classList.toggle("mini-sidebar");
                    wrapper.classList.toggle("default-sidebar");
                });

                document.querySelectorAll(".menu-text:not(.sidebar-dropdown)").forEach(el2 => hide(el2));

                document.querySelectorAll(".sidebar-toggle").forEach(el2 => el2.classList.remove('active'));
            });
        });

        document.querySelectorAll('.sidebar, .mini-sidebar').forEach(el => {
            el.addEventListener("mouseenter", function (e) {
                screenSize = winSizeWidth();
                if (sSize.max < screenSize) {
                    const wrapper = document.querySelector(".wrapper");
                    if (wrapper && !wrapper.classList.contains("default-sidebar")) {
                        document.querySelectorAll(".menu-text:not(.sidebar-dropdown)").forEach(el2 => show(el2));
                    }
                }
            });
        });

        document.querySelectorAll('.sidebar').forEach(el => {
            el.addEventListener("mouseleave", function (e) {
                screenSize = winSizeWidth();
                if (sSize.max < screenSize) {
                    const wrapper = document.querySelector(".wrapper");
                    if (wrapper && !wrapper.classList.contains("default-sidebar")) {
                        document.querySelectorAll(".menu-text:not(.sidebar-dropdown)").forEach(el2 => hide(el2));
                    }
                }
            });
        });

                
        var darkLink = document.createElement('link');
        darkLink.rel = 'stylesheet';
        darkLink.href = 'assets/css/dark.css';
        darkLink.id = 'dark';


  // Change active item
  function doActiveItem(elem, enableScroll = true) {

    var elementClicked = elem.getAttribute("href");
    if (!elementClicked) return;
    
    var destinationEl = document.querySelector(elementClicked);
    if (!destinationEl) return;
    
    var destination = destinationEl.getBoundingClientRect().top + window.scrollY;

    var parentSubmenu = elem.closest('.submenu');
    var hasActive = false;
    if (parentSubmenu) {
        var activeLink = parentSubmenu.querySelector('.active');
        if (activeLink && activeLink.getAttribute('href') === elementClicked) {
            hasActive = true;
        }
    }

    if (!hasActive) {
      document.querySelectorAll('.sidebar-menu li a').forEach(el => el.classList.remove('active'));
      elem.classList.add('active');

      if (enableScroll == true) {
        window.scrollTo({
            top: destination - 30,
            behavior: 'auto'
        });
      }

      toggleCollapse(elem);
    }

  }

  // Scroll bar progress
  function scrollProgress() {
    var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var scrolled = (winScroll / height) * 100;
    var scrollProgressEl = document.getElementById("scrollProgress");
    if (scrollProgressEl) {
        scrollProgressEl.style.width = scrolled + "%";
    }
  }

  // Track which Item we are currently on
  function trackActiveOnScroll() {
    var currentTop = window.scrollY;
    var elems = document.querySelectorAll('section.doc-section');
    elems.forEach(function(elem, index) {
      var rect = elem.getBoundingClientRect();
      var elemTop = rect.top + window.scrollY;
      var elemBottom = elemTop + rect.height;
      if (currentTop >= (elemTop - 98) && currentTop <= (elemBottom - 30)) {

        var id = elem.getAttribute('id');
        var navElem = document.querySelector('.sidebar-menu li a[href="#' + id + '"]');

        document.querySelectorAll('.sidebar-menu li a').forEach(el => el.classList.remove('active'));
        if (navElem) navElem.classList.add('active');

        if (navElem) toggleCollapse(navElem);

      }
    });
  }

  // Toggles the collapse on and off in the documentation menu
  function toggleCollapse(elem){

    var parent = elem.parentElement;
    var hasChildren = parent ? parent.classList.contains('submenu') : false;

    if (hasChildren) {
        var sibling = elem.nextElementSibling;
        document.querySelectorAll('.sidebar-menu .sidebar-dropdown').forEach(el => {
            if (el !== sibling) slideUp(el);
        });
        if (sibling && sibling.classList.contains('sidebar-dropdown')) {
            slideDown(sibling);
        }
    }

  }

  // Scroll to Menu item section and set Active
  document.querySelectorAll('.sidebar-menu li a').forEach(el => {
    el.addEventListener('click', function(e) {
        e.preventDefault();
        doActiveItem(this);
    });
  });

  // On scroll events
  window.addEventListener('scroll', function() {
    scrollProgress();
    trackActiveOnScroll();
  });

  // Initialize Progress bar on load
  scrollProgress();
		
		
    });

    /*========== Scroll Section to section ===========*/
    var sections = document.querySelectorAll('.page-block');
    var nav = document.querySelector('nav');
    var nav_height = nav ? nav.offsetHeight : 0;

    window.addEventListener('scroll', function () {
        var cur_position = window.scrollY;

        sections.forEach(function (section) {
            var rect = section.getBoundingClientRect();
            var top = rect.top + window.scrollY - nav_height;
            var bottom = top + rect.height;

            if (cur_position >= top && cur_position <= bottom) {
                if (nav) {
                    nav.querySelectorAll('a').forEach(el => el.classList.remove('active'));
                }
                sections.forEach(el => el.classList.remove('active'));

                section.classList.add('active');
                var id = section.getAttribute('id');
                if (nav && id) {
                    var navLink = nav.querySelector('a[href="#' + id + '"]');
                    if (navLink) navLink.classList.add('active');
                }
            }
        });
    });

    if (nav) {
        nav.querySelectorAll('a').forEach(el => {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                var id = this.getAttribute('href');
                if (id) {
                    var target = document.querySelector(id);
                    if (target) {
                        var targetTop = target.getBoundingClientRect().top + window.scrollY - nav_height;
                        window.scrollTo({
                            top: targetTop,
                            behavior: 'auto'
                        });
                    }
                }
            });
        });
    }

    if (document.querySelectorAll('.feather-icon').length > 0 && typeof feather !== 'undefined') {
        feather.replace({width:"16px",height:"16px"});
    }

    
})();