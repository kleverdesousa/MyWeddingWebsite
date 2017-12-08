<?php
if($_POST)
{
	$to_email   	= "youremail@email.com"; //Recipient email, Replace with own email here
	
	//check if its an ajax request, exit if not
    if(!isset($_SERVER['HTTP_X_REQUESTED_WITH']) AND strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) != 'xmlhttprequest') {
		
		$output = json_encode(array( //create JSON data
			'type'=>'error', 
			'text' => 'Sorry Request must be Ajax POST'
		));
		die($output); //exit script outputting json data
    } 
	
	//Sanitize input data using PHP filter_var().
	$user_name		= filter_var($_POST["user_name"], FILTER_SANITIZE_STRING);
	$guest		= filter_var($_POST["guest"], FILTER_SANITIZE_STRING);
	$guests		= filter_var($_POST["guests"], FILTER_SANITIZE_STRING);
	$attending		= filter_var($_POST["attending"], FILTER_SANITIZE_STRING);
	$message		= filter_var($_POST["msg"], FILTER_SANITIZE_STRING);
	
	//additional php validation
	if(strlen($user_name)<2){ // If length is less than 4 it will output JSON error.
		$output = json_encode(array('type'=>'error', 'text' => '<p>Name is too short or empty!</p>'));
		die($output);
	}
	
	//email body
	$message_body = "\r\nName : ".$user_name."\r\nAttending : ".$attending."\r\nBringing Guests : ".$guest."\r\nGuest Name : ".$guests."\r\nMessage : ".$message;
	
	//proceed with PHP email.
	$headers = 'From: '.$user_name.'' . "\r\n" .
	'Reply-To: '.$user_email.'' . "\r\n" .
	'X-Mailer: PHP/' . phpversion();
	
	$send_mail = mail($to_email, RSVP, $message_body, $headers);
	
	if(!$send_mail)
	{
		//If mail couldn't be sent output error. Check your PHP email configuration (if it ever happens)
		$output = json_encode(array('type'=>'error', 'text' => '<p>Could not send mail! Please check your PHP mail configuration.</p>'));
		die($output);
	}else{
		$output = json_encode(array('type'=>'message', 'text' => 'Hi '.$user_name .', Thank you for confirming!'));
		die($output);
	}
}
?>