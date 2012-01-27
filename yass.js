/*jslint white:false*/
/*global jQuery, window*/

/*
	YASS.js -- Yet Another Slideshow
	by Adam Lett
	
	Version: 0.0.3
	
	Dependencies:
	- jQuery
	- modenizr
	
	TODO:
	- Plugin should be able to handle multible slideshows.
	- Selectors for the plugins elements should be overridable.
	- Use 3D transforms on supported browsers
	
*/

;(function ($, win) {
	'use strict';
	var
		prefixes = 'Webkit Moz O Ms Khtml'.split(' '),
		translatePattern = /\d+/, // matches the number part of 'translate(300px)'
		$html = $('html'),
		cssTransformProperty,
		cssTransitionProperty,
		vendorPrefix,
		cssTransformsSupported = $html.hasClass('csstransforms'),
		cssTransitionsSupported = $html.hasClass('csstransitions'),
		
		transitionEndEvents = {
			Webkit: 'webkitTransitionEnd',
			Moz: 'transitionend',
			O: 'oTransitionEnd',
			Ms: 'msTransitionEnd',
			'': 'transitionend'
		},
		
		transitionEndEvent,
		
		cssClasses = {
			disabled: 'yass-disabled'
		},
		
		defaultSelectors = {
			content: '.yass-content',
			noContent: '.yass-no-content',
			viewport: '.yass-viewport',
			next: '.yass-nav-next',
			prev: '.yass-nav-prev',
			nav: 'nav',
			paging: 'ul,ol'
		};
	
	// Source: http://lea.verou.me/2009/02/find-the-vendor-prefix-of-the-current-browser/	
	function getVendorPrefix()
	{
		var regex = /^(Moz|Webkit|Khtml|O|ms|Icab)(?=[A-Z])/;

		var someScript = document.getElementsByTagName('script')[0];

		for(var prop in someScript.style)
		{
			if(regex.test(prop))
			{
				// test is faster than match, so it's better to perform
				// that on the lot and match only when necessary
				return prop.match(regex)[0];
			}

		}

		// Nothing found so far? Webkit does not enumerate over the CSS properties of the style object.
		// However (prop in style) returns the correct value, so we'll have to test for
		// the precence of a specific property
		if('WebkitOpacity' in someScript.style) return 'Webkit';
		if('KhtmlOpacity' in someScript.style) return 'Khtml';

		return '';
	}
	
	vendorPrefix = getVendorPrefix(),
	cssTransformProperty = vendorPrefix + 'Transform',
	cssTransitionProperty = vendorPrefix + 'Transform',
	transitionEndEvent = transitionEndEvents[vendorPrefix] || transitionEndEvents[''];
	
	
	$.fn.yass = function (method) {
		var 
			//elements
			$yass = this,
			selectors = $.extend({}, defaultSelectors, $.fn.yass.selectors),
			$viewport = $(selectors.viewport, this),
			$content = $(selectors.content, this),
			$noContent = $(selectors.noContent, this),
			$nav = $(selectors.nav, this),
			$pagingLinks = $(selectors.paging, $nav),

			$prev = $(selectors.prev, this),
			$next = $(selectors.next, this),

			pageLinkHTML = $nav.hasClass('numbers') ? '<li class="link-to-page">{page}</li>' : '<li class="dot" title="{page}">&nbsp;</li>',
			scrollDirection = this.hasClass("vertical-paging") ? "top" : "left",
			size = this.hasClass("vertical-paging") ? "height" : "width",
			
			pageSize = $viewport[size](),
			
			methods,
			
			scrollPos = cssTransformsSupported ? function () {
				var 
					style = $content[0].style[cssTransformProperty] || '',
					match = style.match(translatePattern);
				return match ? Number(match[0]): 0;
			} : function () {
				return -parseInt($content[0].style[scrollDirection], 10) || 0;
			},
			
			setScrollPos = cssTransformsSupported ? function (pos) {
				$content.css(cssTransformProperty, 'translateX(' + (-pos) + 'px)');
			} : function (pos) {
				$content.css(scrollDirection, -pos);
			};
					
		function pageCount() {
			return $content[size]() / pageSize;
		}

		function currentPage() {
			return scrollPos() / pageSize;
		}

		function updatePaging() {
			$('li.current', $nav).removeClass('current');
			$('li:nth-child(' + (Math.ceil(currentPage()) + 1) + ')', $nav).addClass("current");
			if (currentPage() === pageCount() - 1) {
				$next.addClass(cssClasses.disabled);
			} else {
				$next.removeClass(cssClasses.disabled);
			}
			if (currentPage() === 0) {
				$prev.addClass(cssClasses.disabled);
			} else {
				$prev.removeClass(cssClasses.disabled);
			}
			
		}
		
		function scroll (targetPos) {
			var pos = scrollPos();
			targetPos = pos < targetPos ? Math.min( targetPos, $content[size]() - pageSize ) : targetPos;
			if ( pos === targetPos ) { return; }
			setScrollPos(targetPos);
			$yass.trigger("scroll");
		}

		function scrollTo(targetElem) {
			scroll($(targetElem).position()[scrollDirection]);
		}

		function scrollBy(delta) {
			scroll(scrollPos() + delta);
		}

		function scrollIntoView(target) {
			var 
				viewportEdge = scrollPos(),
				targetEdge = $(target).position()[scrollDirection],
				delta = targetEdge - viewportEdge;

			// Check left/top edge first
			if (delta < 0) {
				scrollBy(delta);
				return;
			}

			// Check right/bottom edge next
			targetEdge += $(target).outerWidth();
			viewportEdge += pageSize;
			delta = targetEdge - viewportEdge;

			if (0 < delta) {
				scrollBy(delta);
			}
		}

		function scrollPage(n) {
			var page = Math.round(currentPage() + n);
			if (page < 0) {
				scroll(0);
			} else if (page > pageCount) {
				scroll(page*pageCount);
			} else {
				scroll(page*pageSize);
			}
		}

		function next() {
			scrollPage(1);
		}

		function prev() {
			scrollPage(-1);
		}

		function renderNav() {
			if ($pagingLinks.length === 0) { return; }
			var 
				wholePages = Math.ceil(pageCount()),
				pagingHTML = "";
			if (1 < wholePages) {
				wholePages.times(function (i) {
					pagingHTML += pageLinkHTML.supplant({ 'page': i + 1 });
				});
				$pagingLinks.html(pagingHTML);
				updatePaging();
				$nav.show();
			} else {
				$nav.hide();
			}
		}

		function toggleContentNoContent() {
			$noContent.hide();
			$content.show();
			if ($(":visible", $content).length === 0) {
				$content.hide();
				$noContent.show();
			}
		}

		function refresh() {
			toggleContentNoContent();
			renderNav.apply(this);
			scroll(0);
		}

		function content($content) {
			$content.empty().append($content).show();
			refresh();
		}
		
		function initTouch () {
			var 
				startX, startY, startScroll,
				turnOffAnimation = $content.css.bind($content, cssTransitionProperty, 'none'),
				turnOnAnimation = $content.css.bind($content, cssTransitionProperty, '');
			
			function touchStart (e) {
				turnOffAnimation();
				startX = e.originalEvent.targetTouches[0].pageX;
				startY = e.originalEvent.targetTouches[0].pageY;
				startScroll = scrollPos();
			}
			function touchMove (e) {
				var deltaX = startX - e.originalEvent.targetTouches[0].pageX;
				startX = e.originalEvent.targetTouches[0].pageX;
				scrollBy(deltaX);
			}
			function touchEnd () {
				turnOnAnimation();
				if (startX) { scrollPage(0); }
				startX = null;
			}
			$content.bind('touchstart', touchStart);
			$content.bind('touchmove', touchMove);
			$content.bind('touchend', touchEnd);
		}

		function init() {
			initTouch();
			$next.click(function (e) {
				e.preventDefault();
				next();
			});
			$prev.click(function (e) {
				e.preventDefault();
				prev();
			});
			$nav.delegate("li", "click", function (e) {
				scroll($(this).index() * pageSize);
			});
			if (cssTransitionsSupported) {
				$content.bind(transitionEndEvent, updatePaging);
			} else {
				$yass.bind('scroll', updatePaging);
			}
			refresh();
			return this;
		}

		methods = {
			content: content,
			scrollTo: scrollTo,
			scrollIntoView: scrollIntoView,
			prev: prev,
			next: next,
			refresh: refresh
		};

		if (this.length === 0) { return; }
		if (methods[method]) {
			return methods[method].apply(this, [].slice.call(arguments, 1));
		}
		return init.apply(this, arguments);
	};
	
	$.fn.yass.selectors = {};
} (jQuery, window));
