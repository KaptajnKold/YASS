/*jslint white:false*/
/*global $*/

$(function () {
	function wrapInExpandable(summary, details, open) {
		return $('<details ' + (open ? 'open': 'closed') + '><summary>' + summary + '</summary><pre>' + details + '</pre></details>');
	}
	
	$("table.styles tbody tr").each(function () {
		var
		$example = $(".style-example > *", this),
		$selector = $(".style-selector", this),
		nodeName = (($example[0] && $example[0].nodeName) || "").toLowerCase(),
		classes = $example.attr('class'),
		styles = $example.attr('style'),
		selector = "";

		if (nodeName !== 'div') {
			selector = nodeName;
		}
		if (classes) {
			selector += classes.split(/\s+/).map(function(cssClass) {
				return '.' + cssClass;
			}).join('');
		}
		if (selector) {
			$selector.append(wrapInExpandable("Selector", selector, true));

		}

		if (0 < $example.children().length) {
			$selector.append(wrapInExpandable("HTML", $('<div>').text($example[0].outerHTML).html()));
		} else {

			if (styles) {
				$selector.append(wrapInExpandable("Styles", styles, true));
			}
		}
	});

});

$(function () {
	var $tableOfContents = $("#style-index");
	$(".style-header").each(function () {
		var headerId = $(this).attr("id");
		if (headerId) {
			$tableOfContents.append($('<li><a href="#' + headerId + '">' + this.innerText + '</a></li>'));
		}
	});
	$("table.styles").each(function () {
		$(this).after($('<a href="#style-index" class="back-to-top">Back to top</a>'));
	});
});