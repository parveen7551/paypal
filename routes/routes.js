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
    var payment = {
        "intent": "sale",
        "payer": {
            "payment_method": "credit_card",
            "funding_instruments": [{
                "credit_card": {
                    "number": "5500005555555559",
                    "type": "mastercard",
                    "expire_month": 12,
                    "expire_year": 2018,
                    "cvv2": 111,
                    "first_name": "Joe",
                    "last_name": "Shopper"
                }
            }]
        },
        "transactions": [{
            "amount": {
                "total": "5.00",
                "currency": "USD"
            },
            "description": "My awesome payment"
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
            res.send("Hell yeah!");
        }
    });
};