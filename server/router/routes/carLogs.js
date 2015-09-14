'use strict';

var models = require('../../db/models');
var CarLogs = models.CarLog;
var Cars = models.Car;
var getUserId = require('../helpers').getUserId;

module.exports = {
    getLogs: function(req, res) {
        Cars.findAll({ 
            where: {
                organization: getUserId(req)
            },
            include: [{
                model: CarLogs,
                where: {
                    organization: getUserId(req)
                }
            }]
        }).then(function(cars) {
            res.json(cars);
        })
        .catch(function(err) {
            console.error(err);
            res.status(500).json({ error: err });
        });
    },

    getLog: function(req, res) {
        CarLogs.findById(req.params.id).then(function(logs) {
            res.json(logs);
        })
        .catch(function(err) {
            console.error(err);
            res.status(500).json({ error: err });
        });
    },

    createLog: function(req, res) {
        CarLogs.create({
            tlcNumber: req.body.tlcNumber,
            note: req.body.note,
            organization: getUserId(req)
        }).then(function(log) {
            Car.addCarLog([log.id]).then(function() {
                console.log('Car ' + req.params.id + ' has new log.');
                res.json(log.dataValues);
            });
        })
        .catch(function(err) {
            console.error(err);
            res.status(500).json({ error: err });
        });   
    },

    updateLog: function(req, res) {
        CarLogs.max("mileage", { where: { tlcNumber: req.body.tlcNumber } }).then(function(previouslyCheckedMileage) {
            // check if car needs oil change
            // TODO: user should be able to set thresholdMileage
            var thresholdMileage = 10000;
            var oilChangeRequired = (req.body.mileage - previouslyCheckedMileage >= thresholdMileage) || false;
            Cars.update({
                mileage: req.body.mileage,
                oilChangeRequired: oilChangeRequired
            }, {
                where: {
                    tlcNumber: req.body.tlcNumber,
                    organization: getUserId(req)
                }
            }).then(function() {
                res.status(200).json({ msg: 'Updated log for car ' + req.params.id });    
            }).catch(function(err) {
                console.error(err);
                // res.status(500).json({ error: err });    
            });
        }).catch(function(err) {
            console.error(err);
            res.status(500).json({ error: err });
        });
    },

    deleteLog: function(req, res) {
        CarLogs.destroy({
            where: {
                carId: req.params.id,
                id: req.body.carLogId
            }
        })
        .then(function() {
            res.status(200).json({ msg: 'Deleted car log.' });
        })
        .catch(function(err) {
            console.error(err);
            res.status(500).json({ error: err });
        });
    }
}