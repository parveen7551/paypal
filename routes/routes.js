var paypal = require('paypal-rest-sdk');
var url = require('url');

// var config ="";
var config1 ="";
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
            "return_url": "http://localhost:5000/success", //should be dynamic
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
    var payerId = req.body.PayerID;

    var details = {"payer_id": payerId};
    paypal.payment.execute(paymentId, details, function (error, payment) {
        if (err) {
            console.log(error);
        } else {
            res.send({message:"Hell yeah!",data:payment});
        }
    });
};



//For billing agreement between the buyer and paypal.
exports.createAgreement = function (req1, res) {
    var d = new Date(Date.now() + 1*60*1000);
    d.setSeconds(d.getSeconds() + 4);
    var isDate = d.toISOString();
    var isoDate = isDate.slice(0, 19) + "Z";

    var billingPlanAttributes = {
        "description": "Clearly Next Subscription.",
        "merchant_preferences": {
            "auto_bill_amount": "yes",
            "cancel_url": "http://localhost:5000/cancel",
            "initial_fail_amount_action": "continue",
            "max_fail_attempts": "2",
            "return_url": "http://localhost:5000/processagreement",
            "setup_fee": {
                "currency": "USD",
                "value": "25"
            }
        },
        "name": "Testing1-Regular1",
        "payment_definitions": [
            {
                "amount": {
                    "currency": "USD",
                    "value": "100"
                },
                "charge_models": [
                    {
                        "amount": {
                            "currency": "USD",
                            "value": "10.60"
                        },
                        "type": "SHIPPING"
                    },
                    {
                        "amount": {
                            "currency": "USD",
                            "value": "20"
                        },
                        "type": "TAX"
                    }
                ],
                "cycles": "0",
                "frequency": "MONTH",
                "frequency_interval": "1",
                "name": "Regular 1",
                "type": "REGULAR"
            },
            {
                "amount": {
                    "currency": "USD",
                    "value": "20"
                },
                "charge_models": [
                    {
                        "amount": {
                            "currency": "USD",
                            "value": "10.60"
                        },
                        "type": "SHIPPING"
                    },
                    {
                        "amount": {
                            "currency": "USD",
                            "value": "20"
                        },
                        "type": "TAX"
                    }
                ],
                "cycles": "4",
                "frequency": "MONTH",
                "frequency_interval": "1",
                "name": "Trial 1",
                "type": "TRIAL"
            }
        ],
        "type": "INFINITE"
    };

    var billingPlanUpdateAttributes = [
        {
            "op": "replace",
            "path": "/",
            "value": {
                "state": "ACTIVE"
            }
        }
    ];

    var billingAgreementAttributes = {
        "name": "Fast Speed Agreement",
        "description": "Agreement for Fast Speed Plan",
        "start_date": isoDate,
        "plan": {
            "id": "P-0NJ10521L3680291SOAQIVTQ"
        },
        "payer": {
            "payment_method": "paypal"
        },
        "shipping_address": {
            "line1": "StayBr111idge Suites",
            "line2": "Cro12ok Street",
            "city": "San Jose",
            "state": "CA",
            "postal_code": "95112",
            "country_code": "US"
        }
    };

// Create the billing plan
    paypal.billingPlan.create(billingPlanAttributes, function (error, billingPlan) {
        if (error) {
            console.log(error);
            throw error;
        } else {
            console.log("Create Billing Plan Response");
            console.log(billingPlan);

            // Activate the plan by changing status to Active
            paypal.billingPlan.update(billingPlan.id, billingPlanUpdateAttributes, function (error, response) {
                if (error) {
                    console.log(error);
                    throw error;
                } else {
                    console.log("Billing Plan state changed to " + billingPlan.state);
                    billingAgreementAttributes.plan.id = billingPlan.id;

                    // Use activated billing plan to create agreement
                    paypal.billingAgreement.create(billingAgreementAttributes, function (error, billingAgreement) {
                        if (err) {
                            console.log(error);
                            throw error;
                        } else {
                            console.log("Create Billing Agreement Response");
                            //console.log(billingAgreement);
                            for (var index = 0; index < billingAgreement.links.length; index++) {
                                if (billingAgreement.links[index].rel === 'approval_url') {
                                    var approval_url = billingAgreement.links[index].href;
                                    console.log("For approving subscription via Paypal, first redirect user to");
                                    console.log(approval_url);
                                    res.redirect(approval_url);

                                    console.log("Payment token is");
                                    console.log(url.parse(approval_url, true).query.token);
                                    // See billing_agreements/execute.js to see example for executing agreement
                                    // after you have payment token
                                }
                            }
                        }
                    });
                }
            });
        }
    });
};

// Processing the final agreement.
exports.processAgreement = function (req, res) {
    var token = req.query.token;
    console.log(token,'tokentoken');
    paypal.billingAgreement.execute(token, {}, function (error, billingAgreement) {
        if (error) {
            console.error(error);
            throw error;
        } else {
            console.log(JSON.stringify(billingAgreement));
            res.send({message:'Billing Agreement Created Successfully',data:JSON.stringify(billingAgreement)});
        }
    });
};
