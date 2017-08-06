const Attendee = require('./models');
const Mailgun = require('Mailgun').Mailgun;
const MG_API_KEY = require('./keys').MG_API_KEY;
console.log(MG_API_KEY)

var mg = new Mailgun(MG_API_KEY);

function sendEmail(email) {
    console.log(email);
    mg.sendText("info@trustpool.com", [email], "woo!", "test",
        function(err) {
            if (err) {
                console.log(err);
            } else {
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
            }
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
