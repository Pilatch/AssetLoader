(function() {
	var html = DOGGIE_TEMPLATE({
		name: "Ramona",
		breed: "labrador/pitbull mix",
		coloration: "yellow",
		isMale: false
	});
	$(".style-target").after(html);
})();