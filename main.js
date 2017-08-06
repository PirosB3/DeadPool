const bitcoin = require('bitcoinjs-lib');
const express = require('express')
const bodyParser = require('body-parser');
const Attendee = require('./models');


/**
 * Generate a pair of {
 *   privateKey: //as a WIF,
 *   address: //public address
 * }
 *
 */
function generateRandomPair(network) {
    var pair = bitcoin.ECPair.makeRandom({network: network});
    return {
        privateKey: pair.toWIF(),
        address: pair.getAddress()
    };
}

/**
 * Register the attendee
 * @returns a Promise
 */
function registerAttendee(email, returnAddress) {
    var pair = generateRandomPair(bitcoin.networks.testnet);
    return Attendee.create({
        email: email,
        address: pair.address,
        returnAddress: returnAddress,
        privateKey: pair.privateKey
    });
}

Attendee.sync({force: true}).then(()=> {
    var app = express();
    app.set('view engine', 'jade');
    app.use(bodyParser.urlencoded({ extended: true })); 

    app.get('/sf-python/event-11-08-2017', function (req, res) {
        res.render('index');
    });

    app.get('/sf-python/event-11-08-2017/attendee/:id', function (req, res) {

        Attendee
          .findById(req.params.id)
          .then(attendee => {
              return res.render('attendee', {
                 address: attendee.address,
              });
              
          });
    })

    app.post('/sf-python/event-11-08-2017/register', function (req, res) {
        var email = req.body.email;
        var returnAddress = req.body.returnAddress;
        console.log(req.body);
        if (!email || ! returnAddress) {
            res.status(400).send('invalid form request');
            return
        }

        registerAttendee(email, returnAddress).then((attendee) => {
            return res.redirect('/sf-python/event-11-08-2017/attendee/' + attendee.id);
        }).catch(err => {
            console.log(err);
            res.status(400).send('shit');
        });
    });

    app.listen(3000, function () {
      console.log('App listening on port 3000!')
    })
});
