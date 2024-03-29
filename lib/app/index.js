var app = require('derby').createApp(module),
    get = app.get,
    post = app.post,
    view = app.view,
    ready = app.ready;


// ROUTES //

var pages = [
    {name: 'home', title: 'Home', url: '/', availableWhenAuthenticated: true},
    {name: 'signin', title: 'Sign In', url: '/signin'},
    {name: 'register', title: 'Register', url: '/register'},
    {name: 'logout', title: 'Log Out', url: '/logout', showOnlyWhenAuthenticated: true, doNotUseDefaultHandler: true}
];

var getUserFullName = function(auth)
{
    if(!auth)
        return auth;

    if(auth.facebook)
    {
        return auth.facebook.user.first_name + ' ' + auth.facebook.user.last_name + ' (facebook)';

    } else if(auth.twitter)
    {
        return auth.twitter.user.name + ' (twitter)';
    }

    return undefined;
}

var showPage = function(page, ctx)
{
    if(!ctx.auth && page.showOnlyWhenAuthenticated)
        return false;
    else if(ctx.auth && ctx.auth.loggedIn && page.showOnlyWhenAuthenticated)
        return true;


    return (!ctx.auth || !ctx.auth.loggedIn || page.availableWhenAuthenticated);
}

var contextFor = function (name, ctx) {
    ctx = ctx || {};
    ctx[name + 'Visible'] = true;
    ctx.currentPage = name;
    ctx.pages = (function() {

        var _results = [];
        pages.forEach(function(page){

            if(showPage(page, ctx))
            {
                page = Object.create(page);
                if (page.name === name) {
                    page.current = true;
                    ctx.title = page.title;
                    ctx.userFullName = getUserFullName(ctx.auth);
                }
                _results.push(page);
            }
        });

        _results[_results.length - 1].last = true;
        return _results;
    })();

    return ctx;
};

var isValidPage = function(pageName)
{
    var retVal = false;
    pages.forEach(function(page) {
        if(pageName.localeCompare(page.name) == 0)
            retVal = true;
    });
    return retVal;
}

// Derby routes can be rendered on the client and the server
get('/:pageName?', function(page, model, params, next) {
    var pName = params.pageName || 'home';

    // Subscribes the model to any updates on this room's object. Also sets a
    // model reference to the room. This is equivalent to:
    //   model.set('_room', model.ref('rooms.' + room));
    /*
     model.subscribe({ _room: 'rooms.' + room }, function() {

     // setNull will set a value if the object is currently null or undefined
     model.setNull('_room.welcome', 'Welcome to ' + room + '!');

     model.incr('_room.visits');

     // This value is set for when the page initially renders
     model.set('_timer', '0.0');
     // Reset the counter when visiting a new route client-side
     start = +new Date();

     // Render will use the model data as well as an optional context object
     page.render({
     room: room,
     randomUrl: parseInt(Math.random() * 1e9).toString(36)
     });
     });
     */
    if(!isValidPage(pName))
    {
        next();
    }

    if(pName == 'logout')
    {
        //page.redirect('/logout');
        next();
        return;
    }

    var ctx = contextFor(pName, params.session);
    // Render will use the model data as well as an optional context object
    page.render(ctx);
});


// Derby routes can be rendered on the client and the server
post('/signin', function(page, model, params, next) {
    // Render will use the model data as well as an optional context object
    page.render(contextFor('signin'));
});


// CONTROLLER FUNCTIONS //

ready(function(model) {

});
