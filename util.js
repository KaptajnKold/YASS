(function (prototype) {
    // Because the buildin modulo operator % is broken...
    // (it can return negative results)
    prototype.mod = function (n) {
        return ((this % n) + n) % n;
    };
	['round', 'floor', 'ceil'].forEach(function (fn) {
		prototype[fn] = function () {
			return Math[fn](this);
		};
	});
}(Number.prototype));