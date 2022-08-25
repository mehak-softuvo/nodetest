const nodemailer = require('nodemailer');
var hbs = require('nodemailer-express-handlebars');
var config = require('config');

exports.sendMail = async function(fields) {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: "manish.yadavsoftuvo@gmail.com",
            pass: "Softuvo@1234"
        }
    });
    var options = {
        viewEngine: {
            extname: '.hbs',
            layoutsDir: 'views/layouts/',
            defaultLayout: 'email',
            partialsDir: 'views/partials/',
        },
        viewPath: 'views/email_templates',
        extName: '.hbs'
    };

    transporter.use('compile', hbs(options));

    var mail = {
        from: `Clikiko <manish.yadavsoftuvo@gmail.com>`,
        to: fields.to,
        subject: fields.subject,
        template: fields.template,
        context: fields.data,
        attachments: (fields.attachments && fields.attachments.length > 0) ? fields.attachments : null
    }
    try {
        var info = await transporter.sendMail(mail);
        console.log('Message sent:  %s', info.messageId);
    } catch (error) {
        console.log(error);
    }
};