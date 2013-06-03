'use strict';

function showEmail(email) {
    var subj = email.subject || 'NO SUBJECT',
        id = email['x-gm-msgid'],
        from = (email.from && email.from[0] && (email.from[0].address || email.from[0].name)) || 'NO SENDER';
    console.log(id, subj, '[' + from + ']');
}

module.exports = function (cluster) {
    return {
        divideEmails: function (emails, lim) {
            emails.sort(function () {
                return (Math.round(Math.random()) - 0.5);
            });
            var c = cluster.hierarchical(emails.filter(function (elem, index) {
                return index < emails.length / 10;
            }));

            var clusters = [];
            var current = 0;
            console.log('Emails to process: ' + emails.length);
            var limit = lim || emails.length / 30;

            function fillCluster(cluster, node) {
                if (node.value) {
                    cluster.push(node.value);
                    return;
                }
                fillCluster(cluster, node.left);
                fillCluster(cluster, node.right);
            }

            (function navigateCustom(node, depth) {
                if (node.size < limit) {
                    clusters[current] = [];
                    fillCluster(clusters[current], node);
                    current++;
                    return;
                }
                navigateCustom(node.left, depth);
                navigateCustom(node.right, depth);
            }(c));


            var centroids = [];
            clusters.forEach(function (cluster) {
                if (cluster.length >= limit * 0.1) {
                    var i = Math.floor(Math.random() * (cluster.length - 1));
                    // console.log('Index:',i);
                    centroids.push(cluster[i]);
                }
            });
            console.log(centroids.length);
            clusters = cluster.kmeans(emails, centroids);

            // clusters.forEach(function (cluster, index) {
            //     console.log('-------------------------- cluster #' + index + ' size: ' + cluster.length + ' --------------------------');
            //     // console.log(cluster.length);
            //     cluster.sort(function () {
            //         return (Math.round(Math.random()) - 0.5);
            //     });
            //     for (var i = 0; i < Math.min(100, cluster.length); i++) {
            //         showEmail(cluster[i]);
            //     }
            // });

            return clusters;
        }
    };
};
