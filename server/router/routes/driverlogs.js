'use strict';

var DriverLog = require('../../db/models').DriverLog;
var Driver = require('../../db/models').Driver;
var getUserId = require('../helpers').getUserId;

var opts = {};
if(process.env.NODE_ENV === 'production' || 'staging') {
    var organizationId = '';
    opts = { organization: organizationId };
}

module.exports = {

    // many drivers
    // TODO: query filter options and functionality
    getAll: function(req, res) {
        // getUserId(req).then(function(organizationId) {
            Driver.findAll({ 
                where: opts,
                include: [{
                    model: DriverLog,
                    where: opts,
                    require: false
                }]
            }).then(function(drivers) {
                res.json(drivers);
            })
            .catch(function(err) {
                console.error(err);
                res.status(500).json({ error: err });
            });
    },

    // one driver
    // TODO: query filter options and functionality
    getByDriverId: function(req, res) {
        DriverLog.findById(req.params.id).then(function(logs) {
            res.json(logs);
        }).catch(function(err) {
            console.error(err);
            res.status(500).json({ error: err });
        });
    },

    // pertains to a specific driver
    save: function(req, res) {
        // getUserId(req).then(function(organizationId) {
            // var driverId = req.params.driverId || req.body.driverId;
            Driver.findById(req.body.driverId).then(function(driver) {
                DriverLog.create({
                    uberRevenue: req.body.uberRevenue,
                    tollCosts: req.body.tollCosts,
                    gasCosts: req.body.gasCosts,
                    deposit: req.body.deposit,
                    hours: req.body.hours,
                    acceptRate: req.body.acceptRate,
                    additions: req.body.additions,
                    subtractions: req.body.subtractions,
                    payout: req.body.payout,
                    profit: req.body.profit,
                    organization: organizationId
                }).then(function(log) {
                    driver.addLog([log.id]).then(function() {
                        console.log('Driver ' + driver.id + ' has new log.');
                        res.json(log.dataValues);
                    });
                });
            }).catch(function(err) {
                console.error(err);
                res.status(500).json({ error: err });
            });
        // }).catch(function(err) {
        //     console.error(err);
        //     res.status(500).json({ error: err });
        // });
    },

    update: function(req, res) {
        DriverLog.update({
            uberRevenue: req.body.uberRevenue,
                tollCosts: req.body.tollCosts,
                gasCosts: req.body.gasCosts,
                deposit: req.body.deposit,
                hours: req.body.hours,
                acceptRate: req.body.acceptRate,
                additions: req.body.additions,
                subtractions: req.body.subtractions,
                payout: req.body.payout,
                profit: req.body.profit
        }, {
            where: {
                // driverId: req.params.id, 
                id: req.params.id
            }
        })
        .then(function() {
            res.status(200).json({ msg: 'Updated log for driver ' + req.params.id });
        })
        .catch(function(err) {
            console.error(err);
            res.status(500).json({ error: err });
        });
    },

    delete: function(req, res) {
        DriverLog.destroy({
            where: {
                driverId: req.params.id,
                id: req.body.driverLogId
                // userId: req.user.customData._id
            }
        })
        .then(function() {
            res.status(200).json({ msg: 'Deleted driver log.' });
        })
        .catch(function(err) {
            console.error(err);
            res.status(500).json({ error: err });
        });
    }
}