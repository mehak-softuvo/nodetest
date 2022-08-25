module.exports = function(req, res, next) {
    var config = require('config');
    var jwt = require('jsonwebtoken');

    let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
    if (token && token.startsWith('Bearer ')) {
        // Remove Bearer from string
        token = token.slice(7, token.length);
    }

    if (token) {
        jwt.verify(token.trim(), config.get('site.secret'), (err, decoded) => {
            if (err || !decoded || decoded.role != 'admin') {
                return res.status(401).json({
                    status: false,
                    message: 'You are logged out.'
                });
            } else {
                req.user = decoded;
                next();
            }
        });
    } else {
        return res.status(401).json({
            status: false,
            message: 'You are logged out.'
        });
    }
};