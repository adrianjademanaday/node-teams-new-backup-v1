$(document).ready(function(){
	
	//Show the content of help_box when clicked the help button.
	$('#help').click(function(){
		$('.help_box').show();
	});
	
	//Close the help_box content when cliced the X or Close mark.
	$('#close').click(function(){
		$('.help_box').hide();
	});
	
	$('#deleteSurveyDataOnly').click(function(){
		$('.cover').fadeIn(500);
		$('.deleteSurveyDataOnly').fadeIn(500);
	});
	
	$('#closeSurveyDataOnly').click(function(){
		$('.deleteSurveyDataOnly').fadeOut(500);
		$('.cover').fadeOut(500);
	});
	
	$('#deleteAll').click(function(){
		$('.cover').fadeIn(500);
		$('.deleteAll').fadeIn(500);
	});
	
	$('#closeDeleteAll').click(function(){
		$('.deleteAll').fadeOut(500);
		$('.cover').fadeOut(500);
	});
	
});
