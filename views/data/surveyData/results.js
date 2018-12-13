extends ../../_layouts/default

include ../../_includes/_mixins/formMixins

prepend assignments
	-mainLink = 'DATA'
	-subLink = 'SURVEY_DATA'
	-pageTitle = routeName + ' Upload Survey Data Results'

block content
	.col-md-12
		.row
			.col-md-8
				div(id='map', style='height: 500px;')
			.col-md-4(style='height: 500px;')

block styleIncludes
	link(rel='stylesheet', href='/resources/css/leaflet.css')

block scriptIncludes
	script(type='text/javascript', src='/resources/js/leaflet.js')
	script(type='text/javascript', src='http://maps.google.com/maps/api/js?v=3.2&sensor=false')
	script(type='text/javascript', src='/resources/js/leaflet-google.js')
	script(type='text/javascript', src='/controllers/data/surveyData/resultsCtrl.js')
	script.
		init(!{surveyData}, !{boardingAlightings});