/*jslint white:false*/
/*global jQuery, window*/

/*
	YASS.js -- Yet Another Slideshow
	================================
	
	Copyright 2011–2012 Adam Lett
	License: MIT http://www.opensource.org/licenses/mit-license.php
	
	Version: 0.2.1
	
	Dependencies:
	-------------
	
	* EcmaScript 5
	
	* jQuery (v1.6 testet)
	
	* Modernizr. Specifically, the plugin relies on these classes that Modernizr sets on the html tag:
		
		* touch
		* csstransforms
		* csstransitions
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
	
	function throttle (fn, context) {
		var lastInvocation = 0, threshold = 10;
		return function () {
			var now = new Date().getTime();
			if (now - lastInvocation > threshold) {
				return fn.apply(context, arguments);
			}
		}
	}
	
	vendorPrefix = getVendorPrefix(),
	cssTransformProperty = vendorPrefix + 'Transform',
	cssTransitionProperty = vendorPrefix + 'Transform',
	transitionEndEvent = transitionEndEvents[vendorPrefix] || transitionEndEvents[''];
	
	function Yass (el, options) {
		
		/*
			options:
			
			* selectors
		*/
		options || (options = {});
		
		var 
			//elements
			$el = $(el),
			selectors = $.extend({}, defaultSelectors, $.fn.yass.selectors, (options.selectors || {})),
			$viewport = $(selectors.viewport, $el),
			$content = $(selectors.content, $el),
			$noContent = $(selectors.noContent, $el),
			$nav = $(selectors.nav, $el),
			$pagingLinks = $(selectors.paging, $nav),
			$prev = $(selectors.prev, $el),
			$next = $(selectors.next, $el),
			$currentPage = $(selectors.currentPage),
			$totalPages = $(selectors.totalPages),

			pageLinkHTML = $nav.is(selectors.numberedPaging) ? '<li class="link-to-page">{page}</li>' : '<li class="dot" title="{page}">&nbsp;</li>',
			
			verticalPaging = $el.is(selectors.verticalPaging),
			scrollDirection = verticalPaging ? 'top' : 'left',
			size = verticalPaging ? 'height' : 'width',
			translationDirection = verticalPaging ? 'translateY' : 'translateX',
			
			pageSize = $viewport[size](),
						
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
			$el.trigger('scroll');
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
			var 
				page = currentPage() + n,
				maxPageIndex = pageCount() - 1;
			if (page < 0) {
				scroll(0);
			} else if (page > maxPageIndex) {
				scroll(maxPageIndex*pageSize);
			} else {
				scroll(Math.round(page)*pageSize);
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
			renderNav();
			scroll(0);
		}

		function content ($freshContent) {
			$content.empty().append($freshContent).show();
			refresh();
		}
		
		function initTouch () {
			// TODO: Support vertical scrolling
			var initialX, latestDelta, initialScrollPos, hasMomentum;
			
			function touchStart (e) {
				e.preventDefault();
				$content.css('-webkit-transition-property', 'none');
				initialX = e.originalEvent.targetTouches[0].pageX;
				initialScrollPos = scrollPos();
				console.debug('touchStart');
			}
			function touchMove (e) {
				var 
					x = e.originalEvent.targetTouches[0].pageX,
					delta = initialX - x;
				
				e.preventDefault();
				hasMomentum = Math.abs(delta) - Math.abs(latestDelta) > 5;
				latestDelta = delta;
				scroll(initialScrollPos + delta);
				console.debug('touchMove');
			}
			function touchEnd (e) {
				$content.css('-webkit-transition-property', '');
				if (hasMomentum) {
					scrollPage(latestDelta < 0 ? -0.5 : 0.5); // Avoid scrolling more than one whole page
				} else {
					scrollPage(0);
				}
				initialX = null;
				console.debug('touchEnd');
			}
			
			$content.bind('touchstart', touchStart);
			$content.bind('touchmove', throttle(touchMove));
			$content.bind('touchend', touchEnd);
		}
		
		function init() {
			if (isTouchScreen) {
				initTouch();
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
				$el.bind('scroll', updatePaging);
			}
			
			refresh();
		}

		// Public methods;
		this.content = content;
		this.scrollTo = scrollTo;
		this.scrollIntoView = scrollIntoView;
		this.prev = prev;
		this.next = next;
		this.refresh = refresh;
		
		init();
		return this;
	}
	
	$.fn.yass = function (method) {
		var firstArgument = arguments[0];

		this.each(function () {
			var plugin = !$(this).data('yass');
			if (plugin && typeof firstArgument === 'string' && typeof plugin[firstArgument] === "function") {
				plugin[firstArgument].apply(plugin, [].slice.call(arguments, 1));
			} else {
				plugin = new Yass(this, firstArgument);
				$(this).data('yass', plugin);
			}
		});
		
		return this;
	};
	
	$.fn.yass.selectors = {};
} (jQuery, window));
