/* Author:

*/

var last_pid = 0;

function logout()
{
	window.localStorage.clear();
	change_page('index');
}


function show_avatar()
{
	$(".list_avatar").each( function( index , value )
	{
		if($(this).attr('data-url') )
		{
			$(this).css( 'background-image',  'url(' + $(this).attr('data-url') + ')' );
		}
		
	});

}

function avatar()
{
	 navigator.camera.getPicture(uploadAvatar, function(message) {
	//alert('get picture failed' + message );
	},{
		quality: 50, 
		destinationType: navigator.camera.DestinationType.FILE_URI,
		sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
		}
    );
}

function photo() 
{
    console.log("In ");
    // Retrieve image file location from specified source
    navigator.camera.getPicture(uploadPhoto, function(message) {
	//alert('get picture failed' + message );
	},{
		quality: 50, 
		destinationType: navigator.camera.DestinationType.FILE_URI,
		sourceType: navigator.camera.PictureSourceType.CAMERA
		}
    );

}

function uploadAvatar( imageURI  )
{
	$('#avatar_button').val('…');
	myScroll.scrollTo( 0 , -100 , 200 );
	return uploadImage( imageURI  , 'avatar_upload' );

}



function uploadPhoto(imageURI) 
{
    myScroll.scrollTo( 0 , -100 , 200 );
    return uploadImage( imageURI  , 'image_upload' );
}


function uploadImage( imageURI , api )
{
	var options = new FileUploadOptions();
    options.fileKey="file";
    options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
    options.mimeType="image/jpeg";

    var params = new Object();
	params.token = kget('op_token');
	
	options.params = params;
    
    options.chunkedMode = false;
    $('#refresh_image').attr('src','image/refreshing.gif');
    
    var ft = new FileTransfer();
    ft.upload(imageURI, 'http://' + kget('op_domain') + '/index.php?m=api&a='+api, function(r){  success( r , api ); }, fail, options);
}
 
 function success(r , api ) 
 {
	console.log("Code = " + r.responseCode);
	console.log("Response = " + r.response);
	console.log("Sent = " + r.bytesSent);
	//alert(api);
	
    
    if( api == 'avatar_upload' )
    {
    	$('#avatar_button').val('头像');
		var data_obj = jQuery.parseJSON( r.response );
		
		
		if( parseInt(data_obj.err_code) == 0 )
		{
				
			if( data_obj.data.picture.length > 0 )
			{
				$('#cover_icon').css( 'background-image',  'url(' + data_obj.data.picture + ')' );
				kremove('op-cache-user');
			}
					
		}

    }
    	 
    load_path();
   
     
 }
 
function fail(error) 
{
	$('#refresh_image').attr('src','image/refresh.png');
    alert("An error has occurred: Code = " = error.code);
}

function show_local_info()
{
	if( (kget('op-cache-path') != null) && (kget('op-cache-user') != null ) )
	{
		var user_obj = jQuery.parseJSON( kget('op-cache-user') );
		
		if( user_obj.data.cover.length > 0 )
			$('#cover').css( 'background-image',  'url(' + user_obj.data.cover + ')' );
				
		if( user_obj.data.picture.length > 0 )
			$('#cover_icon').css( 'background-image',  'url(' + user_obj.data.picture + ')' );
			
			
		$('#cover_time').html( user_obj.data.refresh_time );
		
		var path_obj = 	jQuery.parseJSON( kget('op-cache-path') );
		
		$("#path_list").empty();
		
		$('#path_list_tpl').tmpl(path_obj.data.items).appendTo( "#path_list" );
		
		if( path_obj.data.refresh_time != null && path_obj.data.refresh_time.length > 0 )
		$('#cover_time').html( path_obj.data.refresh_time );
		show_avatar();
		
		setTimeout(function () 
		{
			myScroll.refresh();
		}, 0);
		
		last_pid = parseInt(path_obj.data.min);
		
			
	}
	else
	{
		// check token alvailbe
		check_token();	
	}

}

function check_token()
{
	$.post( 'http://' + kget('op_domain') + '/index.php?m=api&a=user_verify' , { 'token' : kget('op_token') } , function( data )
	{
		
		var data_obj = jQuery.parseJSON( data );
		
		
		if( parseInt(data_obj.err_code) != 0 )
		{
			alert('授权过期，请重新登录');
			change_page('index');
			
		}
		else
		{
			console.log( data_obj );
			
			// update picture and cover
			// not work on android and iPhone, why?
			
			if( data_obj.data.cover.length > 0 )
			{
				$('#cover').css( 'background-image',  'url(' + data_obj.data.cover + ')' );
				$('#cover').css( 'background-repeat',  'no-repeat' );
			}
				
			//alert( data_obj.data.picture );
			
			if( data_obj.data.picture.length > 0 )
				$('#cover_icon').css( 'background-image',  'url(' + data_obj.data.picture + ')' );
			
			
			$('#cover_time').html( data_obj.data.refresh_time );
			
			kset( 'op-cache-user' , data  );
			
			// load path info
			load_path_cache();	
			 
		}
		
	} );
}


function load_path_cache()
{
	if( kget('op-cache-path') == null ) return load_path();
	else
	{
		//alert( kget('op-cache-path') );
		
		var data = kget('op-cache-path');
		
		var data_obj = jQuery.parseJSON( data );
		
		console.log( data_obj );
		
		$("#path_list").empty();
		
		$('#path_list_tpl').tmpl(data_obj.data.items).appendTo( "#path_list" );
		show_avatar();
		
		setTimeout(function () 
		{
			myScroll.refresh();
		}, 0);
		
		last_pid = parseInt(data_obj.data.min);

		
	}
}

function load_path()
{
	$('#refresh_image').attr('src','image/refreshing.gif');
	
	$.post( 'http://' + kget('op_domain') + '/index.php?m=api&a=path_list' , { 'token' : kget('op_token') } , function( data )
	{
		
		var data_obj = jQuery.parseJSON( data );
		
		$('#refresh_image').attr('src','image/refresh@2x.png');


		console.log( data_obj );
		
		if( data_obj.err_code != 0 )
		{
			if( data_obj.err_code == 10001 )
			{
				alert('授权过期，请重新登录');
				change_page('index');
			}
			else
			{
				alert('发送失败，请重试 ');
			}
			
			return false;
		}
		else
		{
			//change_card( 'path_card' );
			$("#path_list").empty();
			$('#path_list_tpl').tmpl(data_obj.data.items).appendTo( "#path_list" );
			show_avatar();
			setTimeout(function () 
			{
				myScroll.refresh();
			}, 0);	
			
			if( data_obj.data.refresh_time != null && data_obj.data.refresh_time.length > 0 )
		$('#cover_time').html( data_obj.data.refresh_time );
			
			kset( 'op-cache-path' , data  );
			
			last_pid = parseInt(data_obj.data.min);
			
			
		}
		
	} );		
}

function load_more_path( last )
{
	//alert( last );
	if( parseInt( last ) > 1 )
	{
		$('#more_button').html('Loading...');
		$('#refresh_image').attr('src','image/refreshing.gif');
	
		$.post( 'http://' + kget('op_domain') + '/index.php?m=api&a=path_list&since_id=' + last , { 'token' : kget('op_token') } , function( data )
		{
			
			var data_obj = jQuery.parseJSON( data );
			
			$('#refresh_image').attr('src','image/refresh@2x.png');
			$('#more_button').html('载入更多');
	
	
			console.log( data_obj );
			
			if( data_obj.err_code != 0 )
			{
				if( data_obj.err_code == 10001 )
				{
					alert('授权过期，请重新登录');
					change_page('index');
				}
				else
				{
					alert('发送失败，请重试 ');
				}
				
				return false;
			}
			else
			{
				//change_card( 'path_card' );
				$('#path_list_tpl').tmpl(data_obj.data.items).appendTo( "#path_list" );
				show_avatar();
				setTimeout(function () 
				{
					myScroll.refresh();
				}, 0);	
				
				
				last_pid = parseInt(data_obj.data.min);
				
				
			}
			
		} );
	}
	else
	{
		//alert('~~~');
		$('#more_button').html('没有更多啦…');
	}
}

function save_thought()
{
	if( $('#thought_text').val() == '' )
	{
		alert("内容不能为空");
		return false;
	}
	
	$('#thought_button').val('发送中');	
		
	$.post( 'http://' + kget('op_domain') + '/index.php?m=api&a=path_add&type=MBLOG' , {'text':$('#thought_text').val() , 'token' : kget('op_token') } , function( data )
	{
		
		console.log( data );
		
		if( data.err_code != 0 )
		{
			// 
			if( data.err_code == 10001 )
			{
				alert('授权过期，请重新登录');
				change_page('index');
			}
			else
			{
				alert('发送失败，请重试 ');
			}
			
			$('#thought_button').val('发送');	
			
			return false;
			
		}
		else
		{
			change_card( 'path_card' );
			load_path();	
			$('#thought_text').val('');
			
		}
		
	} , 'json' );		
}


function login()
{
	if( $('#email').val() == '' )
	{
		alert("Email不能为空");
		return false;
	} 
	if( $('#password').val() == '' )
	{
		alert("密码不能为空");
		return false;
	}
	
	$("#login_button").val('登入中­...');
	
	
	// 'http://' +  $('#domain').val() + '/?m=api&a=get_token'
	
	$.post( 'http://' + $('#domain').val() + '/index.php?m=api&a=get_token' , {'email':$('#email').val() , 'password':$('#password').val() } , function( data )
	{
		
		console.log( data );
        //alert( data );
        var data_obj = jQuery.parseJSON( data );
		
		if( data_obj.err_code != 0 )
		{
			// 
			alert('错误的email地址或者密码，请重试 ');
		}
		else
		{
			//
			if( (parseInt(data_obj.data.uid) < 1) || ( data_obj.data.token.length < 4 ) )
				alert('服务器忙，请稍后重试~' + data_obj.data.uid + '~' + data_obj.data.token );
				
			// save token and info , redirect to path.html	
			kset( 'op_domain' , $('#domain').val() );
			kset( 'op_email' , $('#email').val() );
			kset( 'op_password' , $('#password').val() );
			
			kset( 'op_uid' , data_obj.data.uid );
			kset( 'op_token' , data_obj.data.token );
		
			change_page( 'path' );
		}
		
	}  );	
}


function change_page( page )
{
	location = page + '.html';
}

function change_card( cid )
{
	op_change( cid , 'card' );
}

function change_tab( tid )
{
	op_change( tid , 'tab' );
}

function op_change( id , name )
{
	$(".op-"+name).each( function( index , value )
	{
		if($(this).attr('id') == id )
		{
			$(this).addClass('cur');
		}
		else
		{
			$(this).removeClass('cur');
		}
	});

}

function kset( key , value )
{
	window.localStorage.setItem( key , value );
}

function kget( key  )
{
	return window.localStorage.getItem( key );
}

function kremove( key )
{
	window.localStorage.removeItem( key );
}


function reload_image(pThis) 
{
    // To prevent this from being executed over and over
    pThis.onerror = null; 
 
    // Refresh the src attribute, which should make the
    // browsers reload the iamge.
    pThis.src = pThis.src;
}

/*

alpha= 15 x=193 y=51
=========================
alpha= 30 x=173 y=99
=========================
alpha= 45 x=141 y=141
=========================
alpha= 60 x=100 y=173
=========================
alpha= 75 x=51 y=193
=========================
alpha= 90 x=0 y=200

----------------------------
add offset
----------------------------


alpha= 18 x=200 y=71
=========================
alpha= 36 x=171 y=127
=========================
alpha= 54 x=127 y=171
=========================
alpha= 72 x=71 y=200
=========================
alpha= 90 x=10 y=210
*/

function toggle_menu()
{
	if( $('#path_button').hasClass('path-extend') )
	{
		// do 
		$('#path_button').removeClass('path-extend');
		$('#path_photo').animate( { 'left' : '10px' , 'top': '10px' } , 200 , function(){} );
		$('#path_people').animate( { 'left' : '10px' , 'top': '10px' } , 180 , function(){} );
		$('#path_place').animate( { 'left' : '10px' , 'top': '10px' } , 160 , function(){} );
		$('#path_music').animate( { 'left' : '10px' , 'top': '10px' } , 140 , function(){} );
		$('#path_thought').animate( { 'left' : '10px' , 'top': '10px' } , 120 , function(){} );
		$('#path_sleep').animate( { 'left' : '10px' , 'top': '10px' } , 100 , function(){} );
				
		//$('#path_photo').animate( { 'left' : '10px' , 'top': '10px' } , 500 , function(){} );
	}
	else
	{
		// extend
		$('#path_button').addClass('path-extend');
		$('#path_photo').animate( { 'left' : '-5px' , 'top': '-100px' } , 100 , function(){} );
		$('#path_people').animate( { 'left' : '31px' , 'top': '-94px' } , 120 , function(){} );
		$('#path_place').animate( { 'left' : '59px' , 'top': '-78px' } , 140 , function(){} );
		
		$('#path_music').animate( { 'left' : '82px' , 'top': '-56px' } , 160 , function(){} );
		
		$('#path_thought').animate( { 'left' : '98px' , 'top': '-25px' } , 180 , function(){} );
		$('#path_sleep').animate( { 'left' : '104px' , 'top': '10px' } , 200 , function(){} );
		
	}
}

/*
alpha= 0 left=10 top=-110
=========================
alpha= 18 left=40 top=-105
=========================
alpha= 36 left=68 top=-90
=========================
alpha= 54 left=90 top=-68
=========================
alpha= 72 left=105 top=-40
=========================
alpha= 90 left=110 top=-10
*/





