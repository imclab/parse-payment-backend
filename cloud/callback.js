var SignedRequest = require('cloud/signedrequest');

Parse.Cloud.define('verifyPayment', function(request,response){
    var graph = 'https://graph.facebook.com/';
    var appAccessToken = appId + '|' + appSecret;
    var graphUrl = graph + request.params.id + '?access_token=' + appAccessToken;

    Parse.Cloud.httpRequest({
        url: graphUrl,
        success: function(httpResponse) {
            response.success( httpResponse.text );
        },
        error: function(httpResponse) {
            response.error( httpResponse.text );
        }
    });
});
 
// RTU Callback Handler
exports.parse = function(req,res) {
	var data = SignedRequest.parse( req.params['signed_request'] );
	if( data && !data.error ) {
        // Is this a payment signed_request?
        if( data.payment_id && data.status && data.status == 'completed' ) {
            // 
        }
        var params = {
            id: data.payment_id,
            amount: data.amount,
            status: data.status
        };
        Parse.Cloud.run('verifyPayment', { id: data.payment_id }, {
            success: function(response) {
                res.send(200, response );
            },
            error: function(error) {
                res.send(500, error );
            }
        });
	} else {
		res.send(403, data.error );
	}
}

exports.handler = function(req,res) {
    res.send(200);
};