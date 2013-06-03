var di = require('di'),
    m = module.exports = new di.Module();

m.factory('cluster', require('../clustering/cluster'));
m.factory('clusterManager', require('../clustering/clusterManager'));
