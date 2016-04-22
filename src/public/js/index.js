///<reference path="./typings/main.d.ts"/>

var json = require("../data/offers").Collection;
var d3 = require('d3');
var w = 1280,
    h = 800;

window.onload = function() {
    draw(json);

    d3.select("#rejected")
        .on("click", () => {
            var filtered = json.filter((offer) => {
                return offer.OfferStatus.SystemName === "Rejected";
            })
            draw(filtered);
        })

    d3.select("#accepted")
        .on("click", () => {
            var filtered = json.filter((offer) => {
                return offer.OfferStatus.SystemName === "Accepted";
            })
            draw(filtered);
        })

    d3.select("#pending")
        .on("click", () => {
            var filtered = json.filter((offer) => {
                return offer.OfferStatus.SystemName === "Pending";
            })
            draw(filtered);
        })

    d3.select("#all")
        .on("click", () => {
            draw(json);
        })
}

function draw(json) {
    json.unshift(json[0]);
    render(json);
}

function render(json) {
    d3.select("#host").selectAll("*").remove();

    var w = 500;
    var h = 500;

    var nodes = json.map(function(d, i) {
        return {
            radius: 15,
            color: () => {
                switch (d.OfferStatus.SystemName) {
                    case "Pending":
                        return "yellow";
                    case "Accepted":
                        return "green"
                    case "Rejected":
                        return "red"
                }
            }
        };
    });

    var force = d3.layout.force()
        .gravity(0.05)
        .charge(function(d, i) {
            return i ? 0 : -2000;
        })
        .nodes(nodes)
        .size([w, h]);

    var root = nodes[0];
    root.radius = 0;
    root.fixed = true;

    force.start();

    var svg = d3.select("#host").append("svg:svg")
        .attr("width", w)
        .attr("height", h);

    svg.selectAll("circle")
        .data(nodes)
        .enter().append("svg:circle")
        .attr("r", function(d) {
            return d.radius;
        })
        .style("fill", function(d, i) {
            return d.color();
        });

    force.on("tick", function(e) {
        var q = d3.geom.quadtree(nodes),
            i = 0,
            n = nodes.length;
        while (++i < n) {
            q.visit(collide(nodes[i]));
        }
        svg.selectAll("circle")
            .attr("cx", function(d) {
                return d.x;
            })
            .attr("cy", function(d) {
                return d.y;
            });
    });

    function collide(node) {
        var r = node.radius + 16,
            nx1 = node.x - r,
            nx2 = node.x + r,
            ny1 = node.y - r,
            ny2 = node.y + r;
        return function(quad, x1, y1, x2, y2) {
            if (quad.point && (quad.point !== node)) {
                var x = node.x - quad.point.x,
                    y = node.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y),
                    r = node.radius + quad.point.radius;
                if (l < r) {
                    l = (l - r) / l * .5;
                    node.x -= x *= l;
                    node.y -= y *= l;
                    quad.point.x += x;
                    quad.point.y += y;
                }
            }
            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        };
    }
}
