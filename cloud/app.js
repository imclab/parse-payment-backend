var
	express = require('express'),
	payments = require('cloud/payments'),
	signedrequest = require('cloud/signedrequest');

var app = express();

app.set('views', 'cloud/views');
app.set('view engine', 'ejs');
app.use(express.bodyParser());

app.all('/signedrequest/:signed_request', signedrequest.echo);
app.all('/fulfil/:id', payments.fulfil);
app.all('/save/:id', payments.save);
app.all('/payment/:id', payments.get);

app.listen();