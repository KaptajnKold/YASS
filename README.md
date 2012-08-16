YASS.js
===

(Yet Another Slideshow)

A jQuery Plugin by Adam Lett. Copyright 2011, 2012.

License: MIT http://www.opensource.org/licenses/mit-license.php

Features:
---

* Touch enabled: Swipe to navigate on touch screen devices!
* Hardware accelerated: Uses 3D transforms and transitions in browsers that support it!
* Flexible, Lightweight & Opinionated.

Dependencies:
---

* JQuery (testet with version 1.6 and higher)
* Modenizr – Actually YASS does not depend on Modenizr the library, but on a few classes on the `html` element to detect browser support for certain features. In case you don't want to use Modenizr for some reason, you can help YASS by adding the followin classes the the `html` element in browsers that support it:
	* `touch`
	* `csstransforms`
	* `csstransitions`

This plugin depends on features in EcmaScript 5. 
If you need to support a browser that does not offer ES5 support, 
you will need to include a library like es5-shim 
(https://github.com/kriskowal/es5-shim) on the page.

How to use
==========

As much as possible, YASS will try not to create a bunch of elements in the DOM when it gets instantiated. This however means that it is _your_ job to create the DOM structure that you want YASS to work with. At first glance this may seems like more work than it would be to use one of the many plugins that will do this for you. There are however advantages:

* Everything related to how your slide show _looks_ is controlled with HTML and CSS. YASS only adds behaviour.
* It enables you to mock up the slide show in HTML and CSS before you script it.
* You control which of YASS's features are enabled by providing the elements. E.g. if you don't want previous/next buttons, you just leave them out of the markup.

The minimum number of elements needed for a YASS slide show is 3: A container, a viewport element and a content element:

	<div id="my-slideshow">
		<div class="yass-viewport">
			<div class="yass-content">...</div>
		</div>
	</div>
	
You instantiate the slider like any other jQuery plugin:

	$('#my-slideshow').yass();

The container is whatever element you pass to the plugin when you instantiate it and is nothing except the element that holds all the markup that YASS needs. Since YASS ignores all elements that it doesn't recognize, you could just use `body` or even `html` as container for the slide show, provided you only have one on the page.

The viewport defines the visible portion of the content, and should have a fixed size and overflow hidden.

The content is whatever you want presented by the slide show. In order to have any slide effect however, the content must be larger (wider) than the viewport.

If you want to be able to actually slide your content, you have to provide YASS with a few more elements:

	<div id="my-slideshow">
		<div class="yass-viewport">
			<div class="yass-content">...</div>
		</div>
		<div class="yass-nav-prev">Previous Page</div>
		<div class="yass-nav-next">Next Page</div>
	</div>

YASS recognises the elements because of the classes applied to them, and in this case adds click (or touch) handlers to trigger navigation to the previous or next page.

Elements recognised by YASS
===========================

A list of elements that enable features in YASS when they are present. The selectors for the elements can be overridden to conform with the DOM structure you provide.

* content: '.yass-content' – Required. Defines the content for the slide show.
* viewport: '.yass-viewport' – Required. Defines the page size and the visible portion of the content.
* noContent: '.yass-no-content' – Optional. Will be shown if present, when there is no visible content.
* next: '.yass-nav-next' – Optional. If present, will be a clickable link to the next page.
* prev: '.yass-nav-prev' – Optional. If present, will be a clickable link to the previous page.
* paging: 'ul.yass-paging-links, ol.yass-paging-links' – Optional. If present, will be updated with clickable list items corresponding to each page of content.
* currentPage: '.yass-current-page' – Optional. If present, will be updated with the current page number.
* totalPages: '.yass-total-pages' – Optional. If present, will be updated with the total number of pages.
* snapTo: '.yass-snap-to' – Otional. If present, will cause YASS to snap to elements that match this selector, when scrolling.

Options
=======

You can pass an options object to YASS when you instantiate it:

	$('#my-slideshow').yass({ ... });
	
The following is a list of options recognised by YASS with their type and default value in the parenthesis:  

* `debug` (Boolean, false) – Enables fake touch controls using mouse events.
* `touch` (Boolean, true) – Enables touch controls on touch devices.
* `selectors` (Object, null) – Override default selectors.
* `onScrollTo` (Function, null) – Callback for when YASS scrolls to a particular element. The element is passed as the first argument.
* `onTransitionEnd` (Function, null) – Callback for when the scrolling transition has ended

Methods
=======



* `scrollTo(targetElement)` – Scroll to a particular element, specified by a DOM element, a jQuery collection or a selector.
* `prev()` – Scroll to previous page.
* `next()` – Scroll to next page.
* `refresh()` – Instruct YASS to recalculate dimensions of content, number of pages etc. Call this if you changed the content after YASS has been instantiated or since you last called `refresh()`.

Examples
========

The project has a folder with examples on how to accomplish different things with YASS. Check these out to find out how to:

- Use your own custom classes instead of the default ones YASS expects.
- Use pagination bullets instead of or in conjunction with next and previous buttons.
- Create a responsive slider