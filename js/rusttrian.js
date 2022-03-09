
var TR = {
    "defaults": {
        "grid_size": 100
    }
};

TR.translateGrid = function(gridloc) {
    
    let grid_size = TR.defaults.grid_size;
    
    // calculate coord of top/left corner
    let ynumb = (parseInt(gridloc.replace(/\D/g, ""), 10));
    let xchar = gridloc.substr(0, gridloc.indexOf(ynumb)).toLowerCase();
    
    //console.log(gridloc, ynumb, xchar);

    // need to convert letters to number
    // Only works for a range of grid coordinates from 'A' to 'ZZ'
    let xnumb = xchar.charCodeAt(0) - 97; // 97 is 'a'
    if (xchar.length > 1) {
        xnumb = ((xnumb + 1) * 26) + (xchar.charCodeAt(1) - 97)
    }

    let x = xnumb * grid_size;
    let y = (ynumb - 1) * grid_size;
    //console.log(xnumb, ynumb, x, y);

    // only expects grid coordinates in forms: C9, E15
    // where letter is A-Z
    // returns four corners of grid
    return ([
        {x:x, y:y},
        {x:x + grid_size, y:y},
        {x:x + grid_size, y:y + grid_size},
        {x:x, y:y + grid_size},
    ]);
};

TR.triangulate = function(gridloc1, gridloc2, dir1, dir2) {
    let locs1 = TR.translateGrid(gridloc1);
    let locs2 = TR.translateGrid(gridloc2);

    //console.log(locs1, locs2);
    points = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            points.push(TR.getIntersection(locs1[i], locs2[j], dir1, dir2));
        }
    }
    return points;
};

TR.getIntersection = function(xy1, xy2, dir1, dir2) {
    console.log(xy1, dir1);
    console.log(xy2, dir2);
    
    // if both lines are parallel or both vertical - return false
    if (dir1 === dir2 || (dir1%180 === 0 && dir2%180 === 0)) {
        return false;
    }

    // calculate slopes
    let m1 = 1/Math.tan(dir1/180*Math.PI)
    let m2 = 1/Math.tan(dir2/180*Math.PI)
    
    // calc y intercept (b)
    b1 = xy1.y - (m1 * xy1.x)
    b2 = xy2.y - (m2 * xy2.x)

    // exceptions when one of the two lines is vertical
    if (dir1%180 === 0) {
        //console.log("dir1 is vertical");
        return {x:xy1.x, y:Math.round(m2*xy1.x + b2)};
    }
    if (dir2%180 === 0) {
        //console.log("dir2 is vertical");
        return {x:xy2.x, y:Math.round(m1*xy2.x + b1)};
    }

    //console.log('slopes', m1, m2);
    //console.log('y-intercepts:', b1, b2);

    // As per: https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection#Given_two_line_equations
    // As:  ax + c  = bx  + d
    // is: m1x + b1 = m2x + b2
    // Want: x = (d-c)/(a-b)
    // And:  y = (a(d-c)/(a-b))+c
    x = (b2-b1)/(m1-m2)
    y = (m1*(b2-b1)/(m1-m2)) + b1

    console.log('e', {x:Math.round(x), y:Math.round(y)});

    return {x:Math.round(x), y:Math.round(y)};
};

TR.test = function(test_num) {
    switch (test_num) {
        case 1:
            console.log("C9");
            let d = TR.translateGrid("C9");
            console.log(d);
            d = TR.translateGrid("x23");
            console.log(d);
            console.log("a1");
            d = TR.translateGrid("a1");
            console.log(d);
            d = TR.translateGrid("ac12");
            console.log(d);
            break;

        case 2:
            // use negative directions as we've inerted the model
            let t = TR.triangulate("e5", "j10", -0, -270);
            console.log(t, 'expect', '[400,900]');

            t = TR.triangulate("e5", "j10", -20, -250);
            console.log(t, 'expect', '[533,767]');

            t = TR.triangulate("e5", "j10", -90, -180);
            console.log(t, 'expect', '[900,400]');

            t = TR.triangulate("a1", "l12", -180, -270);
            console.log(t, 'expect', '[900,400]');
            break;

        default:
            console.log(test_num);
    };
};

TR.process = function() {
    // retrieve values and do the work
    let l1 = document.getElementById('l1').value;
    let l2 = document.getElementById('l2').value;
    // we invert the direction because our model is partially inverted
    let d1 = -parseInt(document.getElementById('d1').value, 10);
    let d2 = -parseInt(document.getElementById('d2').value, 10);

    let gc1 = TR.translateGrid(l1);
    let gc2 = TR.translateGrid(l2);

    let points = TR.triangulate(l1, l2, d1, d2);
    let allpoints = points.concat(gc1, gc2);
    //console.log(allpoints);

    // get bounds
    let bounds = {"xmin": null, "ymin": null, "xmax": null, "ymax": null};
    for (let k = 0; k < allpoints.length; k+=1) {
        let p = allpoints[k];
        if (bounds.xmax === null || p.x > bounds.xmax) {
            bounds.xmax = p.x;
        }
        if (bounds.ymax === null || p.y > bounds.ymax) {
            bounds.ymax = p.y;
        }
        if (bounds.xmin === null || p.x < bounds.xmin) {
            bounds.xmin = p.x;
        }
        if (bounds.ymin === null || p.y < bounds.ymin) {
            bounds.ymin = p.y;
        }
    }

    //console.log(bounds);

    // remove svg if exists
    d3.select("#figure").remove();

    // create SVG
    let padding = 50;
    let svg = d3.select("#results")
        .append("svg")
        .attr("id", "figure")
        .attr("viewBox",
            (bounds.xmin - padding) + " " + (bounds.ymin - padding) + " " +
            (bounds.xmax - bounds.xmin + (2 * padding)) + " " + (bounds.ymax - bounds.ymin + (2 * padding)))
       // viewBox x, y, w, h
                        
        //.attr("width", width + margin.left + margin.right)
        .attr("width", "100%")
        .attr("height", "400");
    
    // draw polygon
    let poly = QuickHull(points);
    console.log(poly);

    svg.append("g")
        .selectAll("polygon")
        .data([poly])
        .enter()
        .append("polygon")
        .attr("points", (d) => d.map(function(e) { return e.x + "," + e.y}).join(" "))
        .attr("opacity", 0.5)
        .attr("stroke", "green")
        .attr("stroke-width", 2);
    
    // Add the points
    svg.append("g")
        .selectAll("circle")
        .data(points)
        .enter().append("circle")
        .style("fill", "green")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", 20);
    
    svg.append("g")
        .selectAll("circle")
        .data(gc1.concat(gc2))
        .enter().append("circle")
        .style("fill", "blue")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", 20);

};

// initialization
(function(){
    document.getElementById('start').onclick = TR.process;
}());
