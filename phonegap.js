//设备类型 android/ios/other
function get_device_type()
{

	if( navigator.userAgent.match(/(Android)\s+([\d.]+)/) || navigator.userAgent.match(/Silk-Accelerated/) ) return 'android';
        if( navigator.userAgent.match(/(iPad).*OS\s([\d_]+)/) ) return 'ios';
        if( navigator.userAgent.match(/(iPhone\sOS)\s([\d_]+)/) ) return 'ios';
	return 'other';        
}
//判断后加载对应的js文件
if( get_device_type() != 'other' )
{
   var script= document.createElement('script');
   script.type= 'text/javascript';
   script.src= 'phonegap.'+ get_device_type() +'.js';
   document.head.appendChild(script);
}

