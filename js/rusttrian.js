
var TR = {
    "defaults": {
        "grid_size": 100
    },
    "zoom": false
};

TR.translateGrid = function(gridloc) {
    'use strict'
    
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

    if (isNaN(x) || isNaN(y)) {
        return false;
    }

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
    'use strict'

    let locs1 = TR.translateGrid(gridloc1);
    let locs2 = TR.translateGrid(gridloc2);

    if (locs1 === false || locs2 === false) {
        return false;
    }

    //console.log(locs1, locs2);
    let points = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            points.push(TR.getIntersection(locs1[i], locs2[j], dir1, dir2));
        }
    }
    return points;
};

TR.getIntersection = function(xy1, xy2, dir1, dir2) {
    'use strict'

    //console.log(xy1, dir1);
    //console.log(xy2, dir2);
    
    // if both lines are parallel or both vertical - return false
    if (dir1 === dir2 || (dir1%180 === 0 && dir2%180 === 0)) {
        return false;
    }

    // calculate slopes
    let m1 = 1/Math.tan(dir1/180*Math.PI)
    let m2 = 1/Math.tan(dir2/180*Math.PI)
    
    // calc y intercept (b)
    let b1 = xy1.y - (m1 * xy1.x)
    let b2 = xy2.y - (m2 * xy2.x)

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
    let x = (b2-b1)/(m1-m2)
    let y = (m1*(b2-b1)/(m1-m2)) + b1

    //console.log('e', {x:Math.round(x), y:Math.round(y)});

    return {x:Math.round(x), y:Math.round(y)};
};


TR.test = function(test_num) {
    'use strict'
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

TR.process = function(event) {
    'use strict'

    event.preventDefault();

    // retrieve values and do the work
    let el1 = document.getElementById("l1");
    let el2 = document.getElementById("l2");
    let ed1 = document.getElementById("d1");
    let ed2 = document.getElementById("d2");

    // remove any errors
    el1.classList.remove("is-invalid");
    el2.classList.remove("is-invalid");
    ed1.classList.remove("is-invalid");
    ed2.classList.remove("is-invalid");

    let l1 = el1.value;
    let l2 = el2.value;

    // we invert the direction because our model is partially inverted
    let d1 = -parseInt(ed1.value, 10);
    let d2 = -parseInt(ed2.value, 10);

    let gc1 = TR.translateGrid(l1);
    let gc2 = TR.translateGrid(l2);

    // check if inputs are filled, if not notify
    if (gc1 === false) {
        el1.classList.add("is-invalid");
        return false;
    }
    if (gc2 === false) {
        el2.classList.add("is-invalid");
        return false;
    }
    if (isNaN(d1)) {
        ed1.classList.add("is-invalid");
        return false;
    }
    if (isNaN(d2)) {
        ed2.classList.add("is-invalid");
        return false;
    }

    // get the triangulated area
    let tri_points = TR.triangulate(l1, l2, d1, d2);

    // check we have successful retrieval of points
    if (tri_points === false) {
        return false;
    }

    // combine all points to determine bounds
    let bounds = TR.getBounds(tri_points.concat(gc1, gc2));

    let grid_size = TR.defaults.grid_size;
    let grids = TR.generateGrids(bounds);
    
    // remove svg if exists
    d3.select("#figure").remove();

    // create SVG
    let padding = 10;
    let svg = d3.select("#results")
        .append("svg")
        .attr("id", "figure")
        .attr("viewBox",
            (bounds.xmin - padding) + " " + (bounds.ymin - padding) + " " +
            (bounds.xmax - bounds.xmin + grid_size + (2 * padding)) + " " + (bounds.ymax - bounds.ymin + grid_size + (2 * padding)))
       // viewBox x, y, w, h
                        
        //.attr("width", width + margin.left + margin.right)
        .attr("width", "100%")

    // view paths from grids
    svg.append("g")
        .selectAll("polygon")
        .data([QuickHull(tri_points.concat(gc1))])
        .enter()
        .append("polygon")
        .attr("points", (d) => d.map(function(e) { return e.x + "," + e.y}).join(" "))
        .attr("opacity", 0.3)
        .attr("stroke", "black")
        .attr("fill", "grey");
    svg.append("g")
        .selectAll("polygon")
        .data([QuickHull(tri_points.concat(gc2))])
        .enter()
        .append("polygon")
        .attr("points", (d) => d.map(function(e) { return e.x + "," + e.y}).join(" "))
        .attr("opacity", 0.3)
        .attr("stroke", "black")
        .attr("fill", "grey");

    // draw triangulated polygon
    svg.append("g")
        .selectAll("polygon")
        .data([QuickHull(tri_points)])
        .enter()
        .append("polygon")
        .attr("points", (d) => d.map(function(e) { return e.x + "," + e.y}).join(" "))
        .attr("class", "pointer")
        .on("click", function() { 

            // if click again, reset
            if (TR.zoom) {
                TR.zoom = false;
                d3.select("#figure")
                    .attr("viewBox", d3.select("#figure").attr("altviewBox"));
                return;
            }

            TR.zoom = true;
            let tri_bounds = TR.getBounds(tri_points);

            d3.select("#figure")
            .attr("altviewBox", d3.select("#figure").attr("viewBox"))
            .attr("viewBox",
                (tri_bounds.xmin - padding) + " " + (tri_bounds.ymin - padding) + " " +
                (tri_bounds.xmax - tri_bounds.xmin + (2 * padding)) + " " + (tri_bounds.ymax - tri_bounds.ymin + (2 * padding)));
        })
        .attr("fill", "green");

    // draw grid polygons
    svg.append("g")
        .selectAll("polygon")
        .data([gc1])
        .enter()
        .append("polygon")
        .attr("points", (d) => d.map(function(e) { return e.x + "," + e.y}).join(" "))
        .attr("fill", "orange");
    svg.append("g")
        .selectAll("polygon")
        .data([gc2])
        .enter()
        .append("polygon")
        .attr("points", (d) => d.map(function(e) { return e.x + "," + e.y}).join(" "))
        .attr("fill", "orange");
    
    // Add the points
    /**
    svg.append("g")
        .selectAll("circle")
        .data(tri_points)
        .enter().append("circle")
        .attr("fill", "green")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", 20);
    
    svg.append("g")
        .selectAll("circle")
        .data(gc1.concat(gc2))
        .enter().append("circle")
        .attr("fill", "blue")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", 20);
    **/

    // draw grids
    svg.append("g")
        .selectAll("rect")
        .data(grids)
        .enter().append("rect")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .attr("width", grid_size)
        .attr("height", grid_size)
        .attr("stroke", "grey")
        .attr("stroke-width", 4)
        .attr("fill", "none");
    
    // Add grid names
    svg.append("g")
        .selectAll("text")
        .data(grids)
        .enter().append("text")
        .attr("x", (d) => d.x + 0.1 * grid_size)
        .attr("y", (d) => d.y + 0.3 * grid_size)
        .attr("font-size", "2em")
        .text( (d) => d.name );

    TR.createGrid("l1g", l1);
    TR.createGrid("l2g", l2);

    // display the advanced options
    document.getElementById("advanced_options").classList.remove("d-none");
    document.getElementById("advanced").disabled = true;

    // holds/resets the advanced options
    TR.aloc = {
        "one": null,
        "two": null
    };
};

TR.generateGrids = function(bounds) {
    "use strict"

    let grid_size = TR.defaults.grid_size;

    let grids = [];
    // generate grid coordinates
    for (let x = Math.floor(bounds.xmin/grid_size) * grid_size; x < Math.ceil(bounds.xmax/grid_size) * grid_size; x+=grid_size) {
        for (let y = Math.floor(bounds.ymin/grid_size) * grid_size; y < Math.ceil(bounds.ymax/grid_size) * grid_size; y+=grid_size) {
            let grid_letter = String.fromCharCode((x/grid_size) + 97).toUpperCase();
            if (x < 0) { grid_letter = ""; }
            // handle if x/grid_size > 26 (or letter should be greater than Z (e.g., AB)
            if ((x/grid_size) > 25) {
                grid_letter = 'A' + String.fromCharCode((x/grid_size) - 26 + 97).toUpperCase();
            }
            let grid_num = (y/grid_size) + 1;
            grids.push({
                    "x": x,
                    "y": y,
                    "name": grid_letter + grid_num
                });
        }
    }
    return grids;
};

TR.getBounds = function(points) {
    'use strict'

    // get bounds
    let bounds = {"xmin": null, "ymin": null, "xmax": null, "ymax": null};
    for (let k = 0; k < points.length; k+=1) {
        let p = points[k];
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

    return bounds;
};

TR.createGrid = function(target, grid_name) {
    'use strict'

    let e = document.getElementById(target);
    let grid_size = TR.defaults.grid_size;

    d3.select("#" + target + "svg").remove();

    let padding = 20;

    let svg = d3.select("#" + target)
        .append("svg")
        .attr("id", target + "svg")
        .attr("width", "100")
        .attr("height", "100")
        .attr("viewBox", "-" + padding + " -" + padding + " " + (grid_size + (2*padding)) + " " + (grid_size + (2*padding)));

    svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", grid_size)
        .attr("height", grid_size)
        .attr("stroke", "grey")
        .attr("stroke-width", 4)
        .attr("fill", "none");

    svg.append("text")
        .attr("x", 0.1 * grid_size)
        .attr("y", 0.3 * grid_size)
        .attr("font-size", "2em")
        .text( grid_name.toUpperCase() );

    // add points to grid
    let gpoints = [];
    for (let x = 0; x <= grid_size; x+=(grid_size/2)) {
        for (let y = 0; y <= grid_size; y+=(grid_size/2)) {
            gpoints.push({"x": x, "y": y});
        }
    }
    svg.append("g")
        .selectAll("circle")
        .data(gpoints)
        .enter().append("circle")
        .on("click", function() { 
            // reset all to green
            svg.selectAll("circle")
                .attr("fill", "green");

            // but this one to blue
            this.setAttribute("fill", "blue");

            if (target === "l1g") {
                TR.aloc.one = {
                    "x": parseInt(this.getAttribute("cx"), 10),
                    "y": parseInt(this.getAttribute("cy"), 10)
                };
            }
            if (target === "l2g") {
                TR.aloc.two = {
                    "x": parseInt(this.getAttribute("cx"), 10),
                    "y": parseInt(this.getAttribute("cy"), 10)
                };
            }

            // enable the advanced submission
            if (TR.aloc.one !== null && TR.aloc.two !== null) {
                document.getElementById("advanced").disabled = false;
            }
        })
        .attr("fill", "green")
        .attr("opacity", 0.5)
        .attr("class", "hover")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", 20);

};

TR.processAdvanced = function(event) {
    'use strict'

    event.preventDefault();

    // retrieve values and do the work
    let el1 = document.getElementById("l1");
    let el2 = document.getElementById("l2");
    let ed1 = document.getElementById("d1");
    let ed2 = document.getElementById("d2");

    let l1 = el1.value;
    let l2 = el2.value;

    // we invert the direction because our model is partially inverted
    let d1 = -parseInt(ed1.value, 10);
    let d2 = -parseInt(ed2.value, 10);

    let gc1_grid = TR.translateGrid(l1);
    let gc2_grid = TR.translateGrid(l2);

    let gc1 = TR.translateGrid(l1)[0];
    let gc2 = TR.translateGrid(l2)[0];

    gc1.x += TR.aloc.one.x;
    gc1.y += TR.aloc.one.y;
    gc2.x += TR.aloc.two.x;
    gc2.y += TR.aloc.two.y;

    // get the area of triangulation
    let tri_points = [];
    tri_points.push(TR.getIntersection(gc1, gc2, d1-1, d2-1));
    tri_points.push(TR.getIntersection(gc1, gc2, d1-1, d2+1));
    tri_points.push(TR.getIntersection(gc1, gc2, d1+1, d2-1));
    tri_points.push(TR.getIntersection(gc1, gc2, d1+1, d2+1));
    
    // combine all points to determine bounds
    let bounds = TR.getBounds(tri_points.concat(gc1_grid, gc2_grid));

    let grid_size = TR.defaults.grid_size;
    let grids = TR.generateGrids(bounds);
    
    // create SVG
    let padding = 10;
    let svg = d3.select("#results")
        .append("svg")
        .attr("id", "figure")
        .attr("viewBox",
            (bounds.xmin - padding) + " " + (bounds.ymin - padding) + " " +
            (bounds.xmax - bounds.xmin + grid_size + (2 * padding)) + " " + (bounds.ymax - bounds.ymin + grid_size + (2 * padding)))
       // viewBox x, y, w, h
                        
        //.attr("width", width + margin.left + margin.right)
        .attr("width", "100%")
    
    // remove svg if exists
    d3.select("#figure").remove();

    // draw grid polygons
    svg.append("g")
        .selectAll("polygon")
        .data([gc1_grid])
        .enter()
        .append("polygon")
        .attr("points", (d) => d.map(function(e) { return e.x + "," + e.y}).join(" "))
        .attr("fill", "orange");
    svg.append("g")
        .selectAll("polygon")
        .data([gc2_grid])
        .enter()
        .append("polygon")
        .attr("points", (d) => d.map(function(e) { return e.x + "," + e.y}).join(" "))
        .attr("fill", "orange");

    // view paths from grids
    svg.append("g")
        .selectAll("polygon")
        .data([QuickHull(tri_points.concat(gc1))])
        .enter()
        .append("polygon")
        .attr("points", (d) => d.map(function(e) { return e.x + "," + e.y}).join(" "))
        .attr("opacity", 0.3)
        .attr("stroke", "black")
        .attr("fill", "grey");
    svg.append("g")
        .selectAll("polygon")
        .data([QuickHull(tri_points.concat(gc2))])
        .enter()
        .append("polygon")
        .attr("points", (d) => d.map(function(e) { return e.x + "," + e.y}).join(" "))
        .attr("opacity", 0.3)
        .attr("stroke", "black")
        .attr("fill", "grey");
    

    // draw triangulated polygon
    svg.append("g")
        .selectAll("polygon")
        .data([QuickHull(tri_points)])
        .enter()
        .append("polygon")
        .attr("points", (d) => d.map(function(e) { return e.x + "," + e.y}).join(" "))
        .attr("class", "pointer")
        .on("click", function() { 

            // if click again, reset
            if (TR.zoom) {
                TR.zoom = false;
                d3.select("#figure")
                    .attr("viewBox", d3.select("#figure").attr("altviewBox"));
                return;
            }

            TR.zoom = true;
            let tri_bounds = TR.getBounds(tri_points);

            d3.select("#figure")
            .attr("altviewBox", d3.select("#figure").attr("viewBox"))
            .attr("viewBox",
                (tri_bounds.xmin - padding) + " " + (tri_bounds.ymin - padding) + " " +
                (tri_bounds.xmax - tri_bounds.xmin + (2 * padding)) + " " + (tri_bounds.ymax - tri_bounds.ymin + (2 * padding)));
        })
        .attr("fill", "green");

    // draw grids
    svg.append("g")
        .selectAll("rect")
        .data(grids)
        .enter().append("rect")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .attr("width", grid_size)
        .attr("height", grid_size)
        .attr("stroke", "grey")
        .attr("stroke-width", 4)
        .attr("fill", "none");
    
    // Add grid names
    svg.append("g")
        .selectAll("text")
        .data(grids)
        .enter().append("text")
        .attr("x", (d) => d.x + 0.1 * grid_size)
        .attr("y", (d) => d.y + 0.3 * grid_size)
        .attr("font-size", "2em")
        .text( (d) => d.name );
};

// initialization
(function(){
    'use strict'
    document.getElementById('start').onclick = TR.process;
    document.getElementById('advanced').onclick = TR.processAdvanced;
}());
