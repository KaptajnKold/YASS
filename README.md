YASS.js
===

(Yet Another Slideshow)

By Adam Lett

Dependencies:

* jQuery (testet with v1.6 and higher)
* modenizr

This plugin depends on features in EcmaScript 5. 
If you need to support a browser that does not off ES5 support, 
it will be necessary to include a library like es5-shim 
(https://github.com/kriskowal/es5-shim) on the page

License: MIT http://www.opensource.org/licenses/mit-license.php

How to use
==========

As much as possible, YASS will try not to create a bunch of elements in the DOM when it gets instantiated. This means that it is your job to create the DOM structure that you want YASS to work with. At first glance this may seems like more work than it would be to use one of the many plugins that will do this for you. There are however some advantages:

* Everything related to how your slide show _looks_ is controlled with HTML and CSS. YASS only adds behaviour.
* It enables you to mock up the slide show in HTML and CSS before you script it.
* You control which of YASS's features are enabled by providing the elements. E.g. if you don't want previous/next buttons, you just leave them out of the markup.

The minimum number of elements needed for a YASS slide show is 2: A viewport element and a content element:

	<div class=".yass-viewport">
		<div class=".yass-content">...</div>
	</div>


No content
----------

Methods
=======

* content
* scrollTo
* scrollIntoView
* prev
* next
* `refresh`
  If you update the content after the slide show has been initialized without using the `content` method, 
  YASS needs to recalculate the dimensions of the content element. For that you need to call `refresh`.

