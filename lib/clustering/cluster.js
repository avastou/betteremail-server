'use strict';
var clusterfck = require('clusterfck');

function normalize(x) {
    return 1 - (1 / (1 + x));
    // if (x < -3)
    //     return -1;
    // else if (x > 3)
    //     return 1;
    // else
    //     return x * (27 + x * x) / (27 + 9 * x * x);
}

var intersect = function intersect(a1, a2) {
    // var len = Math.max(email1.annotation.length, email2.annotation.length);
    // var count = 0;
    var a = [],
        intersection = [];
    for (var i = 0; i < a1.length; i++) {
        a[a1[i]] = true;
    }
    for (i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            intersection.push(a2[i]);
        }
    }

    return intersection;

};

var annotationDistance = function (a1, a2) {
    var a = {},
        sum = 0;
    for (var i = 0; i < a1.length; i++) {
        if (a1[i].nerdType) {
            if (a[a1[i].nerdType]) {
                a[a1[i].nerdType]++;
            } else {
                a[a1[i].nerdType] = 1;
            }
        }
    }

    for (i = 0; i < a2.length; i++) {
        if (a2[i].nerdType) {
            if (a[a2[i].nerdType] > 0) {
                sum++;
                a[a2[i].nerdType]--;
            }
        }
    }

    return sum * sum * sum / 3;
};

var entityLabelDistance = function (e1, e2) {
    var l1, l2, inter;
    l1 = e1.annotations.map(function (annotation) {
        return annotation.label.toUpperCase();
    });
    l2 = e2.annotations.map(function (annotation) {
        return annotation.label.toUpperCase();
    });

    inter = intersect(l1, l2).length;
    return inter * inter * inter * inter / 3;


};
var peopleIntersection = function (e1, e2) {
    function filter(addr) {
        return addr.address;
    }
    var to1 = e1.to || [];
    var to2 = e2.to || [];
    var from1 = e1.from || [];
    var from2 = e2.from || [];
    var p1 = to1.map(filter).join(from1.map(filter)),
        p2 = to2.map(filter).join(from2.map(filter));
    var inter = intersect(p1, p2).length;
    return inter * inter * inter / 3;
};

var dateDistance = function (e1, e2) {
    var d1 = new Date(e1.date);
    var d2 = new Date(e2.date);
    var date = Math.abs(d1 - d2);
    return date * date * date / 3;
};

var flagDistance = function (e1, e2) {
    var inter = intersection(e1.flags, e2.flags);
    return inter * inter * inter  / 3;
};

var distanceH = function (email1, email2) {
    var coeff = [{
            val: annotationDistance(email1.annotations, email2.annotations),
            weigth: 0.4
    }, {
            val: peopleIntersection(email1, email2),
            weigth: 0.4
    }, {
            val: dateDistance(email1, email2),
            weigth: 0.2
    }, {
            val: entityLabelDistance(email1, email2),
            weigth: 0
    }];

    return 1 - coeff.reduce(function (sum, elem) {
        return sum + normalize(elem.val) * elem.weigth;
    }, 0);
};

var distanceKM = function (email1, email2) {
    var coeff = [{
            val: annotationDistance(email1.annotations, email2.annotations),
            weigth: 0
        }, {
            val: peopleIntersection(email1, email2),
            weigth: 0.2
        }, {
            val: dateDistance(email1, email2),
            weigth: 0.02
        }, {
            val: entityLabelDistance(email1, email2),
            weigth: 0.78
        }];

    return 1 - coeff.reduce(function (sum, elem) {
        return sum + normalize(elem.val) * elem.weigth;
    }, 0);
};

module.exports = function () {
    return {
        hierarchical: function (emails) {
            var clusters = clusterfck.hcluster(emails, distanceH, 'average');
            return clusters;
        },
        kmeans: function (emails, ctd) {
            var k = ctd ? ctd.length : Math.floor(Math.sqrt(emails.length / 2));
            var clusters = clusterfck.kmeans(emails, k, distanceKM, ctd);
            return clusters;
        }
    };
};
