const Attendee = require('./models');
const MG_API_KEY = require('./keys').MG_API_KEY;

var mailgun = require('mailgun-js')({apiKey: MG_API_KEY,
                                     domain: "sandboxe6f9fe56bcb74c1da1c4051e5b6af190.mailgun.org"});


function sendEmail(email) {
    var data = {
      from: "info@trustpool.com",
      to: email,
      subject: 'TrustPool received your payment!',
      html: '<b>You are ready to go!</b> open <a href="#">this</a> link when you arrive at the venue'
    };

    mailgun.messages().send(data, function (error, body) {
        console.log('email sent to ' + email);
        Attendee.update({
            sentEmail: true
        }, {
            where: {
                email: {
                    $eq: email
                }
            }
        });
    });
}


class EmailWatcher{
    run() {
        setInterval(() => {
            Attendee.findAll({
              where: {
                paid: true,
                sentEmail: false
              }
            }).then(function(res) {
                res.forEach(a => sendEmail(a.email));
            });
        }, 5000);
    }
}


class AddressWatcher{
    constructor(client) {
        this.client = client;
    }
    run() {
        setInterval(() => {
            this.client.listUnspent(function(err, diff) {
                Attendee.update({
                  paid: true,
                }, {
                  where: {
                    address: {
                      $in: Array.from(new Set(diff.map(el=> el.address)))
                    },
                    paid: false
                  }
                }).then(function(res) {
                    console.log(res);
                });
            });
        }, 3000);
    }
}

module.exports = {
    AddressWatcher: AddressWatcher,
    EmailWatcher: EmailWatcher,
};
