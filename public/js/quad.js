$(document).bind("mobileinit", function(){
    $.extend(  $.mobile , {
        ajaxEnabled: false,
        linkBindingEnabled: false,
        pushStateEnabled: false,
        hashListeningEnabled: false,
        defaultPageTransition: 'none'
    });
});