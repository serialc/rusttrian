
var TR = {
    "defaults": {
        "grid_size": 100
    }
};

TR.translateGrid = function(gridloc) {
    // may need to change this to an array if we need more than 26
    let letters = "abcdefghijklmnopqrstuvwxyz";
    let grid_size = TR.defaults.grid_size;
    
    // calculate coord of top/left corner
    let ynumb = (parseInt(gridloc.replace(/\D/g, ""), 10));
    let xchar = gridloc.substr(0, gridloc.indexOf(ynumb));

    let x = letters.indexOf(xchar.toLowerCase()) * grid_size;
    let y = (ynumb - 1) * grid_size;
    //console.log(xchar, ynumb, x, y);

    // only expects grid coordinates in forms: C9, E15
    // where letter is A-Z
    // returns four corners of grid
    return ([
        [x, y],
        [x , y],
        [x, y],
        [x, y],
    ]);
};
TR.triangulate = function(gridloc1, gridloc2, dir1, dir2) {
    let loc1 = TR.translateGrid(gridloc1);
    let loc2 = TR.translateGrid(gridloc2);
};
TR.test = function(test_num) {
    switch (test_num) {
        case 1:
            let d = TR.translateGrid("C9");
            console.log(d);
            d = TR.translateGrid("x23");
            console.log(d);
            d = TR.translateGrid("a1");
            console.log(d);
            break;

        case 2:
            let t = TR.triangulate("e10", "j5", 0, 270);
            console.log(t);

            break;

        default:
            console.log(test_num);
    };
};
