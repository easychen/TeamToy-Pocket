/* Author:

*/
var on_phonegap = false;
var db;
var is_online = true;
var member_inited = false;
var syncing = false;



function base_url()
{
	var port = parseInt(kget('api_port'));
	var folder = kget('api_folder');
	var port_str = '';
	var folder_str = '';

	if( port > 0 ) port_str = ':'+port;
	if(  folder && folder.length > 0 ) folder_str = '/'+folder;

	return 'http://' +  kget('op_domain') + port_str + folder_str +'/' ;
}

function ubase_url()
{
	var port = parseInt(kget('api_port'));
	var folder = kget('api_folder');
	var port_str = '';
	var folder_str = '';

	if( port > 0 ) port_str = ':'+port;
	if(  folder && folder.length > 0 ) folder_str = '/'+folder;

	return 'http://' +  $('#domain').val() + port_str + folder_str +'/' ;

}


function login()
{
	// when logined and now offline
	if( !is_online && kget('op_token').length > 0 )
	{
		return  change_page( 'todo' );	
	} 

	if( $('#email').val() == '' )
	{
		tt_alert($.i18n._('Email can\'t be empty'));
		return false;
	} 
	if( $('#password').val() == '' )
	{
		tt_alert($.i18n._('Password can\'t be empty'));
		return false;
	}
	
	$("#login_button").val($.i18n._('Sign in...'));
	
	
	// 'http://' +  $('#domain').val() + '/?m=api&a=get_token'
	// http://tttwo.sinaapp.com/api/user/get_token/
	$.post( ubase_url() + 'index.php?c=api&a=user_get_token' , {'email':$('#email').val() , 'password':$('#password').val()  } , function( data )
	{
		console.log( data );
        var data_obj = $.parseJSON( data );
		
		if( data_obj.err_code != 0 )
		{
			// 
			tt_alert($.i18n._('Bad email or password'));
			$("#login_button").val($.i18n._('Sign in'));
		}
		else
		{
			//
			if( (parseInt(data_obj.data.uid) < 1) || ( data_obj.data.token.length < 4 ) )
				tt_alert($.i18n._('Server busy , try later please') );
				
			// save token and info , redirect to path.html	
			kset( 'op_domain' , $('#domain').val() );
			kset( 'op_email' , $('#email').val() );
			kset( 'op_password' , $('#password').val() );
			
			kset( 'op_uid' , data_obj.data.uid );
			kset( 'op_token' , data_obj.data.token );
			kset( 'op_uname' , data_obj.data.uname );
			kset( 'op_level' , data_obj.data.level );
			
		
			change_page( 'todo' );
		}
		
	}  );	
}

function active()
{
	if( $('#email').val() == '' )
	{
		tt_alert($.i18n._('Email can\'t be empty'));
		return false;
	} 
	if( $('#password').val() == '' )
	{
		tt_alert($.i18n._('Password can\'t be empty'));
		return false;
	}
	
	if( $('#code').val() == '' )
	{
		tt_alert($.i18n._('Active code can\'t be empty'));
		return false;
	}
	
	if( $('#name').val() == '' )
	{
		tt_alert($.i18n._('name can\'t be empty'));
		return false;
	}
	
	if( $('#domain').val() == '' )
	{
		tt_alert($.i18n._('domain can\'t be empty'));
		return false;
	}
	
	$("#active_button").val($.i18n._('激活中'));
	
	
	// 'http://' +  $('#domain').val() + '/?m=api&a=get_token'
	// http://tttwo.sinaapp.com/api/user/get_token/
	$.post( ubase_url() + 'index.php?c=api&a=user_sign_up' , {'email':$('#email').val() , 'password':$('#password').val() , 'code': $('#code').val() , 'name':$('#name').val() } , function( data )
	{
		console.log( data );
        var data_obj = $.parseJSON( data );
		
		if( data_obj.err_code != 0 )
		{
			// 
			tt_alert($.i18n._(data_obj.err_msg));
			$("#acitve_button").val('激活');
		}
		else
		{
			//
			tt_alert('成功激活');
			login();
		}
		
	}  );	
}

function load_feed()
{
	$('#refresh_image').addClass('loading');
}

function refresh_token( obj , callback )
{
	if( obj.err_code == 10001 )
	{
		float_message('正在重新获取云端授权',true);
		// token 过期
		$.post( base_url() + 'index.php?c=api&a=user_get_token' , {'email':kget('op_email')  , 'password':kget('op_password')   } , function( data )
		{
			var data_obj = $.parseJSON( data );
			if( data_obj.err_code == 0 )
			{
				kset( 'op_uid' , data_obj.data.uid );
				kset( 'op_token' , data_obj.data.token );
				
				if( typeof callback == 'function' ) callback(data_obj);
			}
				
		} , function()
		{
			float_message('已连接至云端');
		} );
		
		return true;
		
	}
	
	return false;
}

function show_local_todo()
{
	$("#todo_list_follow").empty();
	get_data( "SELECT * FROM TODO WHERE is_follow == 1" , [] , function( data )
	{
		// 渲染
		$("#todo_list_follow").html( $.tmpl("todo_list_follow_tpl" , {'items':data}) );
		bind_follow_todo();		
	}  );
	
	
	$("#todo_list_done").empty();
	get_data( "SELECT * FROM TODO WHERE status = 3 AND is_follow != 1" , [] , function( data )
	{
		// 渲染
		$("#todo_list_done").html( $.tmpl("todo_list_done_tpl" , {'items':data}) );
		bind_todo();		
	}  );
	
	$("#todo_list_star").empty();
	get_data( "SELECT * FROM TODO WHERE status != 3 AND is_star = 1" , [] , function( data )
	{
		// 渲染
		$("#todo_list_star").html( $.tmpl("todo_list_star_tpl" , {'items':data}) );
		bind_todo();
		
	}  );
	
	$("#todo_list_normal").empty();
	get_data( "SELECT * FROM TODO WHERE status != 3 AND is_star != 1 AND is_follow != 1" , [] , function( data )
	{
		// 渲染
		$("#todo_list_normal").html( $.tmpl("todo_list_normal_tpl" , {'items':data}) );
		bind_todo();
	
	}  );
	
	setTimeout(function () 
	{
		todoScroll.refresh();
	}, 0);
	
	
}

function load_todo( notice )
{
	$.post( base_url() + 'index.php?c=api&a=todo_list' , {'token' : kget('op_token') , 'by': 'tid' , 'ord' : 'desc' , 'count':100  } , function( data )
	{
		var data_obj = $.parseJSON( data );
		console.log( data_obj );
     
		
		if( data_obj.err_code != 0 )
		{
			// 
			if(!refresh_token( data_obj , load_todo ))
				if( data_obj.err_code != 10007 )
					tt_alert($.i18n._('Load TODO error'));
				else
				{
					db.transaction( function( tx )
					{
						tx.executeSql("DELETE FROM TODO ");
						tx.executeSql("DELETE FROM sqlite_sequence WHERE name = 'TODO'");
					} , db_error , function()
					{
						$("#todo_list_star").empty();
						$("#todo_list_normal").empty();
						$("#todo_list_done").empty();
						$("#todo_list_follow").empty();
						setTimeout(function () 
						{
							todoScroll.refresh();
						}, 0);
						float_message('还有没TODO呢，赶紧加一个吧');
					});
					
				}
					
			
		}
		else
		{
			
			db.transaction( function( tx )
			{
				tx.executeSql("DELETE FROM TODO ");
				tx.executeSql("DELETE FROM sqlite_sequence WHERE name = 'TODO'");
			} , db_error , function()
			{
				// 先放入本地数据库
				db.transaction( function( tx )
				{
					for( var i = 0 ; i < data_obj.data.length ; i++  )
					{
						tx.executeSql("INSERT OR REPLACE INTO TODO (  tid , content , is_star , is_public , is_delete , is_follow , is_sync  , sync_error , status , create_at  ) VALUES (  ? , ? , ? , ? , ? , ? , ? , ? , ? , ? )" , 
						[
							data_obj.data[i].tid ,
							data_obj.data[i].content ,
							data_obj.data[i].is_star ,
							data_obj.data[i].is_public ,
							0,
							data_obj.data[i].is_follow ,
							1,
							0,
							data_obj.data[i].status ,
							data_obj.data[i].timeline
						]
						
						);
					}
					
					
				}, db_error , function()
				{
					// success
					if( notice ) float_message('云端同步完成');
					show_local_todo( );
				} );
			
			
			});
			
		}
		
	}  );	
}

function sync_recover( callback , silent )
{
	if( syncing ) return false;
	setTimeout(function () 
	{
		syncing = false;
	}, 60000);
	var is_pull = false;
	
	if(  typeof callback == 'function' ) is_pull = true;
	
	
	if( on_phonegap )
	{
		if( navigator.network.connection.type == Connection.NONE || navigator.network.connection.type == Connection.UNKNOWN || !is_online )
		{
			return false;
		}
	}
	
	if( on_phonegap &&  !is_online ) return false;
	
	if( Number(new Date()) - Number(kget('last_sync_ts')) < 60000 ) return false;
	
	get_data( "SELECT * FROM TODO WHERE is_sync = 0 AND sync_error = 0 " , [] , function( data )
	{
		console.log(data);
		
		if( data == false )
		{
			if( is_pull ) 
				callback();
			
			
			return false;	
		}

		var len = data.length;
		var i = 0;
		
		if( !silent ) float_message('开始和云端同步');
		
		
		$.post( base_url() + 'index.php?c=api&a=todo_sync' , 
		{
			'token' : kget('op_token') , 
			'tid': data[i].tid,
			'text':data[i].content,
			'is_star':data[i].is_star,
			'is_public':data[i].is_public,
			'is_follow':data[i].is_follow,
			'is_delete':data[i].is_delete,
			'status':data[i].status,
			'create_at':data[i].create_at,
			'last_action_at':data[i].last_action_at,
			'client_now':jsnow()
		} , function( data2 )
		{
			var data_obj = $.parseJSON( data2 );
			console.log( data_obj );
		 
			if( data_obj.err_code != 0 )
			{
				float_message('同步失败:TODO['+ text +']',true);
			
				// 同步错误，做标记
				db.transaction( function( tx )
				{
					tx.executeSql("UPDATE TODO SET sync_error = 1 WHERE tid = ? LIMIT 1" , [ data[i].tid ]);
					
				}, db_error , function()
				{
					if(len>1) return sync_recover();	
				});
				
				
			}
			else
			{
				// if tid ! tid update tid
				var tsql  = '';
				if( (data[i].tid < 0) && (data_obj.data.tid > 0) )
				{
					//alert('更新本地显示');
					tsql = ' , tid = '+ data_obj.data.tid + ' ';
					
					// 更新本地显示
					if(data[i].is_delete != 1 )
					{
						//alert( 'li#lt-'+data[i].id );
						$('li#lt-'+data[i].id).removeClass('yellow');
						
						$('li#lt-'+data[i].id).attr('id' , 't-'+data_obj.data.tid  );
					}
				}
				// update is_sync字段
				db.transaction( function( tx )
				{
					tx.executeSql("UPDATE TODO SET is_sync = 1 , sync_error = 0  " + tsql + " WHERE tid = ? " , [ data[i].tid ]);
					
				}, db_error , function()
				{
					if(len>1) return sync_recover( null , true );
					else
					{
						kset('last_sync_ts', Number(new Date()) );
						
						
						if( is_pull )
						{
							callback();
							syncing = false;
						
						}
						else
						{
							float_message('离线数据已同步至云端');	
							syncing = false;
						
						}
						
						
						
					} 
				});
			}
			
			
			
		}  );
			
		
	});
}

function show_todo_detail( tid , card )
{
	// 检查联机状态
	if( on_phonegap && !is_online )
	{
		// todo 
		// 稍后加入本地缓存
		float_message('已离线，请连接网络后再试',true);
		return false;
	}
	
	// 向服务器请求数据
	float_message('读取云端数据中，请稍候',false,true);
	
	$.post( base_url() + 'index.php?c=api&a=todo_detail' , 
	{
		'token' : kget('op_token') , 
		'tid': tid
	} , function( data )
	{
		hide_float_message();
		
		var data_obj = $.parseJSON( data );
		console.log( data_obj );
	 
		if( data_obj.err_code != 0 )
		{
			float_message('云端同步失败',true);
		}
		else
		{
			// 载入模板
			$('#tdetailcontainer').html( $.tmpl( "tdetail_tpl" , {'item':data_obj.data} ) );
			$('#tdetail_footer').html( $.tmpl( "tdetail_footer_tpl" , {'item':data_obj.data} ) );
			if( typeof card != 'undefined' )
			{
				$("#detail_back_btn").unbind('click');
				$("#detail_back_btn").bind('click' , function(){ change_card(card) });
			}
			else
			{
				$("#detail_back_btn").unbind('click');
				$("#detail_back_btn").bind('click' , function(){ change_card('todo_card') });
			
			}
			
			
			$("li .tclist_avatar").each( function()
			{
				if( $(this).attr('data-src') )
					$(this).attr( 'src' , $(this).attr('data-src') );
			} );
			
			$("#tdetail_comment_list li").unbind( 'swipeRight dblclick' );
			$("#tdetail_comment_list li").bind( 'swipeRight dblclick' , function()
			{
				var hid = parseInt($(this).attr('hid'));
				if( hid < 1 ) return false;
				if( $(this).attr('htype') != '2' ) return false;
				
				tt_confirm( '删除评论【'+ $(this).find("span.content").text() +'】，继续？' , function()
				{
					$.post( base_url() + 'index.php?c=api&a=todo_remove_comment' , 
					{
						'token' : kget('op_token') , 
						'hid': hid
					} , function( data )
					{
						var data_obj = $.parseJSON( data );
						console.log( data_obj );
					 
						if( data_obj.err_code != 0 )
						{
							
							if( data_obj.err_code == 10009 )
								return float_message('只能删除自己的评论哦',true);
							else
								if( data_obj.err_code == LR_API_ARGS_ERROR ) 	
									float_message('参数丢失',true);
								else
									float_message('云端同步失败',true);
						}
						else
						{
							is_online = true;
							$("#tdc_" + hid ).remove();	
						}
						
						
						
					}  );
				} );
				
				
				
				
			});
			
			$("#tdetail_people_list li").each( function()
			{
				if( $(this).attr('data-src') )
					$(this).css( 'background-image' , 'url(' + $(this).attr('data-src') + ') ' );
			} );
			
			setTimeout(function () 
			{
				tdetailScroll.refresh();
			}, 0);
			
			change_card('tdetail_card');
			
		}
	});
	
	
}

function ttback()
{
	$(".op-card.cur input.backbtn").trigger('click');
}

function logout()
{
	tt_confirm( $.i18n._('退出后需要输入用户名和密码才能重新登入。继续吗?') , function()
	{
		logout_clean();
		change_page('index');
	} );
}

function logout_clean()
{
	window.localStorage.clear();
	db.transaction( function( tx )
	{
		tx.executeSql("DROP TABLE TODO " );
	} , db_error);
}


function ding()
{
	var url = './sound/ding.mp3';
	console.log(url);
	play_audio(url);
	//play_audio('../sound/ding.mp3');
}



function play_audio(url) 
{
   if( !on_phonegap )
   {
   		//tt_alert("not on phonegap");
   		console.log('not on phonegap');
   		return false ;
   } 
   
   var my_media = new Media(url,
        // success callback
        function() {
			//alert('ok');
		   console.log("playAudio():Audio Success");
        },
        // error callback
        function(err) {
            	//alert(err);
		
			console.log("playAudio():Audio Error: ");
			console.log( err );
    });

    // Play audio
    my_media.play();
}

function bind_all_todo()
{
	bind_todo();
	//bind_done_todo();
}

function float_menu_toggle()
{
	$('#tt_float_menu').toggle();
	if( $('#tt_float_menu').css('display') == 'none' )
	{
		$('#float_menu_icon').removeClass('icon-chevron-up');
		$('#float_menu_icon').addClass('icon-chevron-down');
	}
	else
	{
		$('#float_menu_icon').removeClass('icon-chevron-down');
		$('#float_menu_icon').addClass('icon-chevron-up');
	}
}

function bind_titles()
{
	$("#todo_title").bind( 'click' , function(){ float_menu_toggle() } );
	/*
	//$("#todo_title").bind( 'swipeLeft' , function(){ change_to_feed(); } );
	$("#todo_title").bind( 'swipeLeft' , function(){ change_to_members(); } );
	$("#todo_title").bind( 'swipeRight' , function(){ change_card('menu_card') } );
	
	
	$("#menu_title").bind( 'swipeLeft' , function(){ change_card('todo_card') } );
	
	$("#feed_title").bind( 'swipeRight' , function(){ change_card('todo_card') } );
	
	$("#feed_title").bind( 'swipeLeft' , function(){ change_to_members(); } );
	
	$("#todobox_title").bind( 'swipeDown' , function(){ change_card('todo_card') } );
	
	$("#notice_title").bind( 'swipeDown' , function(){ change_card('todo_card') } );
	
	//$("#members_title").bind( 'swipeRight' , function(){ change_to_feed(); } );
	$("#members_title").bind( 'swipeRight' , function(){ change_card('todo_card'); } );
	
	$("#minfo_title").bind( 'swipeRight' , function(){ change_card('members_card') } );
	
	$("#feed_title").bind( 'swipeRight' , function(){ change_card('todo_card'); } );
	
	$("#feed_title").bind( 'swipeLeft' , function(){ change_to_members(); } );
	*/
	
	
	
	

}


function todo_done( liid , callback  )
{
	var reg = /[0-9]+$/;
			
	tid = parseInt( reg.exec( liid ) );
	if( tid < 1 ) return false;
	// todo --> done
	// 更新本地
	db.transaction( function( tx )
	{
		tx.executeSql("UPDATE TODO SET status = 3 , is_sync = 0 WHERE tid = ? " , [tid]);
	} , db_error , function()
	{
		$('#todo_list_done').prepend($('#'+liid));
	
		bind_todo();
		setTimeout(function () 
		{
			todoScroll.refresh();
		}, 0);
		
		
		
		if( on_phonegap &&  !is_online )
		{
			// 离线状态
			offline_message('离线状态，连线后将同步到云端', true);
			return true;
		}
		
		// 开始同步远程数据
		$.post( base_url() + 'index.php?c=api&a=todo_done' , 
		{
			'token' : kget('op_token') , 
			'tid': tid
		} , function( data )
		{
			var data_obj = $.parseJSON( data );
			console.log( data_obj );
		 
			if( data_obj.err_code != 0 )
			{
				float_message('云端同步失败',true);
			}
			else
			{
				ding();
				//float_message('已同步至云端');
				// 同步成功 更新同步标记
				is_online = true;
					
				db.transaction( function( tx )
				{
					tx.executeSql("UPDATE TODO SET is_sync = 1 WHERE tid = ? " , [tid]);
				} , db_error ); 	
			}
			
			if( typeof callback == 'function' ) callback();
			
		}  );
	
	
	});
	
}

function bind_todo()
{
	$('#todo_list_star li a.item,#todo_list_normal li a.item').each( function()
	{
		$(this).unbind('swipeRight');
		$(this).bind('swipeRight',function(evt)
		{
			todo_done( this.parentNode.parentNode.parentNode.id );
		});
	});

	$('#todo_list_done li a.item').each( function()
	{
		$(this).unbind('swipeRight');
		$(this).bind('swipeRight',function(evt)
		{
			todo_remove( this.parentNode.parentNode.parentNode.id );
		});

		$(this).unbind('swipeLeft');
		$(this).bind('swipeLeft',function(evt)
		{
			todo_reopen( this.parentNode.parentNode.parentNode.id );
		});
	});

	/*
	$('#todo_list_star li a,#todo_list_normal li a').each( function()
	{
		$(this).one( 'swipeRight dblclick' , function(evt)
		{ 
			todo_done( this.parentNode.id );
	
		});
		
		$(this).one( 'click' , function(evt)
		{
			show_todo_detail( $('#'+this.parentNode.id).attr('tid') );
			evt.stopPropagation();
			return false;
		} );
		
		
		$('#'+this.parentNode.id).unbind('click');
		$('#'+this.parentNode.id).bind('click' , 	function( )
		{
			if( this.parentNode.id == 'todo_list_star' )
				todo_unstar( this.id );
			else	
				todo_star( this.id );

		});
		
	});*/
	$('#todo_list_star li a.item,#todo_list_normal li a.item,#todo_list_done li a.item').each( function()
	{
		// this -- > a 
		// this.parentNode --> .todo_row
		// this.parentNode.parentNode ---> .todo_fav
		// this.parentNode.parentNode.parentNode -----> li		

		$(this).unbind( 'click' );
		$(this).bind( 'click' , function(evt)
		{
			evt.stopPropagation();
			show_todo_detail( $('#'+this.parentNode.parentNode.parentNode.id).attr('tid') );
			return false;
		} );

		$(this.parentNode).unbind( 'click' );
		$(this.parentNode).bind( 'click' , function(evt)
		{
			// this -> .todo_row
			// this.parentNode -> todo_fi
			// this.parentNode.parentNode -> li

			evt.stopPropagation();
			
			if( this.parentNode.parentNode.parentNode.id != 'todo_list_done' )
			{
				if( this.parentNode.parentNode.parentNode.id == 'todo_list_star' )
					todo_unstar( this.parentNode.parentNode.id  );
				else
					todo_star( this.parentNode.parentNode.id );
			}

			

			return false;
		} );
		

		// this.parentNode.parentNode.parentNode --> li
		
		$('#'+this.parentNode.parentNode.parentNode.id).unbind('click');
		$('#'+this.parentNode.parentNode.parentNode.id).bind('click' , 	function( )
		{
			// this-> li

			if( this.parentNode.id == 'todo_list_done' )
			{
				todo_reopen( $(this).attr('id') );
			}
			else
			{
				todo_done( $(this).attr('id') );  
				// 
			}	
				

		});
		
	});
	
	
	setTimeout(function () 
	{
		todoScroll.refresh();
	}, 0);
}


function bind_follow_todo()
{
	$('#todo_list_follow li a.item').each( function()
	{
		$(this.parentNode).unbind( 'click' );
		$(this.parentNode).bind( 'click' , function(evt)
		{
			evt.stopPropagation();
			show_todo_detail( $('#'+this.parentNode.parentNode.id).attr('tid') );
			return false;
		} );

		$('#'+this.parentNode.parentNode.parentNode.id).unbind('click');
		$('#'+this.parentNode.parentNode.parentNode.id).bind('click' , 	function( )
		{
			if( $(this).hasClass('nofollow') )
				todo_follow( $(this).attr('id') );
			else
				todo_unfollow( $(this).attr('id') );	

		});
		
		
		
		
	});

	/*
	$('#todo_list_follow li a').each( function()
	{
		// 点击查看todo内容
		$(this).one( 'click' , function(evt)
		{
			show_todo_detail( $('#'+this.parentNode.id).attr('tid') );
			evt.stopPropagation();
			return false;
		} );
		
		// 点fllow标取消关注
		$('#'+this.parentNode.id).unbind('click');
		$('#'+this.parentNode.id).bind('click' , 	function( )
		{
			var tsid = this.id;
			tt_confirm( '取消关注此TODO，继续？' , function()
			{
				todo_unfollow( tsid );
			} );
			
			
			
		});
		
		
	});*/
}

function todo_reopen( liid , callback )
{
	var reg = /[0-9]+$/;
			
	tid = parseInt( reg.exec( liid ) );
	if( tid < 1 ) return false;
	// todo --> done
	// 更新本地
	db.transaction( function( tx )
	{
		tx.executeSql("UPDATE TODO SET status = 1 , is_sync = 0 WHERE tid = ? " , [tid]);
	} , db_error , function()
	{
		
		get_data( "SELECT is_star FROM TODO WHERE tid = ? " , [tid] , function( data )
		{
			if( data[0].is_star == 0 )
				$('#todo_list_normal').prepend($('#'+liid));
			else
				$('#todo_list_star').prepend($('#'+liid));
	
			bind_todo();
			
			setTimeout(function () 
			{
				todoScroll.refresh();
				todoScroll.scrollToElement( '#'+liid , 500);
			}, 0);
			
			
			
			// 如果是本地todo					
			if( liid != 't-'+tid ) return true;
			
			if( on_phonegap &&  !is_online )
			{
				// 离线状态
				offline_message('离线状态，连线后将同步到云端', true);
				return true;
			}
			
			// 开始同步远程数据
			$.post( base_url() + 'index.php?c=api&a=todo_reopen' , 
			{
				'token' : kget('op_token') , 
				'tid': tid
			} , function( data )
			{
				var data_obj = $.parseJSON( data );
				console.log( data_obj );
			 
				if( data_obj.err_code != 0 )
				{
					float_message('云端同步失败',true);
				}
				else
				{
					is_online = true;
					ding();
					//float_message('已同步至云端');
					// 同步成功 更新同步标记
					db.transaction( function( tx )
					{
						tx.executeSql("UPDATE TODO SET is_sync = 1 WHERE tid = ? " , [tid]);
					} , db_error ); 

					if( typeof callback == 'function' ) callback();	
				}
				
				
				
			}  );	
		});
		
		
	
	
	});
}


/*
function bind_done_todo()
{
	$('#todo_list_done li a.item').each( function()
	{
		//  swipeRight
		// swipeRight 
		
		
		$(this).one( 'swipeLeft' , function()
		{ 
			todo_reopen( this.parentNode.parentNode.id ) ;		
		});
		
		$(this).unbind( 'swipeRight' );
		$(this).bind( 'swipeRight' , function(evt)
		{
			var tsid = this.parentNode.id;
			//todo_reopen( tsid );
			tt_confirm( '移除后不可恢复，继续？' , function()
			{
				todo_remove( tsid );
			} );
		});
		
		
		
		$('#'+this.parentNode.id).unbind('click');
		$('#'+this.parentNode.id).bind('click' , 	function( )
		{
			var tsid = this.id;
			tt_confirm( '移除后不可恢复，继续？' , function()
			{
				todo_remove( tsid );
			} );
		});
	});
	
	setTimeout(function () 
	{
		todoScroll.refresh();
	}, 0);
}
*/

function todo_star( liid  )
{
	var reg = /[0-9]+$/;
			
	tid = parseInt( reg.exec( liid ) );
	if( tid < 1 ) return false;
	
	// 更新本地数据
	db.transaction( function( tx )
	{
		tx.executeSql("UPDATE TODO SET is_star = 1, is_sync = 0 WHERE tid = ? " , [tid]);
	} , db_error , function()
	{
		$('#todo_list_star').prepend($('#'+liid));
		
		bind_todo();
			
		setTimeout(function () 
		{
			todoScroll.refresh();
			todoScroll.scrollToElement( '#'+liid , 500);
		}, 100);
		
		
		
		// 如果是本地todo					
		if( liid != 't-'+tid ) return true;
		
		if( on_phonegap &&  !is_online )
		{
			// 离线状态
			offline_message('离线状态，连线后将同步到云端', true);
			return true;
		}
		
		// 开始同步远程数据
		$.post( base_url() + 'index.php?c=api&a=todo_star' , 
		{
			'token' : kget('op_token') , 
			'tid': tid
		} , function( data )
		{
			var data_obj = $.parseJSON( data );
			console.log( data_obj );
		 
			if( data_obj.err_code != 0 )
			{
				float_message('云端同步失败',true);
			}
			else
			{
				ding();
				is_online = true;
							
				//float_message('已同步至云端');
				// 同步成功 更新同步标记
				db.transaction( function( tx )
				{
					tx.executeSql("UPDATE TODO SET is_sync = 1 WHERE tid = ? " , [tid]);
				} , db_error ); 	
			}	
		}  );	
	});	
}

function todo_unstar( liid  )
{
	var reg = /[0-9]+$/;
	
			
	tid = parseInt( reg.exec( liid ) );
	if( tid < 1 ) return false;
	
	// 更新本地数据
	db.transaction( function( tx )
	{
		tx.executeSql("UPDATE TODO SET is_star = 0, is_sync = 0 WHERE tid = ? " , [tid]);
	} , db_error , function()
	{
		$('#todo_list_normal').prepend($('#'+liid));
		
		bind_todo();
			
		setTimeout(function () 
		{
			todoScroll.refresh();
		}, 0);
		
		
		
		// 如果是本地todo					
		if( liid != 't-'+tid ) return true;
		
		if( on_phonegap &&  !is_online )
		{
			// 离线状态
			offline_message('离线状态，连线后将同步到云端', true);
			return true;
		}
		
		// 开始同步远程数据
		$.post( base_url() + 'index.php?c=api&a=todo_unstar' , 
		{
			'token' : kget('op_token') , 
			'tid': tid
		} , function( data )
		{
			var data_obj = $.parseJSON( data );
			console.log( data_obj );
		 
			if( data_obj.err_code != 0 )
			{
				float_message('云端同步失败',true);
			}
			else
			{
				is_online = true;
				ding();			
				//float_message('已同步至云端');
				// 同步成功 更新同步标记
				db.transaction( function( tx )
				{
					tx.executeSql("UPDATE TODO SET is_sync = 1 WHERE tid = ? " , [tid]);
				} , db_error ); 	
			}	
		}  );	
	});	
}


function todo_unfollow( liid , callback )
{
	var reg = /[0-9]+$/;
	
	tid = parseInt( reg.exec( liid ) );
	if( tid < 1 ) return false;
	
	db.transaction( function( tx )
	{
		tx.executeSql("UPDATE TODO SET is_follow = 0, is_sync = 0 WHERE tid = ? " , [tid]);
	} , db_error , function()
	{
		$('#'+liid).remove();
			
		setTimeout(function () 
		{
			todoScroll.refresh();
		}, 0);
		
		
		
		// 如果是本地todo					
		if( liid != 't-'+tid ) return true;
		
		if( on_phonegap &&  !is_online )
		{
			// 离线状态
			offline_message('离线状态，连线后将同步到云端', true);
			return true;
		}
		
		// 开始同步远程数据
		$.post( base_url() + 'index.php?c=api&a=todo_unfollow' , 
		{
			'token' : kget('op_token') , 
			'tid': tid
		} , function( data )
		{
			var data_obj = $.parseJSON( data );
			console.log( data_obj );
		 
			if( data_obj.err_code != 0 )
			{
				float_message('云端同步失败',true);
			}
			else
			{
				is_online = true;
				ding();	
				float_message('云端已同步');
				// 同步成功 更新同步标记
				db.transaction( function( tx )
				{
					tx.executeSql("UPDATE TODO SET is_sync = 1 WHERE tid = ? " , [tid]);
				} , db_error ); 

				if( typeof callback == 'function' ) callback();		
			}	
		}  );	
	});	
}


function todo_remove( liid  )
{
	var reg = /[0-9]+$/;
	
			
	tid = parseInt( reg.exec( liid ) );
	if( tid < 1 ) return false;
	
	// 更新本地数据
	db.transaction( function( tx )
	{
		tx.executeSql("UPDATE TODO SET is_delete = 1, is_sync = 0 WHERE tid = ? " , [tid]);
	} , db_error , function()
	{
		$('#'+liid).remove();
		//bind_done_todo();
			
		setTimeout(function () 
		{
			todoScroll.refresh();
		}, 0);
		
		
		
		// 如果是本地todo					
		if( liid != 't-'+tid ) return true;
		
		if( on_phonegap &&  !is_online )
		{
			// 离线状态
			offline_message('离线状态，连线后将同步到云端', true);
			return true;
		}
		
		// 开始同步远程数据
		$.post( base_url() + 'index.php?c=api&a=todo_remove' , 
		{
			'token' : kget('op_token') , 
			'tid': tid
		} , function( data )
		{
			var data_obj = $.parseJSON( data );
			console.log( data_obj );
		 
			if( data_obj.err_code != 0 )
			{
				float_message('云端同步失败',true);
			}
			else
			{
				is_online = true;
				ding();	
				float_message('云端已同步删除');
				// 同步成功 更新同步标记
				db.transaction( function( tx )
				{
					tx.executeSql("UPDATE TODO SET is_sync = 1 WHERE tid = ? " , [tid]);
				} , db_error ); 	
			}	
		}  );	
	});	
}


function cast_add()
{
	var text = $("#cast_text").val();
	if( text.length < 3 ) return tt_alert($.i18n._('多写几个字嘛~'));
	
	if( on_phonegap &&  !is_online )
	{
		float_message('离线不能发广播，联网后再试' , true );
		return false;
	}
	
	$.post( base_url() + 'index.php?c=api&a=feed_publish' , {'token' : kget('op_token') , 'text':text   } , function( data )
	{
		
		var data_obj = $.parseJSON( data );
		console.log( data_obj );
	 
		if( data_obj.err_code != 0 )
		{
			float_message('云端同步失败',true);
			return false;
		}
		else
		{
			is_online = true;
			
			$("#cast_text").val('');
			float_message('已同步至云端');
			change_to_feed();
		}
		
	}  );
	
}


function todo_add()
{
	var text = $('#todo_text').val();
	if( text.length < 1 ) return tt_alert($.i18n._('TODO不能为空~'));
	
	var is_public = 1;
	if( parseInt($("#private_value").val()) == 1 )
	is_public = 0;
	
	// 查询本地数据库是否已经存在
	get_data("SELECT * FROM TODO WHERE content = ? AND status != 3" , [ text ] , function( data )
	{
		console.log(data);
		
		if( data != false )
		{
			tt_alert('同样的TODO已存在了哦，先完成了再添加吧');
			return false;
		}
		else
		{
			// 先放入本地数据库
			db.transaction( function( tx )
			{
				tx.executeSql("INSERT OR REPLACE INTO TODO (  tid , content , is_star , is_public , is_delete , is_sync , sync_error , status  ) VALUES (  ? , ? , ? , ? , ? , ? , ? , ? )" , 
				[
					0 ,
					text ,
					0 ,
					is_public ,
					0,
					0,
					0,
					1 
				]
				
				);
				
				
				
			}, db_error , function()
			{
				get_data("SELECT last_insert_rowid() as ltid FROM TODO LIMIT 1" , [] , function( ltidinfo )
				{
					var ltid = ltidinfo[0].ltid;
					if( ltid > 0 )
					{
						// ltid正确，于是将tid更新为-ltid,这样就不会重复
						
						db.transaction( function( tx )
						{
							tx.executeSql("UPDATE TODO SET tid = ? WHERE id = ? " , [ -ltid , ltid ] ); 
								
						}, db_error , function()
						{
							// 更新本地显示
							change_card('todo_card');
							
							var style = 'red';
							if( is_public == 1 )
							{
								style = 'blue';
							}
							
							$('#todo_list_normal').prepend($('<li class="'+ style +'" id="lt-' + ltid + '" tid="'+ ltid +'"><div class="todo_fi"><div class="todo_row"><a href="javascript:void(0);" class="item"><img id="t-img" src="image/ring.png" />'+ text +'</a></div></div></li>'));
						
							bind_todo();
							setTimeout(function () 
							{
								//console.log( todoScroll );
								if( todoScroll.scrollerH > 400 )
									todoScroll.scrollToElement( '#lt-'+ltid , 500);
							}, 100);
							
							
							
							
							$('#todo_text').val('');
							
							// 三十超时后去掉加载图像
							setTimeout(function () 
							{
								$('img#t-img').remove();
							}, 30000);
							
							
							if( on_phonegap )
							{
								if( navigator.network.connection.type == Connection.NONE || navigator.network.connection.type == Connection.UNKNOWN )
								{
									$('li#lt-'+ltid).addClass('yellow');
									$('img#t-img').remove();
									
									offline_message('网络不可用，将稍后同步',true);
									
									
									// 开启同步错误标志
									kset('op_sync_error_flag' , 1 );
									return false;
								}
								
								if( on_phonegap &&  !is_online )
								{
									// 离线状态
									$('li#lt-'+ltid).addClass('yellow');
									$('img#t-img').remove();
									offline_message('离线状态，连线后将同步到云端', true);
									return true;
								}
							}
							
							// 同步到服务器
							try
							{	
								$.post( base_url() + 'index.php?c=api&a=todo_add' , {'token' : kget('op_token') , 'text':text , 'is_public':is_public  } , function( data )
								{
									
									var data_obj = $.parseJSON( data );
									console.log( data_obj );
								 
									if( data_obj.err_code != 0 )
									{
										float_message('云端同步失败',true);
										// TODO 添加同步尝试计数次数
										$('img#t-img').remove();
										// 同步失败
										kset('op_sync_error_flag' , 1 );
										return false;
									}
									else
									{
										ding();
										// add to todo list
										if(  data_obj.data.content != text )
										{
											float_message('云端同步失败',true);
											// TODO 添加同步尝试计数次数
											$('img#t-img').remove();
											return false;
										}
										//alert( '成功同步' );
										$('li#lt-'+ltid).attr('id' , 't-'+data_obj.data.tid  );
										$('li#t-'+data_obj.data.tid).attr('tid',data_obj.data.tid);
										$('img#t-img').remove();
										
										is_online = true;
										//float_message('已同步至云端');
										// 更新本地数据表
										
										db.transaction( function( tx )
										{
											tx.executeSql("UPDATE TODO SET is_sync = 1 , tid = ? WHERE id = ? " , [ data_obj.data.tid , ltid ] ); 
											
										}, db_error );
										
									}
									
								}  );	
							
							}
							catch( err )
							{
								alert(err);
							}		
						} );
					}
				} );
			} );
		}
	} );
	
	
}

function todobox()
{
	change_card('todobox_card');
	
	var textArea = document.getElementById('todo_text'), oldContent = textArea.value;
	textArea.value = oldContent + '';
	textArea.focus();
	textArea.selectionStart = textArea.selectionEnd = textArea.value.length;

	
}

function castbox()
{
	change_card('castbox_card');
	
	var textArea = document.getElementById('cast_text'), oldContent = textArea.value;
	textArea.value = oldContent + '';
	textArea.focus();
	textArea.selectionStart = textArea.selectionEnd = textArea.value.length;
}

function toggle_private()
{
	if( $("#todo_private_btn").hasClass('theblue') )
	{
		$("#todo_private_btn").removeClass('theblue');
		$("#private_value").val(1);
		$("#todo_private_btn").addClass('thered');
		$('#private_btn_text').text('仅自己可见');
	}
	else
	{
		$("#todo_private_btn").removeClass('thered');
		$("#private_value").val(0);
		$("#todo_private_btn").addClass('theblue');
		$('#private_btn_text').text('团队成员可见');
	
	}
}

function change_password()
{
	change_card('password_card');
	$("#passwordmain").html( $.tmpl( "passwordmain_tpl" , {} ) );

}

function update_password()
{
	if( $("#pf_opassword").val() == '' )
	{
		tt_alert('原密码不能为空');
		return false;
	} 
	
	if( $("#pf_password1").val() == '' )
	{
		tt_alert('新密码不能为空');
		return false;
	} 
	
	
	if( $("#pf_password1").val() != $("#pf_password2").val() )
	{
		tt_alert('两次输入的密码不同');
		return false;
	} 
	
	$.post( base_url() + 'index.php?c=api&a=user_update_password' , 
	{
		'token' : kget('op_token') ,
		'opassword': $("#pf_opassword").val(),
		'password': $("#pf_password1").val(),	
	} , function( data )
	{
		var data_obj = $.parseJSON( data );
		console.log( data_obj );
	 
		if( data_obj.err_code != 0 )
		{
			tt_alert( data_obj.err_msg );
			return false;

		}
		else
		{
			tt_alert( '更新密码成功，请使用新密码重新登入' );
			logout_clean();
			change_page('index');
		}
		
	});	
}



function change_to_profile()
{
	// 从数据库中取得
	get_data( "SELECT * FROM MEMBERS WHERE uid = ? " , [ kget('op_uid') ] , function( data )
	{
		console.log(data[0]);
		change_card('profile_card');
		$("#profilemain").html( $.tmpl( "profilemain_tpl" , {'item':data[0]} ) );
	
	
	});
	
}

function update_profile()
{
	$.post( base_url() + 'index.php?c=api&a=user_update_profile' , 
	{
		'token' : kget('op_token') ,
		'mobile': $("#pf_mobile").val(),
		'email': $("#pf_email").val(),	
		'tel': $("#pf_tel").val(),
		'weibo': $("#pf_weibo").val(),
		'eid': $("#pf_eid").val(),
		'desp': $("#pf_desp").val(),
	} , function( data )
	{
		var data_obj = $.parseJSON( data );
		console.log( data_obj );
	 
		if( data_obj.err_code != 0 )
		{
			float_message('云端同步失败',true);
		}
		else
		{
			load_remote_members( function()
			{
				load_user_detail( kget('op_uid') , 'profile_card');
			});
		}
		
	});	
}


function change_to_members()
{
	change_card('members_card');
	
	if( !member_inited )
	{
		members_init();
		member_inited = true;
	}
	
	
}


function load_remote_members( callback , show_notice )
{
	if(show_notice == 1) float_message('读取云端数据中，请稍候',false,true);
	
	$.post( base_url() + 'index.php?c=api&a=team_members' , 
		{
			'token' : kget('op_token') 
		} , function( data )
		{
			var data_obj = $.parseJSON( data );
			console.log( data_obj );
		 
			if( data_obj.err_code != 0 )
			{
				float_message('云端同步失败',true);
			}
			else
			{
				hide_float_message();
				// 清空本地数据库
				db.transaction( function( tx )
				{
					tx.executeSql("DELETE FROM MEMBERS ");
					tx.executeSql("DELETE FROM sqlite_sequence WHERE name = 'MEMBERS'");
				} , db_error , function()
				{
					// 先放入本地数据库
					db.transaction( function( tx )
					{
						for( var i = 0 ; i < data_obj.data.length ; i++  )
						{
							tx.executeSql("INSERT OR REPLACE INTO MEMBERS (  uid , name , email , avatar_small , level , mobile , tel , eid , weibo , desp  ) VALUES (  ? , ? , ? , ? , ? , ? , ? , ? , ?,? )" , 
							[
								data_obj.data[i].id ,
								data_obj.data[i].name ,
								data_obj.data[i].email ,
								data_obj.data[i].avatar_small ,
								data_obj.data[i].level ,
								data_obj.data[i].mobile,
								data_obj.data[i].tel,
								data_obj.data[i].eid,
								data_obj.data[i].weibo ,
								data_obj.data[i].desp
							]
							
							);
						}
						
						
					}, db_error , function()
					{
						// success
						if( typeof callback == 'function' )
						{
							callback();
						}
						else
						{
							//float_message('团队成员同步完成');
							show_local_members( );
						}
						
					} );
				
				
				});
				
				//float_message('已同步至云端');
				// 同步成功 更新同步标记
				is_online = true;
					
				
			}
			
			
			
		}  );
	
}

function members_init( callback )
{
	// 如果是联网状态
	// 自动更新云端数据
	if( on_phonegap && !is_online )
	{
		// 手机离线状态
		// 直接显示本地数据
		// 有可能没数据
		show_local_members();
	}
	else
	{
		// 从云端抓取数据
		load_remote_members( callback );
		
	}
}

function sms_box()
{
	change_card('smsbox_card');
	
	var textArea = document.getElementById('sms_text'), oldContent = textArea.value;
	textArea.value = oldContent + '';
	textArea.focus();
	textArea.selectionStart = textArea.selectionEnd = textArea.value.length;

}

function sms_send()
{
	var text = $("#sms_text").val();

	if( text.length < 2 )
	{
		tt_alert('短信内容不能少于3个字');
		return false;
	}

	if( sina.sms )
	{
		//
		get_data( "SELECT * FROM MEMBERS " , [] , function( data )
		{
			// 渲染
			var i = 0;
			var ii = 0;
			for( j =0 ; j < data.length ; j++ )
			{
				
				var item = data[j];
				
				if( item.mobile && item.mobile.length > 10  )
				{
					i++;
					sina.sms.send( item.mobile , text+'[TT]', 
					function(){ii++;},
					function()
					{ 
						float_message( item.name +'发送失败' );	
					} );
				}
			}

			if(  i == 0 ) float_message( '没有可用的电话号码' );	

			setTimeout( function()
			{
				if( i == ii ) 
					float_message( i + '条短信已发送,全部成功' );
				else
					float_message( i + '条短信已发送,'+ ii +'条成功' );
			} , 3000 );

			float_message( '发送中...' );	

			

		} );

		change_card('members_card');
	}
	else
	{
		tt_alert('您的应用版本不支持短信发送');
	}
}

function show_local_members()
{
	get_data( "SELECT * FROM MEMBERS " , [] , function( data )
	{
		// 渲染
		$("#members_list").empty();
		$("#members_list").html( $.tmpl("members_list_tpl" , {'items':data}) );
		
		$('#members_list li').each( function()
		{
			if( $(this).attr('data-src') )
			{
				$(this).css( 'background-image' , 'url('+$(this).attr('data-src') + ')' );
			}
			
		});
		
		setTimeout(function () 
		{
			membersScroll.refresh();
		}, 0);
		
		// bind_members();		
	}  );
}

function todo_add_comment( tid )
{
	//alert('123'+tid);
	//$("#tcomment_box").html( $.tmpl( 'tcomment_box_tpl' , { 'tid':tid } ) );
	$("#tcomment_tid").val(tid);
	change_card('tcomment_card');
	
	var textArea = document.getElementById('comment_text'), oldContent = textArea.value;
	textArea.value = oldContent + '';
	textArea.focus();
	textArea.selectionStart = textArea.selectionEnd = textArea.value.length;
	
}

function todo_save_comment()
{
	var tid = $("#tcomment_tid").val();
	if( parseInt(tid) < 1 ) return tt_alert($.i18n._('TID丢失~'));
	var text = $("#comment_text").val();
	if( text.length < 3 ) return tt_alert($.i18n._('多写几个字嘛~'));
	
	if( on_phonegap &&  !is_online )
	{
		float_message('离线不能发评论，联网后再试' , true );
		return false;
	}
	
	$.post( base_url() + 'index.php?c=api&a=todo_add_comment' , {'token' : kget('op_token') , 'text':text , 'tid':tid  } , function( data )
	{
		
		var data_obj = $.parseJSON( data );
		console.log( data_obj );
	 
		if( data_obj.err_code != 0 )
		{
			float_message('云端同步失败',true);
			return false;
		}
		else
		{
			is_online = true;
			// 重新显示页面
			show_todo_detail(tid);
			//$("#tdetail_comment_list").prepend(  );
			//alert($.tmpl( "tdetail_history_item_tpl" , {'item':data_obj.data}  ));
			
			
			
			
			$("#comment_text").val('');
			//float_message('已同步至云端');
			// 更新本地数据表
			
			
		}
		
	}  );
	
	
	
}

function todo_public( liid , callback )
{
	return todo_set_value( liid , 'is_public' , 1 , 'public' , callback  );
}

function todo_private( liid , callback )
{
	return todo_set_value( liid , 'is_public' , 0 , 'private' , callback  );
}

function todo_follow( liid , callback )
{
	return todo_set_value( liid , 'is_follow' , 1 , 'follow' , callback  );
}

/*
function todo_unfollow( liid , callback )
{
	return todo_set_value( liid , 'is_follow' , 0 , 'unfollow' , callback  );
}
*/

function todo_set_value( liid , k , v , api , callback )
{
	var reg = /[0-9]+$/;
	
	tid = parseInt( reg.exec( liid ) );
	if( tid < 1 ) return false;
	
	// 更新本地数据
	db.transaction( function( tx )
	{
		tx.executeSql("UPDATE TODO SET " + k + " = " + v + ", is_sync = 0 WHERE tid = ? " , [tid]);
	} , db_error , function()
	{
		
		// 如果是本地todo					
		if( liid != 't-'+tid ) return true;
		
		if( on_phonegap &&  !is_online )
		{
			// 离线状态
			offline_message('离线状态，连线后将同步到云端', true);
			return true;
		}
		
		// 开始同步远程数据
		$.post( base_url() + 'index.php?c=api&a=todo_' + api , 
		{
			'token' : kget('op_token') , 
			'tid': tid
		} , function( data )
		{
			var data_obj = $.parseJSON( data );
			console.log( data_obj );
		 
			if( data_obj.err_code != 0 )
			{
				float_message('云端同步失败',true);
			}
			else
			{
				is_online = true;
				ding();	
				float_message('云端已同步');
				show_local_todo();
				// 同步成功 更新同步标记
				db.transaction( function( tx )
				{
					tx.executeSql("UPDATE TODO SET is_sync = 1 WHERE tid = ? " , [tid]);
				} , db_error ); 

				if( typeof callback == 'function' ) callback();	
			}	
		}  );	
	});	
}

function todo_assign( tid  )
{
	return choose_member(function(data)
	{
		if( data.length == 1 )
		{
			var uid = data[0].uid;
			
			if( uid == kget('op_uid') )
			{
				tt_alert( '不要选自己啦' );
				return false;
			}
			
			// post to cloud
			$.post( base_url() + 'index.php?c=api&a=todo_assign' , {'token' : kget('op_token')  , 'tid':tid , 'uid':uid  } , function( data )
			{
				var data_obj = $.parseJSON( data );
				
				if( data_obj.err_code != 0 )
				{
					float_message('云端同步失败',true);
					change_card('tdetail_card');
					return false;
				}
				else
				{
					// 更新本地数据
					db.transaction( function( tx )
					{
						tx.executeSql("UPDATE TODO SET is_follow = 1 WHERE tid =  " + tid );
					} , db_error , function()
					{
						show_todo_detail( tid );
						show_local_todo();	
					});
					
					
				}
				// 
				
			});
			
			
			
		}
		else
		{
			tt_alert('只能选择一个人');
		}
		
		
	} , 'tdetail_card' );
}

function set_at( objname , backcard )
{
	// comment_text
	// tcomment_card
	return choose_member(function(data)
	{
		if( data.length > 0 )
		{
			for( var i = 0 ; i < data.length ; i++ )
			{
				$("#"+objname).val( $("#"+objname).val() + ' @'+data[i].name+' ' );
			}
		}
		
		change_card(backcard);
		var textArea = document.getElementById(objname), oldContent = textArea.value;
		textArea.value = oldContent + '';
				
		textArea.focus();
		textArea.selectionStart = textArea.selectionEnd = textArea.value.length;
		
	} , backcard );
}

// 打开并选择指定的用户，可以多选
function choose_member( callback , card_name )
{
	// 从本地取数据
	get_data( "SELECT * FROM MEMBERS " , [] , function( data )
	{
		if( data.length < 1 )
		{
			member_init( function(){ choose_member(callback) } );
			return true;
		}
		else
		{
			$('#mlist_list').html($.tmpl('mlist_tpl' , { 'items':data}  ));
			
			change_card('mlist_card');
			$('#mlist_list li').each( function()
			{
				if( $(this).attr('data-src') )
				{
					$(this).css( 'background-image' , 'url('+$(this).attr('data-src') + ')' );
				}
				
				$(this).unbind('click');
				$(this).bind('click' , function(evt)
				{
					if( $(this).hasClass('selected') )
						$(this).removeClass('selected');
					else
						$(this).addClass('selected');
						
					evt.stopPropagation();
					return false;	
				});	
			});
			
			
			
			$("#btn_member_chooser_cancel").one('click',function()
			{
				change_card( card_name );
			});
			
			$("#btn_member_chooser_save").one('click' , function()
			{
				var ret = [];
				$('li.selected').each(function()
				{
					ret.push( { 'uid':$(this).attr('data-uid') ,
							  'name':$(this).attr('data-name') 	
					} );
				});
				
				console.log( ret );	
				if( typeof callback == 'function' )
					callback(ret);
				
			});
			
			
			setTimeout( function()
			{
				mlistScroll.refresh();
			} , 0 );

		//
		}
	
	}  );
	
	
	
	
	
	//$('#mlist_card').show();
}

function close_member_chooser()
{
	change_card('tcomment_card');
}

function check_notice()
{
	//$() user_unread
	$.post( base_url() + 'index.php?c=api&a=user_unread' , {'token' : kget('op_token')   } , function( data )
	{
		var data_obj = $.parseJSON( data );
		console.log( data_obj );
		
		if( data_obj.err_code != 0 )
		{
			console.log('检查最新数据出错');	
		}
		else
		{
			show_notice_count( data_obj.data.notice );
		}
		
	});
}

function noticebox()
{
	change_card('notice_card');
	$("#notice_list").empty();
	load_notice();	
}

function mark_read( nid )
{
	float_message('正在和云端通信');
	
	$.post( base_url() + 'index.php?c=api&a=notice_mark_read' , {'token' : kget('op_token') , 'nid':nid   } , function( data )
	{
		var data_obj = $.parseJSON( data );
		console.log( data_obj );
		
		if( data_obj.err_code != 0 )
		{
			float_message('云端同步错误稍后再试',true);
			
		}
		else
		{
			if( parseInt( nid ) > 0 )
			{
			
			}
			else
			{
				noticebox();
				show_notice_count(0);
			}
			
		}
		
	});
}

function load_notice( max_id )
{
	float_message('读取云端数据中，请稍候',false,true);

	if( parseInt(max_id) > 0 ) $('#notice_more_btn').html("<a href='#'>Loading...</a>");  
	
	$.post( base_url() + 'index.php?c=api&a=notice_list' , {'token' : kget('op_token') , 'max_id':max_id  } , function( data )
	{
		hide_float_message();
		
		var data_obj = $.parseJSON( data );
		console.log( data_obj );
		
		if( data_obj.err_code != 0 )
		{
			$('#notice_more_btn').text("加载更多"); 
			//console.log('检查最新数据出错');	
			if( data_obj.err_code == 10007 )
			{
				if( parseInt( max_id ) > 0 )
				{
					float_message('没有更多的通知了',true);
					$("#notice_list li.notice_more").remove();
					return false;
				}
				else
				{
					float_message('还没有通知呢',true);
					return false;
				}
				
				
			}
			else
			{
				float_message('云端同步失败，请稍后再试',true);
				//change_card('todo_card');
				return false;
			}
		}
		else
		{
			$("#notice_list li.notice_more").remove();
			$("#notice_list").html( $("#notice_list").html() + $.tmpl("notice_list_tpl" ,  {'items':data_obj.data.items , 'max':data_obj.data.max , 'min':data_obj.data.min , 'more':data_obj.data.more } ) );
			
			$("#notice_list li").each(function()
			{
				if( $(this).attr("tid") )
				{
					$(this).unbind('click');
					$(this).bind('click',function()
					{
						mark_read($(this).attr("nid"));
						show_todo_detail( $(this).attr("tid") , 'notice_card' );
						check_notice();
					});
				}
			});
			
			setTimeout( function()
			{
				noticeScroll.refresh();
				noticeScroll.scrollTo(0, 0, 200); 
			} , 0 );
			change_card('notice_card');
		}
		
	});
}

function show_notice_count( count )
{
	if( count == 0 )
	{
		$('#notice_count').html(0);
		$('#notice_count').hide();
	}
	else
	{
		if( count > 9 ) count = 'N';
		$('#notice_count').html(count);
		$('#notice_count').show();
	}
}


function show_feed_list( max_id )
{
	float_message('读取云端数据中，请稍候',false,true);
	
	if( parseInt(max_id) > 0 ) $('#feed_more_btn').html("<a href='#'>Loading...</a>");  
	
	
	$.post( base_url() + 'index.php?c=api&a=feed_list' , {'token' : kget('op_token') , 'max_id':max_id  } , function( data )
	{
		hide_float_message();
		
		var data_obj = $.parseJSON( data );
		
		console.log( data_obj );
		
		if( typeof max_id == 'undefined' )
			$("#feed_list").html('');
		
		
		if( data_obj.err_code != 0 )
		{
			$('#feed_more_btn').text("加载更多"); 
			
			if( data_obj.err_code == 10007 )
			{
				if( parseInt( max_id ) > 0 )
				{
					float_message('没有更多的动态了',true);
					$("#feed_list li.feed_more").remove();
					return false;
				}
				else
				{
					float_message('还有没动态呢',true);
					return false;
				}
				
				
			}
			else
			{
				float_message('云端同步失败，请稍后再试',true);
				//change_card('todo_card');
				return false;
			}
			
			
			
		}
		else
		{
			
			$("#feed_list li.feed_more").remove();
			$("#feed_list").html( $("#feed_list").html() + $.tmpl( 'feed_list_tpl' , {'items':data_obj.data.items , 'max':data_obj.data.max , 'min':data_obj.data.min , 'more':data_obj.data.more  } ) );
			
			var now=new Date();
			$('#cover_time').html( (now.getMonth()+1)+'月'+now.getDate()+'日');
			// 更新头像
			$('#feed_list li div.list_avatar').each( function()
			{
				
				if( $(this).attr('data-src') )
				{
					$(this).css( 'background-image' , 'url('+$(this).attr('data-src') + ')' );
				}

			});
			
			$( '#feed_list li' ).each(function()
			{
				if( $(this).attr('type') == 3 )
				{
					// user
					if( $(this).attr('uid') > 0 )
					{
						$(this).unbind('click');
						$(this).bind('click' , function()
						{
							//alert( $(this).attr('tid') );	
							load_user_detail( $(this).attr('uid') , 'feed_card'  );
						});
					}
				}
				
				if( $(this).attr('type') == 2 )
				{
					// todo
					if( $(this).attr('tid') > 0 )
					{
						$(this).unbind('click');
						$(this).bind('click' , function()
						{
							//alert( $(this).attr('tid') );	
							show_todo_detail( $(this).attr('tid') , 'feed_card'  );
						});
					}
				}
				
				
			});

			
			
			setTimeout( function()
			{
				feedScroll.refresh();
			} , 0 );
			
			
		}
		// 
		
	});
}

function mlist_select(obj)
{
	if($(obj).parentNode.hasClass('selected'))
		$(obj).parentNode.removeClass('selected');
	else	
		$(obj).parentNode.addClass('selected');
}

function load_user_detail( uid , callback_card )
{
	// 查询本地数据库
	get_data( "SELECT * FROM MEMBERS WHERE uid = ? " , [uid] , function( data )
	{
		data = data[0];
		show_user_detail( uid , data.level , data.name , data.avatar_small , data.email , data.mobile , data.tel , data.eid , data.weibo , data.desp , callback_card );
	});
}

function show_user_detail( uid , level ,  name , avatar , email , mobile , tel , eid , weibo , desp , callback_card   )
{
	//minfo_tpl
	$("#minfomain").html( $.tmpl("minfo_tpl" , { 
		'uid':uid,
		'level':level,
		'name': name ,  
		'avatar':avatar,
		'email': email ,  
		'mobile': mobile ,  
		'tel': tel ,  
		'eid': eid ,  
		'weibo': weibo ,  
		'desp': desp 
	}) );
	// 
	//$('#minfo_title').text(name);
	if( avatar )
		$('#minfo_avatar').attr( 'src' , avatar );
		
	if( typeof callback_card != 'undefined' )
	{
		$('#minfo_back').unbind( 'click' );
		$('#minfo_back').bind( 'click' , function()
		{
			change_card(callback_card);
		} );
		
	}
	else
	{
		$('#minfo_back').unbind( 'click' );
		$('#minfo_back').bind( 'click' , function()
		{
			change_card('members_card')
		} );
	
	}	
	
	change_card('minfo_card');
	
	//alert( name );
}

function close_user( uid )
{
	tt_confirm("确定要关闭此账号？" , function()
	{
		user_level( uid , 0 );
	}  );
	
}

function normal_user( uid )
{
	tt_confirm("确定要将此账号降为普通用户？" , function()
	{
		user_level( uid , 1 );
	}  );
}


function admin_user( uid )
{
	tt_confirm("确定要将此账号提升为管理员？" , function()
	{
		user_level( uid , 9 );
	}  );
}

function user_level( uid , level )
{
	float_message('更新云端数据中',0,1);
	
	$.post( base_url() + 'index.php?c=api&a=user_level' , {'token':kget('op_token')  , 'uid':uid , 'level':level   } , function( data )
	{
		var data_obj = $.parseJSON( data );
		console.log( data_obj );
		if( data_obj.err_code == 0 )
		{
			float_message('云端更新成功');
			load_remote_members( function()
			{
				if( level != 0  )
					load_user_detail( uid , 'members_card');
				else
				{	
					show_local_members( );
					change_card('members_card');
				}
			});
		}
		else
		{
			float_message('云端更新失败');
		}
			
	} );
}

function tdeail_reopen( tid  )
{
	todo_reopen('t-'+tid , function()
	{
		show_todo_detail( tid );
	} );
}

function tdeail_done( tid )
{
	todo_done('t-'+tid , function()
	{
		show_todo_detail( tid );
	}  );
}

function tdeail_private( tid )
{
	todo_private('t-'+tid , function()
	{
		show_todo_detail( tid );
	}  );
}

function tdeail_public( tid )
{
	todo_public('t-'+tid , function()
	{
		show_todo_detail( tid );
	}  );
}

function tdeail_follow( tid )
{
	todo_follow('t-'+tid , function()
	{
		show_todo_detail( tid );
	}  );
}

function tdeail_unfollow( tid )
{
	
	tt_confirm( '取消关注此TODO，继续？' , function()
	{
		todo_unfollow('t-'+tid , function()
		{
			show_todo_detail( tid );
		}  );
	} );
	
	
}

function write_contact()
{
	if( on_phonegap &&  !is_online )
	{
		// 离线状态
		float_message('离线时无法导出联系人，请连线后再试', true);
		return false;
	}

	if( !navigator.contacts )
	{
		float_message('无法写入此设备联系人，请等设备就绪后重试', true);
		return false;
	}


	tt_confirm( '导出功能可以将TeamToy中的联系人写入手机的通讯录中，继续？' , function(evt)
	{
		$.post( base_url() + 'index.php?c=api&a=team_members' , 
		{
			'token' : kget('op_token') 
		} , function( data )
		{
			var data_obj = $.parseJSON( data );
			console.log( data_obj );
		 
			if( data_obj.err_code != 0 )
			{
				float_message('云端同步失败',true);
			}
			else
			{
				for( var i = 0 ; i < data_obj.data.length ; i++  )
				{
					save_concact( data_obj.data[i] );
				}

				float_message( parseInt(data_obj.data.length) + 1 + '个联系人被导出到手机');	
				
			}
			
			
			
		}  );

	} );

}

function save_concact( dataitem )
{
	var name = dataitem.name;
	var options = new ContactFindOptions();
    options.filter= '[T]'+name; 
    options.multiple=true;

    var filter = ["displayName","name","nickname"];

    navigator.contacts.find(filter, function(contacts)
    {
    	if( contacts.length > 0 )
    	{
    		for (var i=0; i<contacts.length; i++)
    		{
    			contacts[i].remove( function()
    			{ 
    				create_contact( dataitem );
    			});	
    		} 
    	}
    	else
    	{
    		create_contact( dataitem );
    	}
    		

    	    
            	

    }, function(){alert('读取通讯录错误，请稍后重试')}, options);

    return ;

    
	//float_message( name +'的信息被同步到手机通讯录' );
   

}

function create_contact( dataitem )
{
	var contact = navigator.contacts.create(
    {  
    	'displayName':'[T]' + dataitem.name,
    	'nickname':'[T]' + dataitem.name,
    	'note': dataitem.desp
    });


    var name = new ContactName();
    name.givenName = dataitem.name;
    name.familyName = '[T]';
    contact.name = name;

    var phoneNumbers = [];
	phoneNumbers[0] = new ContactField('work', dataitem.tel, false);
	phoneNumbers[1] = new ContactField('mobile', dataitem.mobile, true); // preferred number
	contact.phoneNumbers = phoneNumbers;

	var emails = [];
	emails[0] = new ContactField('work', dataitem.email, false);
	contact.emails = emails;

	if( dataitem.weibo.length > 0 )
	{
		var ims = [];
		ims[0] = new ContactField('weibo', '微博昵称 '+'@'+dataitem.weibo, false);
		contact.ims = ims;	
	}
	
	

	contact.save();
}

function add_member()
{
	if( on_phonegap &&  !is_online )
	{
		// 离线状态
		float_message('离线时无法创建激活码，请连线后再试', true);
		return false;
	}
	
	$.post( base_url() + 'index.php?c=api&a=team_activecode' , 
		{
			'token' : kget('op_token')
		} , function( data )
		{
			var data_obj = $.parseJSON( data );
			console.log( data_obj );
		 
			if( data_obj.err_code != 0 )
			{
				float_message('云端通信失败',true);
			}
			else
			{
				is_online = true;
				if( data_obj.data.activecode )
				{
					$("#ta_code").text( '我正在使用自己架设的团队TODO工具TeamToy，想和你一起协作。请按以下链接提示在24小时内激活账号。 http://teamtoy.org/?c=active&a=code&code='+data_obj.data.activecode + '&domain=' + encodeURIComponent( kget('op_domain') ) ) ;
					change_card('code_card');
				}  	
			}	
		}  );	
}


function change_to_feed()
{
	change_card('feed_card');
	show_feed_list();
}

function avatar()
{
	 navigator.camera.getPicture(upload_avatar, function(message) {
	//alert('get picture failed' + message );
	},{
		quality: 50, 
		destinationType: navigator.camera.DestinationType.FILE_URI,
		sourceType: navigator.camera.PictureSourceType.CAMERA
		}
    );
}

function upload_avatar( imageURI  )
{
	float_message('正在向云端上传头像',false,1);
	return uploadImage( imageURI  , 'user_update_avatar' );

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
    
    var ft = new FileTransfer();
    ft.upload(imageURI, base_url() + 'index.php?c=api&a='+api, function(r){  asuccess( r , api ); }, fail, options);
}

function asuccess(r , api ) 
{
	//var data_obj = $.parseJSON( r.response );
	// phonegap1.6 bug
	var data_obj = $.parseJSON( decodeURIComponent(r.response) );
	console.log( data_obj );
	if( parseInt(data_obj.err_code) == 0 )
	{
		float_message('头像已更新');
		load_remote_members( function()
		{
			load_user_detail( data_obj.data.uid , 'menu_card' );
		} );
		
	}
     
}
 
function fail( info )
{
	float_message('同步失败。'+info , true);
}


var recognizer;
var appId = '4fa77fe4';

function onResults_todo_text(response) 
{
  console.log(response);
  
  if( true || response.isLast )
  {
	response.results.forEach(function(recognizerResult) 
	{
		$("#todo_text").val( $("#todo_text").val() + recognizerResult.text );	
  	});
  }
  
}

function onResults_comment_text(response) 
{
  if( true || response.isLast )
  {
	$("#comment_text").text('');
	response.results.forEach(function(recognizerResult) {
    $("#comment_text").val( $("#comment_text").val()+recognizerResult.text );
  });
  }
  
}

function voice( tid )
{
	if( on_phonegap &&  !is_online )
	{
		// 离线状态
		float_message('离线时无法使用语音识别功能，请连线后再试', true);
		return false;
	}
	
	
        sina.voice.recognizer.init(appId);
  	
  	sina.voice.recognizer.setOption(
  	{
    	engine: 'sms',
    	sampleRate: 'rate16k',
  	});

  	sina.voice.recognizer.setListener("onResults_"+tid);
  	
        sina.voice.recognizer.start(function(response) 
  	{
    	console.log("response: " + response.errorCode + ", msg: " + response.message);
  	});

  	$('#'+tid).text('');
  	console.log("start");
	
}








// ============= database =====================


function jsnow()
{
	var now=new Date();
	y=now.getFullYear();
	m=now.getMonth()+1;
	d=now.getDate();
	m=m<10?"0"+m:m;
	d=d<10?"0"+d:d;
	var hours=now.getHours(); 
	var minutes=now.getMinutes(); 
	var seconds=now.getSeconds(); 
	if (minutes<=9) minutes="0"+minutes; 
	if (seconds<=9) seconds="0"+seconds;
	
	return y+"-"+m+"-"+d+" "+hours+":"+minutes+":"+seconds;
}


function database_clean()
{
	db.transaction( function( tx )
	{
		tx.executeSql("DROP TABLE TODO");
		tx.executeSql("DROP TABLE MEMBERS");
		
	}, db_error , function()
	{
		float_message('清理完成');
	} );
}

function database_init()
{
	db.transaction( function( tx )
	{
		// TODO 
		
		tx.executeSql("CREATE TABLE IF NOT EXISTS TODO ( id INTEGER PRIMARY KEY AUTOINCREMENT, tid INT unique , content TEXT , is_star INT default 0, is_public INT default 0, is_delete INT default 0, is_sync INT default 0, is_follow INT default 0, sync_error INT default 0 , status INT default 1 , create_at default (datetime('now','localtime')) , last_action_at default (datetime('now','localtime')))");
		
		// MEMBERS
		tx.executeSql("CREATE TABLE IF NOT EXISTS MEMBERS ( id INTEGER PRIMARY KEY AUTOINCREMENT, uid INT unique , name TEXT, email TEXT , avatar_small TEXT , level INT , mobile TEXT , tel TEXT , eid TEXT , weibo TEXT , desp TEXT  )");
		
		
	}, db_error );
}

function db_error(err) 
{
	//alert("Error processing SQL: "+err);
	console.log( err );
}

function get_data( sql , darray , fn )
{
	db.transaction( function( tx )
	{
		tx.executeSql( sql , darray , function( tx , results )
		{
			var rdata = Array();
			var len = results.rows.length;
			
			if( len == 0 && typeof fn == 'function' )
			{
				return  fn(false);
				
			} 
			
			for( var i = 0 ; i < len ; i++  )
			{
				rdata[i] = results.rows.item(i);
				//console.log(results.rows.item(i));
			}
			
			if( typeof fn == 'function' ) fn(rdata);
			
			
		}, db_error);
	}, db_error );
}

function i18n()
{
	$('.i18n').each( function( index , value )
	{
		if($(this).text() != '' )
		{
			$(this).text( $.i18n._($(this).text()) );
		}
		else
		{
			if($(this).val() != '' )
		{
			$(this).val( $.i18n._($(this).val()) );
		}
		}
	});
	//document.write(str);
}


function offline_message( str , flag )
{
	
	var now = Number(new Date());
	var last = Number( kget('last_offline_notice') );
	
	//alert( 'now = ' + now + '~ last = ' + last + ' now - last =  ' + (now - last) );
	// 一分钟内不再重复提示
	if( now - last > 60000 )
	{
		kset('last_offline_notice', now );
		return float_message( str , flag );
	} 	
}


function float_message( str , flag , lock )
{
	if( $('#tt_float').length == 0 )
	{
		// create
		var ttf = $('<div id="tt_float"></div>');
		ttf.css( 'display','none' );
		
		$('body').prepend(ttf);
	}
	
	$('#tt_float').html(str);
	if( flag === true )
	{	
		$('#tt_float').removeClass('tt_blue');
		$('#tt_float').addClass('tt_red');
	}
	else
	{
		$('#tt_float').removeClass('tt_red');
		$('#tt_float').addClass('tt_blue');
	}	
	$('#tt_float').css( 'display','block' );
	
	if( parseInt(lock) != 1 )
	{
		setTimeout(function () 
		{
			hide_float_message();
		},1000 );
	}	
}

function add_push()
{
	if( navigator.network.connection.type == Connection.WIFI ) 
		sina.alarm.start(Date.now(), 60000, 'callback.html','callback', true);
	else
		sina.alarm.start(Date.now(), 300000, 'callback.html','callback', true);

	float_message('消息推送已经开启');
}

function remove_push()
{
	sina.alarm.stop();
	float_message('消息推送已经关闭');
}

function qr_login()
{
	tt_alert('请将摄像头对准网页版顶部导航中的【二维码登入】页面进行扫描');

	sina.barcodeScanner.scan( function(result) 
	{
          var infos = result.text.split('|');
          
          var token = infos[0];
          var domain = infos[1];
          var uname = infos[2];
		  var uid = infos[3];
		  var level = infos[4];

		  if( token.length > 4 )
		  {
		  	kset('op_token',token);
        	kset('op_domain',domain);
          	kset('op_uname',uname);
          	kset('op_uid',uid);
          	kset('op_level',level);

          	tt_alert('认证信息已识别，请点击继续');

          	change_page( 'todo' );
		  }
		  else
		  {
		  	tt_alert('认证信息无法识别，请重试');
		  }


          

		  

      }, function(error) 
      {
          tt_alert('扫描失败，请稍后再试');
      });
}


function hide_float_message()
{
	$('#tt_float').css( 'display','none' );
}

function tt_alert( string , title , button  )
{
	//alert( string );
	//return ;
	//if( !on_phonegap  )
	if( !on_phonegap  )
	{
		alert( string );
	}
	else
	{
		if( !title ) title = '系统消息';
		navigator.notification.alert( string , function(){} , title , button );
	}
	
}

function tt_confirm( string , callback , title , button  )
{
	
	/*
	if(confirm( string ))
	{
		if( typeof callback == 'function'  )
				callback();
	}

	return ;*/

	if( !on_phonegap  )
	{
		if(confirm( string ))
		{
			if( typeof callback == 'function'  )
				callback();
		}
	}
	else
	{
		if( !title ) title = '系统消息';
		if( !button ) button = '确定,取消';
		return navigator.notification.confirm( string , mycallback , title , button );
		
		function mycallback( btn )
		{
			if( btn == 1 && typeof callback == 'function' )
				callback();
		}
	}
	
}

function onOnline()
{
	is_online = true;
	if( navigator.network.connection.type == Connection.WIFI ) float_message('开始使用Wifi网络');
	
	if( navigator.network.connection.type == Connection.ETHERNET ) float_message('开始使用有线网络');
	
	if( navigator.network.connection.type == Connection.CELL_2G || navigator.network.connection.type == Connection.CELL_3G || navigator.network.connection.type == Connection.CELL_4G ) float_message('开始使用移动网络');
	
	sync_recover();
	
}

function offOnline()
{
	is_online = false;
	float_message('没有可用网络，进入离线模式',true);
}


function change_page( page )
{
	location = page + '.html';
}

function change_card( cid )
{
	var add_footer = false;
	if( cid == 'todo_card'  ) add_footer = true;
	if( cid == 'notice_card'  ) add_footer = true;
	if( cid == 'feed_card'  ) add_footer = true;
	if( cid == 'menu_card'  ) add_footer = true;
	if( cid == 'members_card'  ) add_footer = true;

	if( add_footer )
	{
		$(".bottom_nav li").removeClass('cur');
		$(".bottom_nav li#"+cid+'_icon').addClass('cur');
		$('#global_footer').appendTo($('#'+cid));
		$('#global_footer').css('display','block');
	}

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


function loadjs( file )
{
	$('#tttempload').remove();
	var script= document.createElement('script');
	script.type= 'text/javascript';
	script.src= file;
	script.id = 'tttempload';
	document.head.appendChild(script);
	
}


//Touch events are from zepto/touch.js

(function($) {
    var touch = {}, touchTimeout;
    
    function parentIfText(node) {
        return 'tagName' in node ? node : node.parentNode;
    }
    
    function swipeDirection(x1, x2, y1, y2) {
        var xDelta = Math.abs(x1 - x2), yDelta = Math.abs(y1 - y2);
        if (xDelta >= yDelta) {
            return (x1 - x2 > 0 ? 'Left' : 'Right');
        } else {
            return (y1 - y2 > 0 ? 'Up' : 'Down');
        }
    }
    
    var longTapDelay = 750;
    function longTap() {
        if (touch.last && (Date.now() - touch.last >= longTapDelay)) {
            touch.el.trigger('longTap');
            touch = {};
        }
    }
    $(document).ready(function() {
        $(document.body).bind('touchstart', function(e) {
            var now = Date.now(), delta = now - (touch.last || now);
            touch.el = $(parentIfText(e.touches[0].target));
            touchTimeout && clearTimeout(touchTimeout);
            touch.x1 = e.touches[0].pageX;
            touch.y1 = e.touches[0].pageY;
            if (delta > 0 && delta <= 250)
                touch.isDoubleTap = true;
            touch.last = now;
            setTimeout(longTap, longTapDelay);
            if (!touch.el.data("ignore-pressed"))
                touch.el.addClass("selected");
        }).bind('touchmove', function(e) {
            touch.x2 = e.touches[0].pageX;
            touch.y2 = e.touches[0].pageY;
        }).bind('touchend', function(e) {
            if (!touch.el)
                return;
            if (!touch.el.data("ignore-pressed"))
                touch.el.removeClass("selected");
            if (touch.isDoubleTap) {
                touch.el.trigger('doubleTap');
                touch = {};
            } else if (touch.x2 > 0 || touch.y2 > 0) {
                (Math.abs(touch.x1 - touch.x2) > 30 || Math.abs(touch.y1 - touch.y2) > 30) && 
                touch.el.trigger('swipe') && 
                touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)));
                touch.x1 = touch.x2 = touch.y1 = touch.y2 = touch.last = 0;
            } else if ('last' in touch) {
                touch.el.trigger('tap');
                
                touchTimeout = setTimeout(function() {
                    touchTimeout = null;
                    if (touch.el)
                        touch.el.trigger('singleTap');
                    touch = {};
                }, 250);
            }
        }).bind('touchcancel', function() {
            touch = {}
        });
    });
    
    ['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(m) {
        $.fn[m] = function(callback) {
            return this.bind(m, callback)
        }
    });
})(jq);









