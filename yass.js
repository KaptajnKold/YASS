/*jslint white:false*/
/*global jQuery, window*/

/*
	YASS.js -- Yet Another Slideshow
	Copyright 2011–2012 Adam Lett
	Licenced under the MIT license: http://www.opensource.org/licenses/mit-license.php
	
	Version: 0.0.4
	
	Dependencies:
	* EcmaScript 5
	* jQuery (v1.6 testet)
	* Modernizr. Specifically, the plugin relies on these classes that Modernizr sets on the html tag:
		* touch
		* csstransforms
		* csstransitions
	
	TODO:
	- Plugin should be able to handle multible slideshows.
	- Selectors for the plugins elements should be overridable.
	
*/

;(function ($, win) {
	
	'use strict';
	
	var
		prefixes = 'Webkit Moz O Ms Khtml'.split(' '),
		translatePattern = /-?\d+/, // matches the number part of 'translate(300px)'
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
			disabled: 'yass-disabled',
		},
		
		defaultSelectors = {
			content: '.yass-content',
			noContent: '.yass-no-content',
			viewport: '.yass-viewport',
			next: '.yass-nav-next',
			prev: '.yass-nav-prev',
			nav: 'nav',
			paging: 'ul,ol',
			currentPage: '.yass-current-page',
			totalPages: '.yass-total-pages',
			verticalPaging: '.vertical-paging',
			numberedPaging: '.numbers'
		},
		
		isTouchScreen = $html.hasClass('touch'),
		buttonEvent = isTouchScreen ? 'touchstart' : 'click';
	
	// Source: http://lea.verou.me/2009/02/find-the-vendor-prefix-of-the-current-browser/	
	function getVendorPrefix () {
		var 
			prefixPattern = /^(Moz|Webkit|Khtml|O|ms|Icab)(?=[A-Z])/,
			someScript = document.getElementsByTagName('script')[0],
			prop;

		for(prop in someScript.style) {
			if(prefixPattern.test(prop)) {
				// test is faster than match, so it's better to perform
				// that on the lot and match only when necessary
				return prop.match(prefixPattern)[0];
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
			$currentPage = $(selectors.currentPage),
			$totalPages = $(selectors.totalPages),

			pageLinkHTML = $nav.is(selectors.numberedPaging) ? '<li class="link-to-page">{page}</li>' : '<li class="dot" title="{page}">&nbsp;</li>',
			
			verticalPaging = this.is(selectors.verticalPaging),
			scrollDirection = verticalPaging ? 'top' : 'left',
			size = verticalPaging ? 'height' : 'width',
			translationDirection = verticalPaging ? 'translateY' : 'translateX',
			
			pageSize = $viewport[size](),
			
			methods,
			
			scrollPos = cssTransformsSupported ? function () {
				var 
					style = $content[0].style[cssTransformProperty] || '',
					match = style.match(translatePattern);
					
				return match ? -Number(match[0]): 0;
			} : function () {
				return -parseInt($content[0].style[scrollDirection], 10) || 0;
			},
			
			setScrollPos = cssTransformsSupported ? function (pos) {
				$content.css(cssTransformProperty, translationDirection + '(' + (-pos) + 'px)');
			} : function (pos) {
				$content.css(scrollDirection, -pos);
			};
					
		function pageCount () {
			return $content[size]() / pageSize;
		}

		function currentPage () {
			return scrollPos() / pageSize;
		}

		function updatePaging () {
			var 
				current = Math.ceil(currentPage()) + 1,
				total = Math.ceil(pageCount());
			$('li.current', $nav).removeClass('current');
			$('li:nth-child(' + current + ')', $nav).addClass('current');
			
			$prev.toggleClass(cssClasses.disabled, current === 1);
			$next.toggleClass(cssClasses.disabled, current === total);
			
			$currentPage.text(current);
			$totalPages.text(total);
		}
		
		function scroll (targetPos) {
			var 
				maxScroll = $content[size]() - pageSize,
				pos = scrollPos();
			if (targetPos < 0) {
				targetPos = -Math.round(Math.pow(-targetPos, 4/5));
			} else if ( targetPos > maxScroll) {
				targetPos = maxScroll + Math.round(Math.pow(targetPos - maxScroll, 4/5));
			}
			//targetPos = pos < targetPos ? Math.min( targetPos, $content[size]() - pageSize ) : targetPos;
			if ( pos === targetPos ) { return; }
			setScrollPos(targetPos);
			$yass.trigger('scroll');
		}

		function scrollTo (targetElem) {
			scroll($(targetElem).position()[scrollDirection]);
		}

		function scrollBy (delta) {
			scroll(scrollPos() + delta);
		}

		function scrollIntoView (target) {
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

		function scrollPage (n) {
			var page = Math.round(currentPage() + n);
			if (page < 0) {
				scroll(0);
			} else if (page > pageCount) {
				scroll(page*pageCount);
			} else {
				scroll(page*pageSize);
			}
		}

		function next () {
			scrollPage(1);
		}

		function prev () {
			scrollPage(-1);
		}

		function renderNav () {
			updatePaging();
			if ($pagingLinks.length === 0) { return; }
			var 
				wholePages = Math.ceil(pageCount()),
				pagingHTML = "";
			if (1 < wholePages) {
				wholePages.times(function (i) {
					pagingHTML += pageLinkHTML.supplant({ 'page': i + 1 });
				});
				$pagingLinks.html(pagingHTML);
				$nav.show();
			} else {
				$nav.hide();
			}
		}

		function toggleContentNoContent () {
			$noContent.hide();
			$content.show();
			if ($(':visible', $content).length === 0) {
				$content.hide();
				$noContent.show();
			}
		}

		function refresh () {
			toggleContentNoContent();
			renderNav.apply(this);
			scroll(0);
		}

		function content ($freshContent) {
			$content.empty().append($freshContent).show();
			refresh();
		}
		
		function initTouch () {
			var startX, startY, startScroll, throttleTimer = 0;
			
			function touchStart (e) {
				e.preventDefault();
				$content.css('-webkit-transition-property', 'none');
				startX = e.originalEvent.targetTouches[0].pageX;
				startY = e.originalEvent.targetTouches[0].pageY;
				startScroll = scrollPos();
			}
			function touchMove (e) {
				var now;
				e.preventDefault();
				now = new Date().getTime();
				//if (now - throttleTimer < 10) return; 
				throttleTimer = now;
				var deltaX = startX - e.originalEvent.targetTouches[0].pageX;
				scroll(startScroll + deltaX);
			}
			function touchEnd () {
				$content.css('-webkit-transition-property', '');
				scrollPage(0);
				startX = null;
			}
			$content.bind('touchstart', touchStart);
			$content.bind('touchmove', touchMove);
			$content.bind('touchend', touchEnd);
		}
		
		function initFakeTouch () {
			var startX, startY, startScroll, throttleTimer = 0;
			
			function touchStart (e) {
				e.preventDefault();
				$content.bind('mousemove', touchMove);
				startX = e.pageX;
				startY = e.pageY;
				startScroll = scrollPos();
			}
			function touchMove (e) {
				var now;
				e.preventDefault();
				now = new Date().getTime();
				if (now - throttleTimer < 60) return; 
				throttleTimer = now;
				var deltaX = startX - e.pageX;
				scroll(startScroll + deltaX);
			}
			function touchEnd () {
				$content.unbind('mousemove', touchMove);
				scrollPage(0);
				startX = null;
			}
			
			
			$content.bind('mousedown', touchStart);
			$content.bind('mouseup', touchEnd);
		}

		function init() {
			if (isTouchScreen) {
				initTouch();
			} else {
				initFakeTouch();
			}
			
			$next.bind(buttonEvent, function (e) {
				e.preventDefault();
				next();
			});
			
			$prev.bind(buttonEvent, function (e) {
				e.preventDefault();
				prev();
			});
			
			$nav.delegate('li', buttonEvent, function (e) {
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
