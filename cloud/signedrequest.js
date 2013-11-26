var Buffer = require('buffer').Buffer;
var Config = require('cloud/config');
var crypto = require('crypto');

// php hash_hmac
hashHmac = function(algo,data,key) {
	return crypto.createHmac(algo,key).update(data).digest('base64').replace(/\+/g,'-').replace(/\//g,'_').replace('=','')
}

base64UrlDecode = function(input) {
	return new Buffer(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}
 
parseSignedRequest = function(signedRequest) {
    encodedData = signedRequest.split('.',2);
    sig = encodedData[0];
    data = JSON.parse(base64UrlDecode(encodedData[1]));

    expectedSig = hashHmac('sha256', encodedData[1], Config.appSecret);

    if( sig !== expectedSig ) {
        return { error: 'Signatures didn\'t match' };
    }
     
    return data;
};

exports.parse = parseSignedRequest;

exports.echo = function(req,res) {
    var data = parseSignedRequest( req.params['signed_request'] );
    if( data ){
        res.send(data);
    } else {
        res.send(403, data.error );
    }
}