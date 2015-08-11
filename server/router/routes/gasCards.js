'use strict';

var models = require('../../db/models');
var GasCard = models.GasCard;
var Driver = models.Driver;

module.exports = {
    get: function(req, res) {
        GasCard.findAll().then(function(cards) {
            res.json(cards);
        })
        .catch(function(err) {
            console.error(err);
            res.status(500).json({ error: err });
        });
    },

    save: function(req, res) {
        GasCard.create({
            number: req.body.number
        }).then(function(card) {
            Driver.findById(req.body.driverId).then(function(driver) {
                driver.addGasCard([card.id]);
            });
            // card.addDriver([req.body.driverId]);
        }).catch(function(err) {
            console.error(err);
        });
    },

    delete: function(req, res) {
        GasCard.destroy({
            where: {
                id: req.params.id
            }
        }) 
        .then(function() {
            res.status(200).json({ msg: 'Deleted gas card where id = ' + req.params.id });
        })
        .catch(function(err) {
            console.error(err);
            res.status(500).json({ error: err });
        });
    }
};