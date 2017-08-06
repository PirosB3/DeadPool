const bitcoin = require('bitcoinjs-lib');
const express = require('express')
const bodyParser = require('body-parser');
const Attendee = require('./models');
const bitcoinRpc = require('bitcoin');
const AddressWatcher = require('./watcher').AddressWatcher;
const EmailWatcher = require('./watcher').EmailWatcher;

var client = new bitcoinRpc.Client({
    host: '0.0.0.0', port: 18332, user: 'root', pass: 'root'
});



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
    return addToWatchList(pair.address)
        .then(() => Attendee.create({
            email: email,
            address: pair.address,
            returnAddress: returnAddress,
            privateKey: pair.privateKey
        }));
}

/**
 * Adds a address to our wallet for monitoring
 */
function addToWatchList(address) {
    return new Promise((resolve, reject) => {
        client.importAddress(address, (err, diff) => {
            if (err) {
                reject(err);
            } else {
                resolve(diff);
            }
        });
    });
}

//Attendee.sync({force: true}).then(()=> {
Attendee.sync().then(()=> {
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

    app.get('/sf-python/event-11-08-2017/admin', function (req, res) {
        Attendee.findAll().then(attendees=> {
          var attendeesAttended = attendees.filter(a=> a.checkedIn)
          var amountToSplit = attendees.length - attendeesAttended.length
          var earnPerPerson = 5 + (5 * amountToSplit / attendeesAttended.length)
          console.log(amountToSplit)
          res.render("admin", {attendees: attendees, earnPerPerson: earnPerPerson})
        });
    });


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

    var addressWatcher = new AddressWatcher(client);
    addressWatcher.run();

    var emailWatcher = new EmailWatcher();
    emailWatcher.run();

    app.listen(3000, function () {
      console.log('App listening on port 3000!')
    })
});
