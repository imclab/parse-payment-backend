var Config = require('cloud/config');
var SignedRequest = require('cloud/signedrequest');

var getModifiersForProduct = function(productURL, quantity) {
	switch( productURL ) {
		case 'http://mighty-forest-9986.herokuapp.com/friend_smash_bomb.html':
			return {
				'bomb': quantity
			}; break;
		case 'http://mighty-forest-9986.herokuapp.com/friend_smash_life.html':
			return {
				'lives': quantity
			}; break;
		case 'http://mighty-forest-9986.herokuapp.com/friend_smash_coin.html':
			return {
				'coins': quantity
			}; break;
		case 'http://mighty-forest-9986.herokuapp.com/friend_smash_start_pack.html':
			return {
				'coins': quantity * 100,
				'bombs': quantity,
				'lives': quantity * 5
			}; break;
		default:
			return {}; break;
	}
};

var Payment = Parse.Object.extend('Payment');

Parse.Cloud.beforeSave(Payment, function(request, response) {
  if (!request.object.get('payment_id')) {
    response.error('A Payment must have an id');
  } else {
    var query = new Parse.Query(Payment);
    query.equalTo('payment_id', request.object.get('payment_id'));
    query.first({
      success: function(object) {
        if (object) {
          response.error('This Payment already exists');
        } else {
          response.success();
        }
      },
      error: function(error) {
        response.error('Error enforcing unique constraint for Payment: ' + error);
      }
    });
  }
});

var getPaymentInfo = function(paymentID) {
	var graph = 'https://graph.facebook.com/';
    var graphUrl = graph + paymentID + '?access_token=' + Config.appAccessToken;
    var promise = new Parse.Promise();

    Parse.Cloud.httpRequest({
        url: graphUrl,
        success: function(httpResponse) {
            promise.resolve( JSON.parse(httpResponse.text) );
        },
        error: function(httpResponse) {
            promise.reject( httpResponse.text );
        }
    });
    return promise;
};

var savePayment = function(paymentJSON) {
	var payment = new Payment({
		payment_id: paymentJSON.id,
		currency: paymentJSON.actions[0].currency,
		amount: paymentJSON.actions[0].amount,
		refundable_amount: paymentJSON.refundable_amount.amount,
		status: paymentJSON.actions[0].status,
		item: paymentJSON.items[0].product,
		quantity: paymentJSON.items[0].quantity
	});

	var promise = new Parse.Promise();

	payment.save().then(function(payment) {
		promise.resolve(payment);
	}, function(error) {
		promise.reject(error);
	});

	return promise;
}

var fulfilPurchase = function(payment) {
	Parse.Cloud.useMasterKey();
	var query = new Parse.Query(Parse.User);
	var promise = new Parse.Promise();
	query.get('z48NQMUunT', {
		success: function(user) {
			var attrs = getModifiersForProduct( payment.get('item'), payment.get('quantity') );
			for( var attr in attrs ) {
				user.increment(attr, attrs[attr]);
			}
			user.save().then( function(user) {
				promise.resolve(user);
			}, function(error) {
				promise.reject('error in save');
			});
		},
		error: function(user, error) {
	    	promise.reject('error in query');
		}
	});

	return promise;
}

exports.get = function(req,res) {
	getPaymentInfo(req.params.id).then( function(paymentJSON) {
		res.send(paymentJSON);
	});
}

exports.save = function(req,res) {
	getPaymentInfo(req.params.id).then( function(paymentJSON) {
		return savePayment(paymentJSON);
	}).then( function(payment) {
		res.send(payment.id);
	}, function(error) {
		res.send(500, error);
	});
}

exports.fulfil = function(req,res) {
	getPaymentInfo(req.params.id).then( function(paymentJSON) {
		return savePayment(paymentJSON);
	}).then( function(payment) {
		return fulfilPurchase(payment);
	}).then( function(user) {
		res.send(user);
	}, function(error) {
		res.send(error);
	});
}