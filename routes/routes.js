var paypal = require('paypal-rest-sdk');
var config = {};
/*
 * GET home page.
 */

exports.index = function (req, res) {
    res.render('index', {title: 'Express'});
};

/*
 * SDK configuration
 */

exports.init = function (c) {
    config = c;
    paypal.configure(c.api);
}

exports.create = function (req, res) {
    var amount =  29;//req.body.amount;//Fixed amount
    var currency = 'USD'; //req.body.currency; //USD
    var description = 'Clearly next membership.'//req.body.description;
    var payment = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:5000/success",
            "cancel_url": "http://localhost:5000/cancel"
        },
        "transactions": [{
            "amount": {
                "total":parseInt(amount),
                "currency":  currency
            },
            "description": description
        }]
    };
    paypal.payment.create(payment, function (error, payment) {
        if (error) {
            console.log(error);
        } else {
            if (payment.payer.payment_method === 'paypal') {
                req.session.paymentId = payment.id;
                var redirectUrl;
                for (var i = 0; i < payment.links.length; i++) {
                    var link = payment.links[i];
                    if (link.method === 'REDIRECT') {
                        redirectUrl = link.href;
                    }
                }
                res.redirect(redirectUrl);
            }
        }
    });
}

exports.cancel = function (req, res) {
    res.send("The payment got canceled");
};

exports.execute = function (req, res) {
    var paymentId = req.session.paymentId;
    var payerId = req.param('PayerID');

    var details = {"payer_id": payerId};
    paypal.payment.execute(paymentId, details, function (error, payment) {
        if (error) {
            console.log(error);
        } else {
            res.send({message:"Hell yeah!",data:payment});
        }
    });
};