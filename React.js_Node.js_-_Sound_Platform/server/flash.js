var flash = require('connect-flash')

module.exports = function(app){
	// flash messages
	app.use(flash());

	// flash message & redirect or send JSON
	app.use(function(req, res, next){
		// dummy, if not using translation
		if (!res.__){
			res.__ = function(t){return t;}
		}
		
	    res.message = function(message, type, redirect){
	        type = type || 'info';
	        if (req.xhr) {
	            if (type == 'error'){
	                return res.status(500).send({message:{type:type, text:res.__(message)}});
	            }
	            return res.send({message:{type:type, text:res.__(message)}});
	        }

	        req.flash(type, message);

	        if (redirect !== ''){
	            res.redirect(redirect || '/');
	        }
	    };
	    next();
	});
};
