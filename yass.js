/*jslint white:false, plusplus: false, regexp:true */
/*global jQuery, window, document*/

/*
	YASS.js -- Yet Another Slideshow
	================================
	
	Copyright 2011–2012 Adam Lett
	License: MIT http://www.opensource.org/licenses/mit-license.php
	
	Version: 0.3.0
	
	Dependencies:
	-------------
	
	* EcmaScript 5
	
	* jQuery (v1.6 testet)
	
	* Modernizr. Specifically, the plugin relies on these classes that Modernizr sets on the html tag:
		
		* touch
		* csstransforms
		* csstransitions
		
	TODO:
		
		* There should an event for paging
*/

;(function ($, win, doc) {
	
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
		
		prefixedTransitionEndEvents = {
			Webkit: 'webkitTransitionEnd',
			Moz: 'transitionend',
			O: 'oTransitionEnd',
			Ms: 'msTransitionEnd',
			'': 'transitionend'
		},
		
		transitionEndEvent,
		
		// Classes that YASS will apply to elements
		// TODO: Make configurable 
		cssClasses = {
			disabled: 'yass-disabled'
		},
		
		// TODO: Make prefix configurable
		defaultSelectors = {
			content: '.yass-content',
			noContent: '.yass-no-content',
			viewport: '.yass-viewport',
			next: '.yass-nav-next',
			prev: '.yass-nav-prev',
			paging: 'ul.yass-paging-links, ol.yass-paging-links',
			currentPage: '.yass-current-page',
			totalPages: '.yass-total-pages',
			verticalPaging: '.yass-vertical-paging',
			numberedPaging: '.yass-numbers',
			snapTo: '.yass-snap-to'
		},
		
		defaultOptions = {
			touch: true,
			// Toggles fake touch on non-touch enabled devices using mouse events
			debug: false
		},
		
		isTouchScreen = $html.hasClass('touch'),
		buttonEvent = isTouchScreen ? 'touchstart' : 'click';
	
	// Source: http://lea.verou.me/2009/02/find-the-vendor-prefix-of-the-current-browser/	
	function getVendorPrefix () {
		var 
			prefixPattern = /^(Moz|Webkit|Khtml|O|ms|Icab)(?=[A-Z])/,
			someScript = doc.getElementsByTagName('script')[0],
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
		if('WebkitOpacity' in someScript.style) { return 'Webkit'; }
		if('KhtmlOpacity' in someScript.style) { return 'Khtml'; }

		return '';
	}
	
	// FIXME: This implementation will 'swallow' the last invocation of fn.
	function throttle (fn, context) {
		var lastInvocation = 0, threshold = 10;
		return function () {
			var now = new Date().getTime();
			if (now - lastInvocation > threshold) {
				return fn.apply(context, arguments);
			}
		};
	}
	
	// From: http://javascript.crockford.com/remedial.html
	function supplant (o) {
	    return this.replace(/\{([^\{\}]*)\}/g,
	        function (a, b) {
	            var r = o[b];
	            return typeof r === 'string' || typeof r === 'number' ? r : a;
	        }
	    );
	}
	
	vendorPrefix = getVendorPrefix();
	cssTransformProperty = vendorPrefix + 'Transform';
	cssTransitionProperty = vendorPrefix + 'Transition';
	transitionEndEvent = prefixedTransitionEndEvents[vendorPrefix] || prefixedTransitionEndEvents[''];
	
	function Yass (el, userOptions) {
		
		if (userOptions && typeof userOptions !== 'object') { throw new TypeError('Yass options must be an object'); }
		
		var 
			//elements
			$el = $(el),
			options = $.extend({}, defaultOptions, $.fn.yass.options, (userOptions || {})),
			selectors = $.extend({}, defaultSelectors, $.fn.yass.selectors, (options.selectors || {})),
			$viewport = $(selectors.viewport, $el), // Maybe we should allow $el to be the viewport?
			$content = $(selectors.content, $el),
			$noContent = $(selectors.noContent, $el),
			$pagingLinks = $(selectors.paging, $el),
			$prev = $(selectors.prev, $el),
			$next = $(selectors.next, $el),
			$currentPage = $(selectors.currentPage),
			$totalPages = $(selectors.totalPages),

			paginationTemplate = supplant.bind( $pagingLinks.is(selectors.numberedPaging) ? '<li>{page}</li>' : '<li>&nbsp;</li>' ),
			
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
			return $content[size]()/pageSize;
		}

		function currentPage () {
			return scrollPos()/pageSize;
		}

		function updatePaging () {
			var 
				current = Math.ceil(currentPage()) + 1,
				total = Math.ceil(pageCount());
			$('li.current', $pagingLinks).removeClass('current');
			$('li:nth-child(' + current + ')', $pagingLinks).addClass('current');
			
			$prev.toggleClass(cssClasses.disabled, current === 1);
			$next.toggleClass(cssClasses.disabled, current === total);
			
			$currentPage.text(current);
			$totalPages.text(total);
		}
		
		function pos (el) {
			// It's tempting to just return el.offset(Left|Top), but that only works if el is a child of $content
			return el ? $(el).offset()[scrollDirection] - $content.offset()[scrollDirection] : 0;
		}
		
		function maxScrollPos () {
			return $content[size]() - pageSize;
		}
		
		function scroll (targetPos) {
			var pos = scrollPos(), max = maxScrollPos();
			if (targetPos < 0) {
				targetPos = -Math.round(Math.pow(-targetPos, 4/5));
			} else if ( targetPos > max) {
				targetPos = max + Math.round(Math.pow(targetPos - max, 4/5));
			}
			if ( pos === targetPos ) { return; }
			setScrollPos(targetPos);
			$el.trigger('scroll');
		}

		function scrollTo (targetElem) {
			scroll( Math.min( Math.max(0, pos(targetElem)), maxScrollPos() ) );
			if (targetElem && typeof options.onScrollTo === 'function') {
				options.onScrollTo(targetElem);
			}
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
		
		function relativePagePos (n) {
			var 
				page = currentPage() + n,
				maxPageIndex = pageCount() - 1;
			if (page < 0) {
				return 0;
			}
			if (page > maxPageIndex) {
				return maxPageIndex*pageSize;
			}
			return Math.round(page)*pageSize;
		}
		
		function scrollPage (n) {
			scroll(relativePagePos(n));
		}

		function prevSnapEl () {
			var currentScrollPos = scrollPos();
			return $(selectors.snapTo).filter(function () { return currentScrollPos > pos(this); }).last()[0];
		}

		function nextSnapEl () {
			var currentScrollPos = scrollPos();
			return $(selectors.snapTo).filter(function () { 
				return currentScrollPos < pos(this); 
			})[0] || $(selectors.snapTo).last()[0];
		}
		
		function nearestSnapEl () {
			var currentScrollPos = scrollPos();
			return $(selectors.snapTo).toArray().reduce(function (nearestSoFar, current) { 
				var 
					nearestSoFarDist = Math.abs(currentScrollPos - pos(nearestSoFar)),
					currentDist = Math.abs(currentScrollPos - pos(current));
				return nearestSoFarDist < currentDist ? nearestSoFar : current;
			});
		}
		
		function prev () {
			var hasSnap = $(selectors.snapTo).length > 0;
			if (hasSnap) {
				scrollTo(prevSnapEl());
			} else {
				scrollPage(-0.5);
			}
		}
		
		function next () {
			var hasSnap = $(selectors.snapTo).length > 0;
			if (hasSnap) {
				scrollTo(nextSnapEl());
			} else {
				scrollPage(0.5);
			}
		}
		
		function scrollToNearestPage () {
			var hasSnap = $(selectors.snapTo).length > 0;
			if (hasSnap) {
				scrollTo(nearestSnapEl());
			} else {
				scrollPage(0);
			}
			
		}
				
		function renderNav () {
			if ($pagingLinks.length === 0) { return; }
			var 
				wholePages = Math.ceil(pageCount()),
				pagingHTML = "",
				i;
			if (1 < wholePages) {
				for (i = 0; i < wholePages; i++) {
					pagingHTML += paginationTemplate({ 'page': i + 1 });
				}
				$pagingLinks.html(pagingHTML);
				$pagingLinks.show();
			} else {
				$pagingLinks.hide();
			}
			updatePaging();
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

		function enableTransition () {
			$content.css(cssTransitionProperty, '');
		}
		
		function disableTransition () {
			$content.css(cssTransitionProperty, 'none');
		}

		function initTouch () {
			// TODO: Support vertical scrolling
			var initialX, latestDelta, initialScrollPos, hasMomentum;
			
			function touchStart (e) {
				disableTransition();
				initialX = e.originalEvent.targetTouches[0].pageX;
				initialScrollPos = scrollPos();
			}

			function touchMove (e) {
				var 
					x = e.originalEvent.targetTouches[0].pageX,
					delta = initialX - x;
				
				e.preventDefault();
				hasMomentum = Math.abs(delta) - Math.abs(latestDelta) > 5;
				latestDelta = delta;
				scroll(initialScrollPos + delta);
			}

			function touchEnd (e) {
				enableTransition();
				initialX = null;

				if (hasMomentum) {
					if (latestDelta < 0) {
						prev();
					} else {
						next();
					}
				} else {
					scrollToNearestPage();
				}
			}
						
			$content.bind('touchstart', touchStart);
			$content.bind('touchmove', throttle(touchMove));
			$content.bind('touchend', touchEnd);
		}
		
		function initFakeTouch () {
			// TODO: Support vertical scrolling
			var initialX, latestDelta, initialScrollPos, hasMomentum, touchMoveThrottled;
			
			function touchStart (e) {
				e.preventDefault();
				disableTransition();
				initialX = e.pageX;
				initialScrollPos = scrollPos();
				
				$content.bind('mousemove', touchMoveThrottled);
				
			}
			
			function touchMove (e) {
				var 
					x = e.pageX,
					delta = initialX - x;
				
				e.preventDefault();
				hasMomentum = Math.abs(delta) - Math.abs(latestDelta) > 5;
				latestDelta = delta;
				scroll(initialScrollPos + delta);
			}
			
			function touchEnd (e) {
				enableTransition();
				initialX = null;

				$content.unbind('mousemove', touchMoveThrottled);

				if (hasMomentum) {
					if (latestDelta < 0) {
						prev();
					} else {
						next();
					}
				} else {
					scrollToNearestPage();
				}
			}
			
			touchMoveThrottled = throttle(touchMove);
			$content.bind('mousedown', touchStart);
			$content.bind('mouseup', touchEnd);
		}
		
		
		function init() {
			if (isTouchScreen && options.touch) {
				initTouch();
			} else if (options.debug && options.touch) {
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
			
			$pagingLinks.delegate('li', buttonEvent, function (e) {
				scroll($(this).index() * pageSize);
			});
			
			if (cssTransitionsSupported) {
				$content.bind(transitionEndEvent, function () {
					updatePaging();
					if (typeof options.onTransitionEnd === 'function') {
						options.onTransitionEnd();
					}
				});
			} else {
				$el.bind('scroll', updatePaging);
			}
			
			refresh();
		}

		// Public methods;
		this.scrollTo = scrollTo;
		this.scrollIntoView = scrollIntoView;
		this.prev = prev;
		this.next = next;
		this.refresh = refresh;
		
		init();
		return this;
	}
	
	$.fn.yass = function (method) {
		var args = [].slice.apply(arguments);

		this.each(function () {
			var plugin = $(this).data('yass');
			if (plugin && typeof args[0] === 'string' && typeof plugin[args[0]] === "function") {
				plugin[args[0]].apply(plugin, args.slice(1));
			} else {
				plugin = new Yass(this, args[0]);
				$(this).data('yass', plugin);
			}
		});
		
		return this;
	};
	
	$.fn.yass.selectors = {};
	$.fn.yass.options = {};
} (jQuery, window, document));
